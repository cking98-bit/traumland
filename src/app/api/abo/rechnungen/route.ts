import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { verifiziereNutzerMitEmail } from "@/lib/serverAuth"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type Rechnung = {
  id: string
  datum: number // Unix-Sekunden
  betrag: number // in Euro
  beschreibung: string
  status: string
  pdfUrl: string | null
  ansichtUrl: string | null
}

// Alle Zahlungen des angemeldeten Nutzers – Abo-Rechnungen (Invoices) und
// Einmalkäufe (Charges/Belege). Stripe erzeugt und hostet die Belege selbst,
// wir verlinken sie nur; eigene Rechnungserstellung ist damit unnötig.
export async function GET(req: NextRequest) {
  const auth = await verifiziereNutzerMitEmail(req)
  if (!auth) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })
  const { uid, email } = auth

  try {
    const snap = await adminDb.collection("users").doc(uid).get()
    const daten = snap.data() ?? {}

    // Kunden-IDs sammeln: aus dem Abo, aus dem Schnupper-Kauf – und als
    // Rückfalloption über die E-Mail (deckt Käufe ab, die vor dem Speichern
    // der Kunden-ID getätigt wurden).
    const kundenIds = new Set<string>()
    if (typeof daten.stripeCustomerId === "string") kundenIds.add(daten.stripeCustomerId)
    if (typeof daten.abo?.stripeCustomerId === "string") {
      kundenIds.add(daten.abo.stripeCustomerId)
    }

    if (email) {
      const gefunden = await stripe.customers.list({ email, limit: 10 })
      gefunden.data.forEach((k) => kundenIds.add(k.id))
    }

    if (kundenIds.size === 0) {
      return NextResponse.json({ rechnungen: [] })
    }

    const rechnungen: Rechnung[] = []

    for (const kundeId of kundenIds) {
      // Abo-Rechnungen
      const invoices = await stripe.invoices.list({ customer: kundeId, limit: 100 })
      for (const inv of invoices.data) {
        if (inv.status === "draft" || inv.status === "void") continue
        rechnungen.push({
          id: inv.id ?? "",
          datum: inv.created,
          betrag: (inv.amount_paid ?? inv.amount_due ?? 0) / 100,
          beschreibung:
            inv.lines?.data?.[0]?.description ?? inv.description ?? "Abonnement",
          status: inv.status ?? "unbekannt",
          pdfUrl: inv.invoice_pdf ?? null,
          ansichtUrl: inv.hosted_invoice_url ?? null,
        })
      }

      // Einmalkäufe (Schnupper-Paket): erzeugen in Stripe keine Invoice,
      // sondern einen Charge mit Beleg-URL.
      const charges = await stripe.charges.list({ customer: kundeId, limit: 100 })
      for (const ch of charges.data) {
        // Charges, die zu einer Invoice gehören, sind oben schon erfasst.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gehoertZuInvoice = !!(ch as any).invoice
        if (!ch.paid || gehoertZuInvoice) continue
        rechnungen.push({
          id: ch.id,
          datum: ch.created,
          betrag: ch.amount / 100,
          beschreibung: ch.description ?? "Schnupper-Paket",
          status: ch.refunded ? "erstattet" : "bezahlt",
          pdfUrl: null,
          ansichtUrl: ch.receipt_url ?? null,
        })
      }
    }

    rechnungen.sort((a, b) => b.datum - a.datum)

    return NextResponse.json({ rechnungen })
  } catch (err) {
    console.error("Rechnungen laden fehlgeschlagen:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
