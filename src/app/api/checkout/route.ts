import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import {
  STRIPE_PLAENE,
  planBetragCents,
  type StripePlanId,
  SCHNUPPER_PAKET,
  schnupperPreisCents,
} from "@/lib/stripePlaene"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Pflichtangaben nach § 14 UStG, die Stripe nicht selbst kennt.
// Absenderadresse und Rechnungsnummer kommen aus den Stripe-Kontodaten.
const RECHNUNG_FUSSNOTE = [
  "Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet.",
  "",
  "Nachtfunke · Colin King · Rostockerstraße 38 · 10553 Berlin",
  "support@nachtfunke.de · nachtfunke.de",
].join("\n")

// Steuernummer/USt-IdNr erscheint als eigenes Feld, sobald sie vorliegt
// (ENV setzen, sobald das Finanzamt sie zugeteilt hat).
function rechnungsFelder() {
  const steuernummer = process.env.STEUERNUMMER
  return steuernummer
    ? [{ name: "Steuernummer", value: steuernummer }]
    : undefined
}

export async function POST(req: NextRequest) {
  try {
    const uid = await verifiziereNutzer(req)
    if (!uid) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })

    const { plan, kinder, email } = await req.json()

    // Schnupper-Paket: Einmalkauf ohne Abo, kein "kinder"-Multiplikator
    if (plan === "schnupper") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: email ?? undefined,
        // Rechnungsadresse einsammeln – Stripe validiert sie und übernimmt
        // sie direkt auf die Rechnung.
        billing_address_collection: "required",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product: SCHNUPPER_PAKET.productId,
              unit_amount: schnupperPreisCents(),
            },
            quantity: 1,
          },
        ],
        // Einmalzahlungen erzeugen ohne dieses Flag KEINE Rechnung,
        // sondern nur einen Zahlungsbeleg.
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `${SCHNUPPER_PAKET.name} – ${SCHNUPPER_PAKET.geschichten} personalisierte Gute-Nacht-Geschichten (bis 5 Minuten), einmalig`,
            footer: RECHNUNG_FUSSNOTE,
            custom_fields: rechnungsFelder(),
          },
        },
        metadata: {
          uid,
          typ: "schnupper",
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/preise`,
        locale: "de",
      })

      return NextResponse.json({ url: session.url })
    }

    const planInfo = STRIPE_PLAENE[plan as StripePlanId]
    if (!planInfo) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 })
    }

    const kindText = kinder === 1 ? "1 Kind" : `${kinder} Kinder`

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email ?? undefined,
      billing_address_collection: "required",
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
      // Abos erzeugen ihre Rechnungen automatisch. Die Fußzeile (§ 19 UStG)
      // lässt sich hier nicht setzen – sie kommt aus dem Konto-Standard
      // (Dashboard → Einstellungen → Rechnungen) und gilt dann für alle Abos.
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
