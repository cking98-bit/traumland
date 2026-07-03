import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { STRIPE_PLAENE, planBetragCents, type StripePlanId } from "@/lib/stripePlaene"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Weiteres Kind zum laufenden Vertrag hinzufügen:
// Stripe-Preis wird auf die neue Kinderanzahl angehoben
// (anteilig ab sofort, verrechnet mit der nächsten Rechnung)
export async function POST(req: NextRequest) {
  try {
    const uid = await verifiziereNutzer(req)
    if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

    const ref = adminDb.collection("users").doc(uid)
    const snap = await ref.get()
    const abo = snap.data()?.abo

    if (!abo?.plan) {
      return NextResponse.json({ fehler: "Kein aktives Abo" }, { status: 400 })
    }

    const plan = abo.plan as StripePlanId
    const planInfo = STRIPE_PLAENE[plan]
    if (!planInfo) {
      return NextResponse.json({ fehler: "Unbekannter Plan" }, { status: 400 })
    }

    const neueKinder = (abo.kinder ?? 1) + 1

    // Stripe-Subscription auf den neuen Preis anheben
    if (abo.stripeSubscriptionId) {
      const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemId = (sub as any).items?.data?.[0]?.id
      if (!itemId) {
        return NextResponse.json({ fehler: "Subscription-Item nicht gefunden" }, { status: 500 })
      }

      await stripe.subscriptions.update(abo.stripeSubscriptionId, {
        items: [
          {
            id: itemId,
            price_data: {
              currency: "eur",
              product: planInfo.productId,
              unit_amount: planBetragCents(plan, neueKinder),
              recurring: { interval: planInfo.interval },
            },
          },
        ],
        // Anteiliger Aufpreis wird mit der nächsten Rechnung verrechnet
        proration_behavior: "create_prorations",
      })
    }

    await ref.set({ abo: { kinder: neueKinder } }, { merge: true })

    return NextResponse.json({ ok: true, kinder: neueKinder })
  } catch (err) {
    console.error("Kind hinzufügen Fehler:", err)
    return NextResponse.json({ fehler: "Fehlgeschlagen" }, { status: 500 })
  }
}
