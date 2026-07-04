"use client"

import { useState, useRef } from "react"
import { useSprache } from "@/components/LanguageProvider"
import { authFetch } from "@/lib/apiClient"

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

function formatZeit(sekunden: number): string {
  if (!isFinite(sekunden) || sekunden < 0) return "0:00"
  const m = Math.floor(sekunden / 60)
  const s = Math.floor(sekunden % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

const TEMPOS = [
  { wert: 0.8, label: "0.8×" },
  { wert: 1.0, label: "1×" },
  { wert: 1.2, label: "1.2×" },
]

export default function VorleseButton({
  text,
  titel,
}: {
  text: string
  titel?: string
}) {
  const { t } = useSprache()

  const [geschlecht, setGeschlecht] = useState<"weiblich" | "männlich">("weiblich")
  const [laden, setLaden] = useState(false)
  const [spielt, setSpielt] = useState(false)
  const [pausiert, setPausiert] = useState(false)
  const [tempo, setTempo] = useState(1.0)
  const [fehler, setFehler] = useState("")
  const [position, setPosition] = useState(0)
  const [gesamt, setGesamt] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abbrechenRef = useRef<AbortController | null>(null)
  const dauernRef = useRef<number[]>([])
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
    setPosition(0)
    setGesamt(0)

    const controller = new AbortController()
    abbrechenRef.current = controller
    const { signal } = controller

    try {
      const chunks = textZuChunks(text)
      const audioPromises = chunks.map((chunk) => holAudio(chunk, signal))

      dauernRef.current = new Array(chunks.length).fill(0)
      const audios: (HTMLAudioElement | null)[] = new Array(chunks.length).fill(null)

      // Sobald ein Chunk fertig ist: Audio vorbereiten und Dauer erfassen
      audioPromises.forEach((p, i) => {
        p.then((url) => {
          if (signal.aborted) return
          const a = new Audio(url)
          a.preload = "metadata"
          a.onloadedmetadata = () => {
            dauernRef.current[i] = a.duration
            setGesamt(dauernRef.current.reduce((summe, d) => summe + (d || 0), 0))
          }
          audios[i] = a
        }).catch(() => {})
      })

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

        let audio = audios[idx]
        if (!audio) {
          audio = new Audio(url)
          audios[idx] = audio
        }
        audio.currentTime = 0
        audio.playbackRate = tempoRef.current
        audioRef.current = audio

        audio.ontimeupdate = () => {
          const vorher = dauernRef.current
            .slice(0, idx)
            .reduce((summe, d) => summe + (d || 0), 0)
          setPosition(vorher + audio!.currentTime)
        }

        audio.onended = () => {
          if (idx + 1 < chunks.length) {
            spieleIndex(idx + 1)
          } else {
            setSpielt(false)
            setPausiert(false)
            setPosition(0)
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
    setPosition(0)
    setGesamt(0)
  }

  function hauptKlick() {
    if (laden) {
      stoppen()
    } else if (spielt) {
      pauseWechseln()
    } else {
      vorlesen()
    }
  }

  const fortschritt = gesamt > 0 ? Math.min(100, (position / gesamt) * 100) : 0
  const zeigtPause = spielt && !pausiert

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

      {/* Player (Variante B) */}
      <div className="bg-indigo-900 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={hauptKlick}
            aria-label={laden ? t("vorlese.stoppen") : zeigtPause ? t("vorlese.pause") : t("vorlese.vorlesen")}
            className="w-12 h-12 min-w-12 rounded-full bg-yellow-400 hover:bg-yellow-300 flex items-center justify-center transition"
          >
            {laden ? (
              <span className="w-5 h-5 border-2 border-indigo-950 border-t-transparent rounded-full animate-spin" />
            ) : zeigtPause ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1e1b4b">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="#1e1b4b">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {titel && (
              <p className="text-indigo-100 text-sm mb-2 truncate">{titel}</p>
            )}
            <div className="h-1.5 rounded-full bg-indigo-950">
              <div
                className="h-1.5 rounded-full bg-yellow-400 transition-[width] duration-300"
                style={{ width: `${fortschritt}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-indigo-400 text-xs">
            {laden
              ? t("vorlese.erzeugt")
              : `${formatZeit(position)} / ${formatZeit(gesamt)}`}
          </span>

          <div className="flex items-center gap-1.5">
            {TEMPOS.map((tp) => (
              <button
                key={tp.wert}
                onClick={() => tempoSetzen(tp.wert)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  tempo === tp.wert
                    ? "bg-yellow-400 text-indigo-950"
                    : "bg-indigo-950 text-indigo-300 hover:text-white"
                }`}
              >
                {tp.label}
              </button>
            ))}

            {(spielt || pausiert) && (
              <button
                onClick={stoppen}
                aria-label={t("vorlese.stoppen")}
                className="ml-1 w-7 h-7 rounded-full bg-indigo-950 hover:bg-red-500/40 text-indigo-300 hover:text-red-200 flex items-center justify-center transition"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {fehler && (
        <p className="text-red-300 text-xs mt-2 text-center">{fehler}</p>
      )}
    </div>
  )
}
