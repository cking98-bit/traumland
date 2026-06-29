import { NextRequest, NextResponse } from "next/server"

// Wandelt rohes PCM-Audio (von Gemini) in ein abspielbares WAV um
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
  header.writeUInt16LE(1, 20) // PCM
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
    const { text, geschlecht } = await request.json()

    // Stimme nach Geschlecht wählen
    const voiceName = geschlecht === "männlich" ? "Puck" : "Kore"

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
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
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      }
    )

    const data = await response.json()
    const base64Pcm =
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

    if (!base64Pcm) {
      console.log("Keine Audio-Antwort:", JSON.stringify(data))
      return NextResponse.json(
        { fehler: "Audio konnte nicht erzeugt werden" },
        { status: 500 }
      )
    }

    // PCM in WAV umwandeln und als Daten-URL zurückgeben
    const pcm = Buffer.from(base64Pcm, "base64")
    const wav = pcmToWav(pcm)
    const wavBase64 = wav.toString("base64")

    return NextResponse.json({ audio: `data:audio/wav;base64,${wavBase64}` })
  } catch (error) {
    console.log("TTS Fehler:", error)
    return NextResponse.json(
      { fehler: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    )
  }
}