import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { verifiziereAdmin } from "@/lib/serverAuth"
import { STRIPE_PLAENE } from "@/lib/stripePlaene"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Ungefährer USD→EUR-Kurs für die Gewinn-Schätzung (Kosten-Tracking läuft in USD,
// Umsatz kommt in EUR aus Stripe). Keine Live-Kursabfrage nötig für eine Schätzung.
const USD_ZU_EUR = 0.92

// Stripe-Standardgebühr für EU-Kartenzahlungen: 1,5 % + 0,25 €
function stripeGebuehrCents(betragCents: number): number {
  return Math.round(betragCents * 0.015) + 25
}

export async function GET(req: NextRequest) {
  const istAdmin = await verifiziereAdmin(req)
  if (!istAdmin) return NextResponse.json({ fehler: "Kein Zugriff" }, { status: 403 })

  try {
    // Aktive Abos direkt aus Stripe – das ist die verlässliche Quelle,
    // nicht der (evtl. leicht verzögerte) Firestore-Stand.
    const subs = await stripe.subscriptions.list({ status: "active", limit: 100 })

    let mrrCents = 0
    let stripeGebuehrenMonatlichCents = 0
    const planAufschluesselung: Record<string, number> = { familie: 0, "familie-jahr": 0 }

    for (const sub of subs.data) {
      for (const item of sub.items.data) {
        const preis = item.price
        const betrag = preis?.unit_amount ?? 0
        const interval = preis?.recurring?.interval
        const monatsBetrag = interval === "year" ? betrag / 12 : betrag
        mrrCents += monatsBetrag
        stripeGebuehrenMonatlichCents += stripeGebuehrCents(monatsBetrag)

        const productId = typeof preis?.product === "string" ? preis.product : preis?.product?.id
        if (productId === STRIPE_PLAENE.familie.productId) planAufschluesselung.familie++
        else if (productId === STRIPE_PLAENE["familie-jahr"].productId)
          planAufschluesselung["familie-jahr"]++
      }
    }

    // Schnupper-Paket-Verkäufe im laufenden Kalendermonat
    const jetzt = new Date()
    const monatsStart = Math.floor(
      new Date(jetzt.getFullYear(), jetzt.getMonth(), 1).getTime() / 1000
    )
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: monatsStart },
    })
    const schnupperSessions = sessions.data.filter(
      (s) => s.payment_status === "paid" && s.metadata?.typ === "schnupper"
    )
    const schnupperUmsatzCents = schnupperSessions.reduce(
      (sum, s) => sum + (s.amount_total ?? 0),
      0
    )
    const schnupperGebuehrenCents = schnupperSessions.reduce(
      (sum, s) => sum + stripeGebuehrCents(s.amount_total ?? 0),
      0
    )

    // API-Kosten der letzten 30 Tage (aus dem Token-Tracking, USD)
    const vor30Tagen = new Date(jetzt)
    vor30Tagen.setDate(jetzt.getDate() - 29)
    const startTag = vor30Tagen.toISOString().slice(0, 10)
    const kostenSnap = await adminDb
      .collection("api_nutzung")
      .where("__name__", ">=", startTag)
      .get()
    const apiKostenUsd = kostenSnap.docs.reduce(
      (sum, d) => sum + (d.data().gesamt_kosten_usd ?? 0),
      0
    )
    const apiKostenEur = apiKostenUsd * USD_ZU_EUR

    const umsatzMonatEur = (mrrCents + schnupperUmsatzCents) / 100
    const gebuehrenMonatEur = (stripeGebuehrenMonatlichCents + schnupperGebuehrenCents) / 100
    const geschaetzterGewinnEur = umsatzMonatEur - gebuehrenMonatEur - apiKostenEur

    return NextResponse.json({
      aktiveVertraege: subs.data.length,
      planAufschluesselung,
      mrrEur: mrrCents / 100,
      schnupperAnzahlDiesenMonat: schnupperSessions.length,
      schnupperUmsatzDiesenMonatEur: schnupperUmsatzCents / 100,
      apiKostenUsd,
      apiKostenEur,
      stripeGebuehrenMonatEur: gebuehrenMonatEur,
      umsatzMonatEur,
      geschaetzterGewinnEur,
    })
  } catch (err) {
    console.error("Admin-Übersicht Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
