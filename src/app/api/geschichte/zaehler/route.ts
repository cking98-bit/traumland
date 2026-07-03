import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldPath } from "firebase-admin/firestore"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Liefert: wie viele Geschichten im laufenden Abrechnungszeitraum
// für ein Kind erstellt wurden – und wie viele insgesamt möglich sind (1 pro Tag)
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")
  const profilId = req.nextUrl.searchParams.get("profilId")
  if (!uid || !profilId) {
    return NextResponse.json({ fehler: "uid oder profilId fehlt" }, { status: 400 })
  }

  try {
    const snap = await adminDb.collection("users").doc(uid).get()
    const abo = snap.data()?.abo

    // Abrechnungszeitraum aus Stripe holen – Fallback: Kalendermonat
    let periodStart: number
    let periodEnd: number
    const jetzt = Math.floor(Date.now() / 1000)

    if (abo?.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(abo.stripeSubscriptionId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = sub as any
        periodStart =
          s.current_period_start ?? s.items?.data?.[0]?.current_period_start ?? jetzt
        periodEnd =
          s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? jetzt
      } catch {
        const d = new Date()
        periodStart = Math.floor(new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000)
        periodEnd = Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000)
      }
    } else {
      const d = new Date()
      periodStart = Math.floor(new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000)
      periodEnd = Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000)
    }

    // Jahresabo: Zähler trotzdem monatsweise (Zeitraum auf max. ~31 Tage begrenzen)
    if (periodEnd - periodStart > 32 * 86400) {
      const start = new Date(periodStart * 1000)
      // Aktueller "Monats-Slot" innerhalb des Jahres
      const monateSeitStart = Math.floor((jetzt - periodStart) / (30 * 86400))
      const slotStart = new Date(start)
      slotStart.setMonth(start.getMonth() + monateSeitStart)
      const slotEnde = new Date(start)
      slotEnde.setMonth(start.getMonth() + monateSeitStart + 1)
      periodStart = Math.floor(slotStart.getTime() / 1000)
      periodEnd = Math.floor(slotEnde.getTime() / 1000)
    }

    const startTag = new Date(periodStart * 1000).toISOString().slice(0, 10)
    const heuteTag = new Date().toISOString().slice(0, 10)

    // Tageszähler-Dokumente (YYYY-MM-DD) im Zeitraum aufsummieren
    const docs = await adminDb
      .collection("users")
      .doc(uid)
      .collection("zaehler")
      .where(FieldPath.documentId(), ">=", startTag)
      .get()

    let erstellt = 0
    let heuteErstellt = false
    docs.forEach((d) => {
      if (d.id.length !== 10) return // alte Monats-Dokumente (YYYY-MM) ignorieren
      const anzahl = d.data()[profilId] ?? 0
      erstellt += anzahl
      if (d.id === heuteTag && anzahl >= 1) heuteErstellt = true
    })

    // Gesamt möglich = Anzahl Tage im Abrechnungszeitraum (1 Geschichte pro Tag)
    const gesamt = Math.round((periodEnd - periodStart) / 86400)

    return NextResponse.json({
      erstellt,
      gesamt,
      verbleibend: Math.max(0, gesamt - erstellt),
      heuteErstellt,
      periodeEnde: periodEnd,
    })
  } catch (err) {
    console.error("Zähler Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
