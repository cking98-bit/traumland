import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  try {
    const ref = adminDb.collection("users").doc(uid)
    const snap = await ref.get()
    let abo = snap.data()?.abo

    if (!abo) return NextResponse.json({ fehler: "Kein Abo" }, { status: 404 })

    // Geplanter Wechsel fällig? Dann neuen Plan aktivieren
    if (abo.naechster_plan?.ab && abo.naechster_plan.ab * 1000 <= Date.now()) {
      const neu = abo.naechster_plan
      await ref.set(
        {
          abo: {
            plan: neu.plan,
            kinder: neu.kinder,
            status: "aktiv",
            naechster_plan: FieldValue.delete(),
          },
        },
        { merge: true }
      )
      abo = { ...abo, plan: neu.plan, kinder: neu.kinder, naechster_plan: undefined }
    }

    if (!abo.stripeSubscriptionId) {
      return NextResponse.json({
        abo,
        nextBilling: null,
        periodStart: null,
        cancelAtPeriodEnd: false,
      })
    }

    try {
      const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = sub as any
      // Stripe API 2025+: Perioden-Daten liegen auf dem Subscription-Item
      const periodEnd =
        s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null
      const periodStart =
        s.current_period_start ?? s.items?.data?.[0]?.current_period_start ?? null
      return NextResponse.json({
        abo,
        nextBilling: periodEnd,
        periodStart,
        cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
      })
    } catch (stripeErr) {
      console.error("Stripe retrieve error:", stripeErr)
      return NextResponse.json({
        abo,
        nextBilling: null,
        periodStart: null,
        cancelAtPeriodEnd: false,
      })
    }
  } catch (err) {
    console.error("abo/details error:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
