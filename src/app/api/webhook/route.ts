import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Konfigurationsfehler" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Ungültige Webhook-Signatur" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { uid, plan, kinder } = session.metadata ?? {}

    if (uid && plan && kinder) {
      await adminDb
        .collection("users")
        .doc(uid)
        .set({
          abo: {
            plan,
            kinder: Number(kinder),
            status: "aktiv",
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
          },
        }, { merge: true })
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const uid = subscription.metadata?.uid
    if (uid) {
      await adminDb
        .collection("users")
        .doc(uid)
        .set({ abo: { status: "gekuendigt" } }, { merge: true })
    }
  }

  return NextResponse.json({ ok: true })
}
