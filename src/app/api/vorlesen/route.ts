import { NextRequest, NextResponse } from "next/server"
import { verifiziereNutzer } from "@/lib/serverAuth"
import { mitModellWettlauf, mitModellFallback } from "@/lib/geminiFallback"
import { protokolliereNutzung, type TokenUsage } from "@/lib/kostenTracking"

export const runtime = "nodejs"
export const maxDuration = 60

// Antwortzeiten von Gemini-TTS schwanken stark (in Tests: 3-12+ Sekunden
// für ähnlich lange Texte, teils auch leere Antworten).
const TTS_MODELLE = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]

function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataLen = pcm.length

  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + dataLen, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write("data", 36)
  header.writeUInt32LE(dataLen, 40)

  return Buffer.concat([header, pcm])
}

export async function POST(request: NextRequest) {
  try {
    const uid = await verifiziereNutzer(request)
    if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

    const { text, geschlecht, schnell } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ fehler: "Kein Text" }, { status: 400 })
    }

    const voiceName = geschlecht === "männlich" ? "Puck" : "Kore"

    // Erster Abschnitt (schnell=true): beide Modelle gleichzeitig anfragen,
    // schnellstes Ergebnis nehmen – dort zählt jede Sekunde für den Start.
    // Restliche Abschnitte: nacheinander (spart die Hälfte der API-Kosten),
    // weil dann bereits Audio läuft und die Wartezeit verdeckt wird.
    const strategie = schnell ? mitModellWettlauf : mitModellFallback
    const ergebnis = await strategie(TTS_MODELLE, async (modell, signal) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modell}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY!,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
          signal,
        }
      )
      const data = await response.json()
      const base64Pcm = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      if (!base64Pcm) {
        console.error(
          `Modell "${modell}" lieferte keine Audio-Antwort. HTTP ${response.status}:`,
          JSON.stringify(data).slice(0, 300)
        )
        return null
      }
      return { audio: base64Pcm as string, usage: data.usageMetadata as TokenUsage | undefined }
    })

    if (!ergebnis) {
      console.error("Alle TTS-Modelle fehlgeschlagen:", TTS_MODELLE.join(", "))
      return NextResponse.json({ fehler: "Audio konnte nicht erzeugt werden" }, { status: 500 })
    }

    protokolliereNutzung("tts", ergebnis.modell, ergebnis.daten.usage)

    const pcm = Buffer.from(ergebnis.daten.audio, "base64")
    const wav = pcmToWav(pcm)
    const wavBase64 = wav.toString("base64")

    return NextResponse.json({ audio: `data:audio/wav;base64,${wavBase64}` })
  } catch (error) {
    console.error("TTS Fehler:", error)
    return NextResponse.json({ fehler: "Ein Fehler ist aufgetreten" }, { status: 500 })
  }
}
