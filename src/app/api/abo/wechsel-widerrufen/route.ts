import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { STRIPE_PLAENE, planBetragCents, type StripePlanId } from "@/lib/stripePlaene"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Geplanten Tarifwechsel zurückziehen:
// Stripe-Preis wird auf den aktuellen Plan zurückgestellt,
// die Laufzeit läuft normal weiter.
export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json()
    if (!uid) return NextResponse.json({ fehler: "uid fehlt" }, { status: 400 })

    const ref = adminDb.collection("users").doc(uid)
    const snap = await ref.get()
    const abo = snap.data()?.abo

    if (!abo?.naechster_plan) {
      return NextResponse.json({ fehler: "Kein geplanter Wechsel" }, { status: 400 })
    }
    if (!abo.stripeSubscriptionId) {
      return NextResponse.json({ fehler: "Keine aktive Stripe-Subscription" }, { status: 400 })
    }

    const aktuellerPlan = abo.plan as StripePlanId
    const planInfo = STRIPE_PLAENE[aktuellerPlan]
    if (!planInfo) {
      return NextResponse.json({ fehler: "Unbekannter Plan" }, { status: 400 })
    }

    const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemId = (sub as any).items?.data?.[0]?.id
    if (!itemId) {
      return NextResponse.json({ fehler: "Subscription-Item nicht gefunden" }, { status: 500 })
    }

    // Preis auf den aktuellen Plan zurückstellen
    await stripe.subscriptions.update(abo.stripeSubscriptionId, {
      items: [
        {
          id: itemId,
          price_data: {
            currency: "eur",
            product: planInfo.productId,
            unit_amount: planBetragCents(aktuellerPlan, abo.kinder),
            recurring: { interval: planInfo.interval },
          },
        },
      ],
      proration_behavior: "none",
      cancel_at_period_end: false,
    })

    // Vorgemerkten Wechsel entfernen
    await ref.set(
      {
        abo: {
          status: "aktiv",
          wird_gekuendigt: false,
          naechster_plan: FieldValue.delete(),
        },
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Wechsel-Widerruf Fehler:", err)
    return NextResponse.json({ fehler: "Widerruf fehlgeschlagen" }, { status: 500 })
  }
}
