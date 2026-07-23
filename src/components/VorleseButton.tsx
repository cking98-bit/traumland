"use client"

import { useState, useRef, useEffect } from "react"
import { useSprache } from "@/components/LanguageProvider"
import { authFetch } from "@/lib/apiClient"

// Der Text wird satzweise in Abschnitte zerlegt. Die ersten beiden bleiben
// kurz, damit die erste Sprachausgabe möglichst schnell steht; der Rest darf
// länger sein (weniger API-Aufrufe), weil dann schon Audio läuft.
function textZuChunks(text: string): string[] {
  const saetze = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const grenzeFuer = (index: number) => (index === 0 ? 90 : index === 1 ? 140 : 260)

  const chunks: string[] = []
  let aktuell = ""
  for (const satz of saetze) {
    const kombiniert = aktuell ? aktuell + " " + satz : satz
    if (aktuell && kombiniert.length > grenzeFuer(chunks.length)) {
      chunks.push(aktuell)
      aktuell = satz
    } else {
      aktuell = kombiniert
    }
  }
  if (aktuell) chunks.push(aktuell)
  return chunks.length > 0 ? chunks : [text]
}

const TEMPOS = [
  { wert: 0.8, label: "0.8×" },
  { wert: 1.0, label: "1×" },
  { wert: 1.2, label: "1.2×" },
]

const MAX_PARALLEL = 4

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
  const [puffert, setPuffert] = useState(false)
  const [tempo, setTempo] = useState(1.0)
  const [fehler, setFehler] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abbrechenRef = useRef<AbortController | null>(null)
  const tempoRef = useRef(tempo)
  tempoRef.current = tempo

  // Vorab-Ladung des ersten Abschnitts, sobald die Seite angezeigt wird –
  // beim Klick auf "Vorlesen" ist er dann oft schon fertig.
  const vorabRef = useRef<{
    geschlecht: string
    chunkText: string
    promise: Promise<string | null>
  } | null>(null)

  // Eine TTS-Anfrage mit kurzer Wiederholung – gibt null zurück statt zu werfen,
  // damit ein fehlgeschlagener Abschnitt die Wiedergabe nie komplett stoppt.
  async function holAudio(
    chunk: string,
    stimme: string,
    signal: AbortSignal,
    schnell = false,
    versuche = 2
  ): Promise<string | null> {
    for (let v = 0; v < versuche; v++) {
      if (signal.aborted) return null
      try {
        const response = await authFetch("/api/vorlesen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, geschlecht: stimme, schnell }),
          signal,
        })
        const data = await response.json()
        if (data.audio) return data.audio as string
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError" || signal.aborted) {
          return null
        }
      }
    }
    return null
  }

  useEffect(() => {
    const chunks = textZuChunks(text)
    if (chunks.length === 0) return
    const controller = new AbortController()
    const promise = holAudio(chunks[0], geschlecht, controller.signal, true)
    promise.catch(() => {})
    vorabRef.current = { geschlecht, chunkText: chunks[0], promise }
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, geschlecht])

  // Alle Abschnitte parallel generieren – aber mit begrenzter Gleichzeitigkeit,
  // damit wir die API nicht überlasten. Früheste Abschnitte zuerst.
  function generiereAlle(
    chunks: string[],
    stimme: string,
    signal: AbortSignal,
    vorbelegt: { promise: Promise<string | null> } | null
  ): Promise<string | null>[] {
    const resolver: ((v: string | null) => void)[] = []
    const promises = chunks.map(
      (_, i) => new Promise<string | null>((res) => (resolver[i] = res))
    )

    let naechster = 0
    if (vorbelegt) {
      // Vorgeladenes Audio nutzen – schlug es fehl, ersten Abschnitt neu
      // generieren statt ihn zu überspringen (sonst fehlt der erste Satz).
      vorbelegt.promise
        .then(async (v) => {
          if (v || signal.aborted) resolver[0](v)
          else resolver[0](await holAudio(chunks[0], stimme, signal, true))
        })
        .catch(() => resolver[0](null))
      naechster = 1
    }

    async function worker() {
      while (!signal.aborted) {
        const i = naechster++
        if (i >= chunks.length) return
        const audio = await holAudio(chunks[i], stimme, signal, false)
        resolver[i](audio)
      }
    }
    const anzahl = Math.min(MAX_PARALLEL, chunks.length)
    for (let w = 0; w < anzahl; w++) worker()

    return promises
  }

  // Einen fertigen Audio-Abschnitt abspielen. Löst true auf, wenn er zu Ende
  // gespielt (oder wegen Fehler übersprungen) wurde – false bei Abbruch.
  function spieleEinen(url: string, signal: AbortSignal): Promise<boolean> {
    return new Promise((resolve) => {
      if (signal.aborted) return resolve(false)

      const audio = new Audio(url)
      audio.playbackRate = tempoRef.current
      audioRef.current = audio

      let erledigt = false
      const abschluss = (weiter: boolean) => {
        if (!erledigt) {
          erledigt = true
          resolve(weiter)
        }
      }

      audio.onended = () => abschluss(true)
      audio.onerror = () => abschluss(true) // Abschnitt überspringen, nicht steckenbleiben

      audio.play().catch(() => abschluss(true))
      signal.addEventListener(
        "abort",
        () => {
          audio.pause()
          abschluss(false)
        },
        { once: true }
      )
    })
  }

  async function vorlesen() {
    setFehler("")
    setLaden(true)
    setPausiert(false)
    setPuffert(false)

    const controller = new AbortController()
    abbrechenRef.current = controller
    const { signal } = controller

    const chunks = textZuChunks(text)

    // Vorgeladenen ersten Abschnitt wiederverwenden, falls Stimme passt
    const vorab = vorabRef.current
    const vorbelegt =
      vorab && vorab.chunkText === chunks[0] && vorab.geschlecht === geschlecht
        ? { promise: vorab.promise }
        : null

    const promises = generiereAlle(chunks, geschlecht, signal, vorbelegt)

    let hatGespielt = false
    let i = 0
    while (i < chunks.length && !signal.aborted) {
      if (hatGespielt) setPuffert(true)
      const url = await promises[i]
      if (signal.aborted) return
      setPuffert(false)

      if (!url) {
        i++ // fehlgeschlagenen Abschnitt überspringen
        continue
      }

      if (!hatGespielt) {
        hatGespielt = true
        setLaden(false)
        setSpielt(true)
      }

      const weiter = await spieleEinen(url, signal)
      if (signal.aborted || !weiter) return
      i++
    }

    if (!hatGespielt && !signal.aborted) {
      setFehler(t("vorlese.fehler.verbindung"))
      setLaden(false)
      return
    }
    if (!signal.aborted) {
      setSpielt(false)
      setPausiert(false)
      setPuffert(false)
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
    setPuffert(false)
    setLaden(false)
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

      {/* Player – nur Steuerung, ohne Fortschrittsanzeige */}
      <div className="bg-indigo-900 rounded-xl p-4 flex items-center gap-4">
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
            <p className="text-indigo-100 text-sm truncate">{titel}</p>
          )}
          <p className="text-indigo-400 text-xs">
            {laden
              ? t("vorlese.erzeugt")
              : puffert
              ? t("vorlese.puffert")
              : zeigtPause
              ? t("vorlese.laeuft")
              : pausiert
              ? t("vorlese.pausiert")
              : t("vorlese.bereit")}
          </p>
        </div>

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

      {fehler && (
        <p className="text-red-300 text-xs mt-2 text-center">{fehler}</p>
      )}
    </div>
  )
}
