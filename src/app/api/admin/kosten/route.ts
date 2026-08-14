import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { verifiziereAdmin } from "@/lib/serverAuth"

export const runtime = "nodejs"

// Nur für dich: Kosten-Übersicht der letzten 30 Tage aus dem
// selbst mitgeschriebenen Token-Tracking (api_nutzung/{JJJJ-MM-TT}).
export async function GET(req: NextRequest) {
  const istAdmin = await verifiziereAdmin(req)
  if (!istAdmin) return NextResponse.json({ fehler: "Kein Zugriff" }, { status: 403 })

  try {
    const heute = new Date()
    const vor30Tagen = new Date(heute)
    vor30Tagen.setDate(heute.getDate() - 29)
    const startTag = vor30Tagen.toISOString().slice(0, 10)

    const snap = await adminDb
      .collection("api_nutzung")
      .where("__name__", ">=", startTag)
      .orderBy("__name__", "asc")
      .get()

    type TagesDaten = {
      text_anfragen?: number
      tts_anfragen?: number
      gesamt_kosten_usd?: number
    }
    const tage = snap.docs.map((d) => ({ datum: d.id, ...(d.data() as TagesDaten) }))
    const gesamtUsd = tage.reduce((sum, t) => sum + (t.gesamt_kosten_usd ?? 0), 0)
    const textAnfragen = tage.reduce((sum, t) => sum + (t.text_anfragen ?? 0), 0)
    const ttsAnfragen = tage.reduce((sum, t) => sum + (t.tts_anfragen ?? 0), 0)

    return NextResponse.json({ tage, gesamtUsd, textAnfragen, ttsAnfragen })
  } catch (err) {
    console.error("Kosten-Abfrage Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
