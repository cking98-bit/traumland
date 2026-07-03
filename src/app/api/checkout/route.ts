import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { STRIPE_PLAENE, planBetragCents, type StripePlanId } from "@/lib/stripePlaene"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const uid = await verifiziereNutzer(req)
    if (!uid) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })

    const { plan, kinder, email } = await req.json()

    const planInfo = STRIPE_PLAENE[plan as StripePlanId]
    if (!planInfo) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 })
    }

    const kindText = kinder === 1 ? "1 Kind" : `${kinder} Kinder`

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product: planInfo.productId,
            unit_amount: planBetragCents(plan as StripePlanId, kinder),
            recurring: {
              interval: planInfo.interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        uid,
        plan,
        kinder: String(kinder),
      },
      subscription_data: {
        description: `${planInfo.name} – ${kindText}`,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/preise`,
      locale: "de",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe Checkout Fehler:", err)
    return NextResponse.json({ error: "Checkout fehlgeschlagen" }, { status: 500 })
  }
}
