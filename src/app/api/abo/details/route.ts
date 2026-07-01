import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")
  if (!uid) return NextResponse.json({ fehler: "uid fehlt" }, { status: 400 })

  const snap = await adminDb.collection("users").doc(uid).get()
  const abo = snap.data()?.abo
  if (!abo) return NextResponse.json({ fehler: "Kein Abo" }, { status: 404 })

  if (!abo.stripeSubscriptionId) {
    return NextResponse.json({ abo, nextBilling: null, cancelAtPeriodEnd: false })
  }

  try {
    const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = sub as any
    return NextResponse.json({
      abo,
      nextBilling: s.current_period_end ?? null,
      cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
    })
  } catch {
    return NextResponse.json({ abo, nextBilling: null, cancelAtPeriodEnd: false })
  }
}
