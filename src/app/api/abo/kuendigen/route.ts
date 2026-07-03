import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  const snap = await adminDb.collection("users").doc(uid).get()
  const abo = snap.data()?.abo

  if (!abo?.stripeSubscriptionId) {
    return NextResponse.json({ fehler: "Keine aktive Stripe-Subscription" }, { status: 400 })
  }

  await stripe.subscriptions.update(abo.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  // Kündigung macht einen evtl. vorgemerkten Tarifwechsel hinfällig
  await adminDb.collection("users").doc(uid).set(
    {
      abo: {
        wird_gekuendigt: true,
        naechster_plan: FieldValue.delete(),
      },
    },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}
