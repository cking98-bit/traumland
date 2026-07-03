import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLAENE = {
  light: {
    productId: "prod_Uo6s0QhTdjIXI7",
    basisPreis: 10.99,
    proKind: 6.99,
    interval: "month" as const,
  },
  familie: {
    productId: "prod_Uo6sRk71y68Xyz",
    basisPreis: 13.99,
    proKind: 8.99,
    interval: "month" as const,
  },
  "familie-jahr": {
    productId: "prod_Uo6sFeRclIj2oJ",
    basisPreis: 129.99,
    proKind: 79.99,
    interval: "year" as const,
  },
}

export async function POST(req: NextRequest) {
  try {
    const { uid, plan, kinder } = await req.json()
    if (!uid || !plan || !kinder) {
      return NextResponse.json({ fehler: "Angaben unvollständig" }, { status: 400 })
    }

    const planInfo = PLAENE[plan as keyof typeof PLAENE]
    if (!planInfo) {
      return NextResponse.json({ fehler: "Ungültiger Plan" }, { status: 400 })
    }

    const snap = await adminDb.collection("users").doc(uid).get()
    const abo = snap.data()?.abo

    if (!abo?.stripeSubscriptionId) {
      return NextResponse.json({ fehler: "Keine aktive Stripe-Subscription" }, { status: 400 })
    }

    // Jahrestarif kann nur gekündigt werden, kein Wechsel
    if (abo.plan === "familie-jahr") {
      return NextResponse.json({ fehler: "Jahrestarif kann nur gekündigt werden" }, { status: 400 })
    }

    const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = sub as any
    const itemId = s.items?.data?.[0]?.id
    const periodEnd =
      s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null

    if (!itemId) {
      return NextResponse.json({ fehler: "Subscription-Item nicht gefunden" }, { status: 500 })
    }

    const betrag = planInfo.basisPreis + Math.max(0, kinder - 1) * planInfo.proKind
    const betragCents = Math.round(betrag * 100)

    // Preis zum nächsten Abrechnungszeitraum wechseln:
    // proration_behavior "none" = aktueller Zeitraum bleibt wie bezahlt,
    // ab der nächsten Rechnung gilt der neue Preis.
    await stripe.subscriptions.update(abo.stripeSubscriptionId, {
      items: [
        {
          id: itemId,
          price_data: {
            currency: "eur",
            product: planInfo.productId,
            unit_amount: betragCents,
            recurring: { interval: planInfo.interval },
          },
        },
      ],
      proration_behavior: "none",
      cancel_at_period_end: false,
    })

    // Firestore: aktueller Plan bleibt bis zum Periodenende aktiv,
    // der neue Plan wird als "naechster_plan" vorgemerkt
    await adminDb.collection("users").doc(uid).set(
      {
        abo: {
          status: "aktiv",
          wird_gekuendigt: false,
          naechster_plan: {
            plan,
            kinder: Number(kinder),
            ab: periodEnd,
          },
        },
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, ab: periodEnd })
  } catch (err) {
    console.error("Abo-Wechsel Fehler:", err)
    return NextResponse.json({ fehler: "Wechsel fehlgeschlagen" }, { status: 500 })
  }
}
