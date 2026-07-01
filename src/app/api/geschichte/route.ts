import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const runtime = "nodejs"

const LIMIT = 30

export async function POST(request: NextRequest) {
  try {
    const { name, alter, stichwörter, stile, dauer, sprache, uid, profilId } =
      await request.json()

    // Monatliches Geschichten-Limit pro Kind prüfen
    if (uid && profilId) {
      const monat = new Date().toISOString().slice(0, 7) // "YYYY-MM"
      const zaehlerRef = adminDb.collection("users").doc(uid).collection("zaehler").doc(monat)
      const zaehlerSnap = await zaehlerRef.get()
      const zaehlerDaten = zaehlerSnap.data() ?? {}
      const aktuellerZaehler = zaehlerDaten[profilId] ?? 0

      if (aktuellerZaehler >= LIMIT) {
        return NextResponse.json({ fehler: "limit" }, { status: 429 })
      }
    }

    // Vorlesen: ca. 130 Wörter pro Minute
    const wörter = Number(dauer) * 130

    const prompt =
      sprache === "en"
        ? `You are a gentle bedtime storyteller for children.
Write a bedtime story in English with the following requirements:

- Main character: ${name} (${alter} years old)
- Topics and interests: ${stichwörter}
- Style: ${stile}
- Length: about ${wörter} words (reading time approx. ${dauer} minutes)
- Tone: simple, warm and soothing
- Ending: calm and sleep-inducing

Write ONLY the story, without a title or introduction.`
        : `Du bist ein einfühlsamer Geschichtenerzähler für Kinder.
Schreibe eine Gute-Nacht-Geschichte auf Deutsch mit folgenden Vorgaben:

- Hauptfigur: ${name} (${alter} Jahre alt)
- Themen und Interessen: ${stichwörter}
- Stil: ${stile}
- Länge: ungefähr ${wörter} Wörter (Vorlesedauer ca. ${dauer} Minuten)
- Sprache: einfach, warm und beruhigend
- Ende: ruhig und einschläfernd

Schreibe NUR die Geschichte, ohne Titel oder Einleitung.`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    const data = await response.json()

    const geschichte = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!geschichte) {
      console.log("Keine Geschichte. Antwort:", JSON.stringify(data))
      return NextResponse.json(
        { fehler: "Keine Geschichte generiert" },
        { status: 500 }
      )
    }

    // Zähler erhöhen
    if (uid && profilId) {
      const monat = new Date().toISOString().slice(0, 7)
      const zaehlerRef = adminDb.collection("users").doc(uid).collection("zaehler").doc(monat)
      await zaehlerRef.set({ [profilId]: FieldValue.increment(1) }, { merge: true })
    }

    return NextResponse.json({ geschichte })
  } catch (error) {
    console.log("Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
