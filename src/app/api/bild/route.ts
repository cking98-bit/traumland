import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { stichwörter, stil } = await request.json()

    const prompt = `Eine warme, freundliche Kinderbuch-Illustration für eine Gute-Nacht-Geschichte.
Stil: ${stil}. Motive: ${stichwörter}.
Weiche Pastellfarben, traumhafte nächtliche Stimmung, kindgerecht und beruhigend.
Keine Schrift oder Buchstaben im Bild.`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    )

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    // Den Teil finden, der die Bilddaten enthält
    const bildTeil = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data)

    if (!bildTeil) {
      console.log("Kein Bild. Antwort:", JSON.stringify(data))
      return NextResponse.json(
        { fehler: "Bild konnte nicht erzeugt werden" },
        { status: 500 }
      )
    }

    const mime = bildTeil.inlineData.mimeType || "image/png"
    const bild = `data:${mime};base64,${bildTeil.inlineData.data}`

    return NextResponse.json({ bild })
  } catch (error) {
    console.log("Bild Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}