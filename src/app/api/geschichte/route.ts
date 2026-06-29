import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, alter, stichwörter, stile, dauer } = await request.json()

    // Vorlesen: ca. 130 Wörter pro Minute
    const wörter = Number(dauer) * 130

    const prompt = `Du bist ein einfühlsamer Geschichtenerzähler für Kinder. 
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
            // Genug Tokens für die längste Geschichte (~10 Min)
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

    return NextResponse.json({ geschichte })
  } catch (error) {
    console.log("Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}