"use client"

import { useState, useRef } from "react"
import { useSprache } from "@/components/LanguageProvider"
import { authFetch } from "@/lib/apiClient"

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

const TEMPOS = [
  { wert: 0.8, label: "0.8×" },
  { wert: 1.0, label: "1×" },
  { wert: 1.2, label: "1.2×" },
]

export default function VorleseButton({ text }: { text: string }) {
  const { t } = useSprache()

  const [geschlecht, setGeschlecht] = useState<"weiblich" | "männlich">("weiblich")
  const [laden, setLaden] = useState(false)
  const [spielt, setSpielt] = useState(false)
  const [pausiert, setPausiert] = useState(false)
  const [tempo, setTempo] = useState(1.0)
  const [fehler, setFehler] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abbrechenRef = useRef<AbortController | null>(null)
  const tempoRef = useRef(tempo)
  tempoRef.current = tempo

  async function holAudio(chunk: string, signal: AbortSignal): Promise<string> {
    const response = await authFetch("/api/vorlesen", {
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
    setPausiert(false)

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

        const url = idx === 0 ? ersteUrl : await audioPromises[idx]
        if (signal.aborted) return

        if (audioRef.current) audioRef.current.pause()

        const audio = new Audio(url) as AudioMitSink
        audio.playbackRate = tempoRef.current
        audioRef.current = audio

        audio.onended = () => {
          if (idx + 1 < chunks.length) {
            spieleIndex(idx + 1)
          } else {
            setSpielt(false)
            setPausiert(false)
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

  function pauseWechseln() {
    const audio = audioRef.current
    if (!audio) return
    if (pausiert) {
      audio.play().catch(() => {})
      setPausiert(false)
    } else {
      audio.pause()
      setPausiert(true)
    }
  }

  function tempoSetzen(wert: number) {
    setTempo(wert)
    if (audioRef.current) audioRef.current.playbackRate = wert
  }

  function stoppen() {
    abbrechenRef.current?.abort()
    abbrechenRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setSpielt(false)
    setPausiert(false)
    setLaden(false)
  }

  return (
    <div className="bg-indigo-800/50 rounded-xl p-4 mb-6">
      <p className="text-indigo-300 text-xs mb-3 text-center">
        {t("vorlese.optional")}
      </p>

      {/* Stimm-Auswahl */}
      <div className="flex gap-3 mb-3">
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

      {/* Tempo */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-indigo-300 text-xs">{t("vorlese.tempo")}</span>
        {TEMPOS.map((tp) => (
          <button
            key={tp.wert}
            onClick={() => tempoSetzen(tp.wert)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              tempo === tp.wert
                ? "bg-yellow-400 text-indigo-950"
                : "bg-indigo-700 text-white hover:bg-indigo-600"
            }`}
          >
            {tp.label}
          </button>
        ))}
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
        <div className="flex gap-3">
          <button
            onClick={pauseWechseln}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-lg transition"
          >
            {pausiert ? t("vorlese.weiter") : t("vorlese.pause")}
          </button>
          <button
            onClick={stoppen}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-lg transition"
          >
            {t("vorlese.stoppen")}
          </button>
        </div>
      )}

      {fehler && (
        <p className="text-red-300 text-xs mt-2 text-center">{fehler}</p>
      )}
    </div>
  )
}
