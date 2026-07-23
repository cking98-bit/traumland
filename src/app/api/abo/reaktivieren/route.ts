import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Zieht eine ausstehende Kündigung zurück, solange die Subscription
// bei Stripe noch aktiv ist (also vor dem Laufzeitende). Danach lehnt
// Stripe die Änderung ab, weil die Subscription final gekündigt wurde –
// dann ist nur noch ein neuer Vertragsabschluss möglich.
export async function POST(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  try {
    const ref = adminDb.collection("users").doc(uid)
    const snap = await ref.get()
    const abo = snap.data()?.abo

    if (!abo?.stripeSubscriptionId) {
      return NextResponse.json({ fehler: "Keine Stripe-Subscription gefunden" }, { status: 400 })
    }

    const sub = await stripe.subscriptions.update(abo.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    await ref.set({ abo: { wird_gekuendigt: false } }, { merge: true })

    return NextResponse.json({ ok: true, status: sub.status })
  } catch (err) {
    console.error("Reaktivierung Fehler:", err)
    return NextResponse.json(
      { fehler: "Reaktivierung fehlgeschlagen – der Vertrag ist möglicherweise bereits ausgelaufen" },
      { status: 400 }
    )
  }
}
