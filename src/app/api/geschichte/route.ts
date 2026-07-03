import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { holeKontingent } from "@/lib/kontingent"

export const runtime = "nodejs"
export const maxDuration = 60

// Kontingent: so viele Geschichten wie Tage im Abrechnungszeitraum,
// frei einteilbar (auch mehrere pro Tag)
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      alter,
      stichwörter,
      stile,
      dauer,
      sprache,
      uid,
      profilId,
      vorherigeGeschichte,
    } = await request.json()

    // Kontingent prüfen
    if (uid && profilId) {
      const kontingent = await holeKontingent(uid, profilId)
      if (kontingent.verbleibend <= 0) {
        return NextResponse.json({ fehler: "limit" }, { status: 429 })
      }
    }

    // Vorlesen: ca. 130 Wörter pro Minute
    const wörter = Number(dauer) * 130

    const fortsetzungBlockDe = vorherigeGeschichte
      ? `

Dies ist eine FORTSETZUNG. Hier ist die vorherige Geschichte:
---
${vorherigeGeschichte}
---
Die neue Geschichte muss nahtlos an die vorherige anknüpfen: gleiche Figuren, gleiche Welt, und sie greift auf, wo die letzte Geschichte aufgehört hat. Erinnere kurz und kindgerecht an das letzte Abenteuer, bevor das neue beginnt.`
      : ""

    const fortsetzungBlockEn = vorherigeGeschichte
      ? `

This is a SEQUEL. Here is the previous story:
---
${vorherigeGeschichte}
---
The new story must seamlessly continue the previous one: same characters, same world, picking up where the last story ended. Briefly and gently remind the child of the last adventure before the new one begins.`
      : ""

    const prompt =
      sprache === "en"
        ? `You are a gentle bedtime storyteller for children.
Write a bedtime story in English with the following requirements:

- Main character: ${name} (${alter} years old)
- Topics and interests: ${stichwörter}
- Style: ${stile}
- Length: about ${wörter} words (reading time approx. ${dauer} minutes)
- Tone: simple, warm and soothing
- Ending: calm and sleep-inducing${fortsetzungBlockEn}

Write ONLY the story, without a title or introduction.`
        : `Du bist ein einfühlsamer Geschichtenerzähler für Kinder.
Schreibe eine Gute-Nacht-Geschichte auf Deutsch mit folgenden Vorgaben:

- Hauptfigur: ${name} (${alter} Jahre alt)
- Themen und Interessen: ${stichwörter}
- Stil: ${stile}
- Länge: ungefähr ${wörter} Wörter (Vorlesedauer ca. ${dauer} Minuten)
- Sprache: einfach, warm und beruhigend
- Ende: ruhig und einschläfernd${fortsetzungBlockDe}

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
      console.error("Keine Geschichte. Antwort:", JSON.stringify(data).slice(0, 300))
      return NextResponse.json(
        { fehler: "Keine Geschichte generiert" },
        { status: 500 }
      )
    }

    // Zähler des heutigen Tages erhöhen (mehrere pro Tag möglich)
    if (uid && profilId) {
      const heute = new Date().toISOString().slice(0, 10)
      const zaehlerRef = adminDb.collection("users").doc(uid).collection("zaehler").doc(heute)
      await zaehlerRef.set({ [profilId]: FieldValue.increment(1) }, { merge: true })
    }

    return NextResponse.json({ geschichte })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
