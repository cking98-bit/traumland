import { NextRequest, NextResponse } from "next/server"
import { verifiziereNutzer } from "@/lib/serverAuth"
import { mitModellFallback } from "@/lib/geminiFallback"

export const runtime = "nodejs"
export const maxDuration = 60

// Nach Geschwindigkeit getestet (Stand: Juli 2026) – gemini-2.5-flash-image
// ist am schnellsten (~14s), gemini-3.1-flash-image als Fallback (~22s).
const BILD_MODELLE = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"]

export async function POST(request: NextRequest) {
  try {
    const uid = await verifiziereNutzer(request)
    if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

    const { stichwörter, stil } = await request.json()

    const prompt = `Eine warme, freundliche Kinderbuch-Illustration für eine Gute-Nacht-Geschichte.
Stil: ${stil}. Motive: ${stichwörter}.
Weiche Pastellfarben, traumhafte nächtliche Stimmung, kindgerecht und beruhigend.
Keine Schrift oder Buchstaben im Bild.`

    const ergebnis = await mitModellFallback(
      BILD_MODELLE,
      async (modell, signal) => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modell}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.GEMINI_API_KEY!,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
            signal,
          }
        )
        const data = await response.json()
        const parts = data.candidates?.[0]?.content?.parts || []
        const bildTeil = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data)
        if (!bildTeil) {
          console.error(
            `Modell "${modell}" lieferte kein Bild. HTTP ${response.status}:`,
            JSON.stringify(data).slice(0, 300)
          )
          return null
        }
        return {
          mime: bildTeil.inlineData.mimeType || "image/png",
          daten: bildTeil.inlineData.data as string,
        }
      },
      28000
    )

    if (!ergebnis) {
      console.error("Alle Bild-Modelle fehlgeschlagen:", BILD_MODELLE.join(", "))
      return NextResponse.json({ fehler: "Bild konnte nicht erzeugt werden" }, { status: 500 })
    }

    const bild = `data:${ergebnis.daten.mime};base64,${ergebnis.daten.daten}`
    return NextResponse.json({ bild })
  } catch (error) {
    console.error("Bild Fehler:", error)
    return NextResponse.json({ fehler: "Ein Fehler ist aufgetreten" }, { status: 500 })
  }
}
