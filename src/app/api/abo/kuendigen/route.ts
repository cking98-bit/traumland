import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { uid } = await req.json()
  if (!uid) return NextResponse.json({ fehler: "uid fehlt" }, { status: 400 })

  const snap = await adminDb.collection("users").doc(uid).get()
  const abo = snap.data()?.abo

  if (!abo?.stripeSubscriptionId) {
    return NextResponse.json({ fehler: "Keine aktive Stripe-Subscription" }, { status: 400 })
  }

  await stripe.subscriptions.update(abo.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await adminDb.collection("users").doc(uid).set(
    { abo: { wird_gekuendigt: true } },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}
