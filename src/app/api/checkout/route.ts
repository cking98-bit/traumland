import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLAENE = {
  light: {
    productId: "prod_Uo6s0QhTdjIXI7",
    basisPreis: 10.99,
    proKind: 6.99,
    interval: "month" as const,
    name: "Dreamland Light",
  },
  familie: {
    productId: "prod_Uo6sRk71y68Xyz",
    basisPreis: 13.99,
    proKind: 8.99,
    interval: "month" as const,
    name: "Dreamland Familie",
  },
  "familie-jahr": {
    productId: "prod_Uo6sFeRclIj2oJ",
    basisPreis: 129.99,
    proKind: 79.99,
    interval: "year" as const,
    name: "Dreamland Familie Jahresabo",
  },
}

export async function POST(req: NextRequest) {
  try {
    const { uid, plan, kinder, email } = await req.json()

    const planInfo = PLAENE[plan as keyof typeof PLAENE]
    if (!planInfo) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 })
    }

    const betrag = planInfo.basisPreis + Math.max(0, kinder - 1) * planInfo.proKind
    const betragCents = Math.round(betrag * 100)
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
            unit_amount: betragCents,
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
