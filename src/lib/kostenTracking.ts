import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

// Grobe Preisschätzung in USD pro 1 Mio. Tokens – zur Orientierung, nicht
// garantiert aktuell. Für verbindliche Zahlen: Google Cloud Billing prüfen.
// (Stand der Schätzung: 2026)
const PREISE_PRO_1M_USD: Record<string, { input: number; output: number }> = {
  "gemini-flash-latest": { input: 0.3, output: 2.5 },
  "gemini-flash-lite-latest": { input: 0.1, output: 0.4 },
  "gemini-pro-latest": { input: 1.25, output: 10.0 },
  "gemini-2.5-flash-preview-tts": { input: 0.5, output: 10.0 },
  "gemini-2.5-pro-preview-tts": { input: 1.0, output: 20.0 },
}

export type TokenUsage = {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
}

export function schaetzeKostenUsd(modell: string, usage: TokenUsage | undefined): number {
  if (!usage) return 0
  const preis = PREISE_PRO_1M_USD[modell]
  if (!preis) return 0
  const inputKosten = ((usage.promptTokenCount ?? 0) / 1_000_000) * preis.input
  const outputKosten = ((usage.candidatesTokenCount ?? 0) / 1_000_000) * preis.output
  return inputKosten + outputKosten
}

// Schreibt einen Tages-Sammel-Datensatz (users/-unabhängig) unter api_nutzung/{JJJJ-MM-TT}.
// Fehler beim Tracking dürfen nie die eigentliche Anfrage (Geschichte/Audio) blockieren.
export async function protokolliereNutzung(
  typ: "text" | "tts",
  modell: string,
  usage: TokenUsage | undefined
) {
  try {
    const kostenUsd = schaetzeKostenUsd(modell, usage)
    const heute = new Date().toISOString().slice(0, 10)
    const ref = adminDb.collection("api_nutzung").doc(heute)
    await ref.set(
      {
        [`${typ}_anfragen`]: FieldValue.increment(1),
        [`${typ}_input_tokens`]: FieldValue.increment(usage?.promptTokenCount ?? 0),
        [`${typ}_output_tokens`]: FieldValue.increment(usage?.candidatesTokenCount ?? 0),
        [`${typ}_kosten_usd`]: FieldValue.increment(kostenUsd),
        gesamt_kosten_usd: FieldValue.increment(kostenUsd),
      },
      { merge: true }
    )
  } catch (err) {
    console.error("Kosten-Tracking fehlgeschlagen (Anfrage bleibt davon unberührt):", err)
  }
}
