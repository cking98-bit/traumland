"use client"

import { useState, useRef } from "react"
import { useSprache } from "@/components/LanguageProvider"

type AudioMitSink = HTMLAudioElement & {
  setSinkId?: (id: string) => Promise<void>
}

function textZuChunks(text: string, maxZeichen = 250): string[] {
  const absaetze = text.split(/\n+/).filter((p) => p.trim().length > 0)
  const chunks: string[] = []
  let aktuell = ""
  for (const absatz of absaetze) {
    const kombiniert = aktuell ? aktuell + "\n" + absatz : absatz
    if (aktuell && kombiniert.length > maxZeichen) {
      chunks.push(aktuell.trim())
      aktuell = absatz
    } else {
      aktuell = kombiniert
    }
  }
  if (aktuell.trim()) chunks.push(aktuell.trim())
  return chunks.length > 0 ? chunks : [text]
}

export default function VorleseButton({ text }: { text: string }) {
  const { t } = useSprache()

  const [geschlecht, setGeschlecht] = useState<"weiblich" | "männlich">("weiblich")
  const [laden, setLaden] = useState(false)
  const [spielt, setSpielt] = useState(false)
  const [fehler, setFehler] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abbrechenRef = useRef<AbortController | null>(null)

  async function holAudio(chunk: string, signal: AbortSignal): Promise<string> {
    const response = await fetch("/api/vorlesen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chunk, geschlecht }),
      signal,
    })
    const data = await response.json()
    if (data.fehler) throw new Error(data.fehler)
    return data.audio as string
  }

  async function vorlesen() {
    setFehler("")
    setLaden(true)

    const controller = new AbortController()
    abbrechenRef.current = controller
    const { signal } = controller

    try {
      const chunks = textZuChunks(text)

      // Alle Chunks gleichzeitig generieren
      const audioPromises = chunks.map((chunk) => holAudio(chunk, signal))

      // Warten bis der erste Chunk bereit ist – dann sofort starten
      const ersteUrl = await audioPromises[0]
      if (signal.aborted) return

      setLaden(false)
      setSpielt(true)

      async function spieleIndex(idx: number) {
        if (signal.aborted) return

        // URL des aktuellen Chunks (erster ist bereits bekannt, Rest aus Promise)
        const url = idx === 0 ? ersteUrl : await audioPromises[idx]
        if (signal.aborted) return

        if (audioRef.current) audioRef.current.pause()

        const audio = new Audio(url) as AudioMitSink
        audioRef.current = audio

        audio.onended = () => {
          if (idx + 1 < chunks.length) {
            spieleIndex(idx + 1)
          } else {
            setSpielt(false)
          }
        }

        audio.onerror = () => {
          if (!signal.aborted) {
            setFehler(t("vorlese.fehler.audio"))
            setSpielt(false)
          }
        }

        await audio.play().catch(() => {
          if (!signal.aborted) {
            setFehler(t("vorlese.fehler.audio"))
            setSpielt(false)
          }
        })
      }

      spieleIndex(0)
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return
      setFehler(t("vorlese.fehler.verbindung"))
      setLaden(false)
    }
  }

  function stoppen() {
    abbrechenRef.current?.abort()
    abbrechenRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setSpielt(false)
    setLaden(false)
  }

  return (
    <div className="bg-indigo-800/50 rounded-xl p-4 mb-6">
      <p className="text-indigo-300 text-xs mb-3 text-center">
        {t("vorlese.optional")}
      </p>

      {/* Stimm-Auswahl */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setGeschlecht("weiblich")}
          disabled={laden || spielt}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition disabled:opacity-50 ${
            geschlecht === "weiblich"
              ? "bg-yellow-400 text-indigo-950"
              : "bg-indigo-700 text-white hover:bg-indigo-600"
          }`}
        >
          {t("vorlese.weiblich")}
        </button>
        <button
          onClick={() => setGeschlecht("männlich")}
          disabled={laden || spielt}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition disabled:opacity-50 ${
            geschlecht === "männlich"
              ? "bg-yellow-400 text-indigo-950"
              : "bg-indigo-700 text-white hover:bg-indigo-600"
          }`}
        >
          {t("vorlese.maennlich")}
        </button>
      </div>

      {/* Abspiel-Steuerung */}
      {laden ? (
        <button
          disabled
          className="w-full bg-yellow-400/60 text-indigo-950 font-bold py-3 rounded-lg"
        >
          {t("vorlese.erzeugt")}
        </button>
      ) : !spielt ? (
        <button
          onClick={vorlesen}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-lg transition"
        >
          {t("vorlese.vorlesen")}
        </button>
      ) : (
        <button
          onClick={stoppen}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-lg transition"
        >
          {t("vorlese.stoppen")}
        </button>
      )}

      {fehler && (
        <p className="text-red-300 text-xs mt-2 text-center">{fehler}</p>
      )}
    </div>
  )
}
