import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { holeKontingent } from "@/lib/kontingent"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const uid = await verifiziereNutzer(request)
    if (!uid) {
      return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      alter,
      stichwörter,
      stile,
      sprache,
      profilId,
      vorherigeGeschichte,
      themen,
    } = body
    let dauer: string = body.dauer ?? "5"

    // Abo-Status prüfen
    const userSnap = await adminDb.collection("users").doc(uid).get()
    const userDaten = userSnap.data() ?? {}
    const abo = userDaten.abo
    const hatAbo = !!abo && abo.status !== "gekuendigt"
    let istGratisGeschichte = false

    if (hatAbo) {
      // Light-Tarif: Geschichten bis maximal 5 Minuten
      if (abo.plan === "light" && Number(dauer) > 5) {
        dauer = "5"
      }
      // Kontingent: so viele Geschichten wie Tage im Abrechnungszeitraum
      if (profilId) {
        const kontingent = await holeKontingent(uid, profilId)
        if (kontingent.verbleibend <= 0) {
          return NextResponse.json({ fehler: "limit" }, { status: 429 })
        }
      }
    } else {
      // Kein Abo: 1 kostenlose 2-Minuten-Geschichte
      if (userDaten.gratis_geschichte_genutzt) {
        return NextResponse.json({ fehler: "gratis_verbraucht" }, { status: 403 })
      }
      istGratisGeschichte = true
      dauer = "2"
    }

    // Vorlesen: ca. 130 Wörter pro Minute
    const wörter = Number(dauer) * 130

    const themenBlockDe =
      themen && themen.length > 0
        ? `\n- Die Geschichte soll behutsam und kindgerecht folgendes Thema vermitteln: ${themen}`
        : ""
    const themenBlockEn =
      themen && themen.length > 0
        ? `\n- The story should gently convey the following theme in a child-friendly way: ${themen}`
        : ""

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
- Style: ${stile}${themenBlockEn}
- Length: about ${wörter} words (reading time approx. ${dauer} minutes)
- Tone: simple, warm and soothing
- Ending: calm and sleep-inducing${fortsetzungBlockEn}

Start your answer with a single line "TITLE: <a short, magical story title>".
After that, write ONLY the story, without any further introduction.`
        : `Du bist ein einfühlsamer Geschichtenerzähler für Kinder.
Schreibe eine Gute-Nacht-Geschichte auf Deutsch mit folgenden Vorgaben:

- Hauptfigur: ${name} (${alter} Jahre alt)
- Themen und Interessen: ${stichwörter}
- Stil: ${stile}${themenBlockDe}
- Länge: ungefähr ${wörter} Wörter (Vorlesedauer ca. ${dauer} Minuten)
- Sprache: einfach, warm und beruhigend
- Ende: ruhig und einschläfernd${fortsetzungBlockDe}

Beginne deine Antwort mit einer einzigen Zeile "TITEL: <ein kurzer, magischer Titel für die Geschichte>".
Danach schreibe NUR die Geschichte, ohne weitere Einleitung.`

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

    const rohtext: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rohtext) {
      console.error("Keine Geschichte. Antwort:", JSON.stringify(data).slice(0, 300))
      return NextResponse.json(
        { fehler: "Keine Geschichte generiert" },
        { status: 500 }
      )
    }

    // Titel aus der ersten Zeile ziehen
    let titel = ""
    let geschichte = rohtext.trim()
    const titelMatch = geschichte.match(/^TIT(?:EL|LE):\s*(.+)$/im)
    if (titelMatch) {
      titel = titelMatch[1].trim().replace(/^["*_]+|["*_]+$/g, "")
      geschichte = geschichte.replace(/^TIT(?:EL|LE):.*$/im, "").trim()
    }

    // Zähler bzw. Gratis-Flag setzen
    if (hatAbo && profilId) {
      const heute = new Date().toISOString().slice(0, 10)
      const zaehlerRef = adminDb.collection("users").doc(uid).collection("zaehler").doc(heute)
      await zaehlerRef.set({ [profilId]: FieldValue.increment(1) }, { merge: true })
    }
    if (istGratisGeschichte) {
      await adminDb.collection("users").doc(uid).set(
        { gratis_geschichte_genutzt: true },
        { merge: true }
      )
    }

    return NextResponse.json({ geschichte, titel })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}
