import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldPath } from "firebase-admin/firestore"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type Kontingent = {
  erstellt: number
  gesamt: number
  verbleibend: number
  periodeEnde: number
}

// Geschichten-Kontingent für den laufenden Abrechnungszeitraum:
// So viele Geschichten wie Tage im Zeitraum – frei einteilbar
// (auch mehrere pro Tag, bis das Kontingent aufgebraucht ist).
export async function holeKontingent(uid: string, profilId: string): Promise<Kontingent> {
  const snap = await adminDb.collection("users").doc(uid).get()
  const abo = snap.data()?.abo

  const jetzt = Math.floor(Date.now() / 1000)
  let periodStart: number
  let periodEnd: number

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

  // Jahresabo: Kontingent trotzdem monatsweise vergeben
  if (periodEnd - periodStart > 32 * 86400) {
    const start = new Date(periodStart * 1000)
    const monateSeitStart = Math.floor((jetzt - periodStart) / (30 * 86400))
    const slotStart = new Date(start)
    slotStart.setMonth(start.getMonth() + monateSeitStart)
    const slotEnde = new Date(start)
    slotEnde.setMonth(start.getMonth() + monateSeitStart + 1)
    periodStart = Math.floor(slotStart.getTime() / 1000)
    periodEnd = Math.floor(slotEnde.getTime() / 1000)
  }

  const startTag = new Date(periodStart * 1000).toISOString().slice(0, 10)

  // Tageszähler-Dokumente (YYYY-MM-DD) im Zeitraum aufsummieren
  const docs = await adminDb
    .collection("users")
    .doc(uid)
    .collection("zaehler")
    .where(FieldPath.documentId(), ">=", startTag)
    .get()

  let erstellt = 0
  docs.forEach((d) => {
    if (d.id.length !== 10) return // alte Monats-Dokumente (YYYY-MM) ignorieren
    erstellt += d.data()[profilId] ?? 0
  })

  const gesamt = Math.round((periodEnd - periodStart) / 86400)

  return {
    erstellt,
    gesamt,
    verbleibend: Math.max(0, gesamt - erstellt),
    periodeEnde: periodEnd,
  }
}
