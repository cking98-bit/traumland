import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { SCHNUPPER_PAKET, STRIPE_PLAENE, type StripePlanId } from "@/lib/stripePlaene"
import { sendeMail } from "@/lib/mail"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const runtime = "nodejs"

// Pflichtangabe für Kleinunternehmer (§ 19 UStG). Für Abo-Rechnungen lässt
// sich die Fußzeile nicht beim Checkout mitgeben – wir setzen sie deshalb,
// solange die Rechnung noch im Entwurf ist.
const RECHNUNG_FUSSNOTE = [
  "Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet.",
  "",
  "Nachtfunke · Colin King · Rostockerstraße 38 · 10553 Berlin",
  "support@nachtfunke.de · nachtfunke.de",
].join("\n")

// Kaufbestätigung per Mail. Fehler beim Versand dürfen den Webhook nie
// scheitern lassen – sonst wiederholt Stripe ihn und der Kauf würde
// mehrfach gutgeschrieben.
async function sendeKaufBestaetigung(
  an: string,
  name: string,
  tarif: string,
  umfang: string,
  preis: string,
  hinweis: string
) {
  try {
    await sendeMail(
      an,
      `Deine Bestellung bei Nachtfunke: ${tarif}`,
      `Hallo${name ? " " + name : ""},

vielen Dank für deine Bestellung! Hier deine Details:

Tarif:    ${tarif}
Umfang:   ${umfang}
Preis:    ${preis}

${hinweis}

Deine Rechnung findest du jederzeit in deinem Konto unter „Mein Abonnement":
https://nachtfunke.de/abo

Jetzt loslegen: https://nachtfunke.de/generator

Bei Fragen antworte einfach auf diese E-Mail.`
    )
  } catch (err) {
    console.error("Kaufbestätigung konnte nicht versendet werden:", err)
  }
}

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
    const { uid, plan, kinder, typ } = session.metadata ?? {}

    const kaeuferEmail =
      session.customer_details?.email ?? session.customer_email ?? null
    const kaeuferName = session.customer_details?.name ?? ""
    const betrag = ((session.amount_total ?? 0) / 100)
      .toFixed(2)
      .replace(".", ",")

    if (typ === "schnupper" && uid) {
      await adminDb
        .collection("users")
        .doc(uid)
        .set(
          {
            schnupper_guthaben: FieldValue.increment(SCHNUPPER_PAKET.geschichten),
            // Für die Rechnungsübersicht: Kunde auch ohne Abo zuordenbar machen
            stripeCustomerId: session.customer,
          },
          { merge: true }
        )

      if (kaeuferEmail) {
        await sendeKaufBestaetigung(
          kaeuferEmail,
          kaeuferName,
          SCHNUPPER_PAKET.name,
          `${SCHNUPPER_PAKET.geschichten} Geschichten (bis 5 Minuten)`,
          `${betrag} €`,
          "Einmalzahlung – kein Abo, keine automatische Verlängerung."
        )
      }
    } else if (uid && plan && kinder) {
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

      const planInfo = STRIPE_PLAENE[plan as StripePlanId]
      if (kaeuferEmail && planInfo) {
        const periode = planInfo.interval === "year" ? "Jahr" : "Monat"
        const kindText = Number(kinder) === 1 ? "1 Kind" : `${kinder} Kinder`
        await sendeKaufBestaetigung(
          kaeuferEmail,
          kaeuferName,
          planInfo.name,
          `${kindText} · 1 Geschichte pro Kalendertag und Kind`,
          `${betrag} € / ${periode}`,
          `Das Abo verlängert sich automatisch um jeweils 1 ${periode}. Du kannst jederzeit zum Ende des laufenden Abrechnungszeitraums kündigen – in deinem Konto unter „Mein Abonnement" oder über nachtfunke.de/kuendigen.`
        )
      }
    }
  }

  // Kleinunternehmer-Hinweis auf Abo-Rechnungen setzen, solange sie noch
  // Entwurf sind. Schlägt das fehl, bleibt die Rechnung gültig – deshalb
  // wird der Fehler nur geloggt.
  if (event.type === "invoice.created") {
    const invoice = event.data.object as Stripe.Invoice
    if (invoice.id && invoice.status === "draft" && !invoice.footer) {
      try {
        await stripe.invoices.update(invoice.id, { footer: RECHNUNG_FUSSNOTE })
      } catch (err) {
        console.error("Rechnungs-Fußzeile konnte nicht gesetzt werden:", err)
      }
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
