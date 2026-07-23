"use client"

import { useEffect, useRef, useState } from "react"

function formatZeit(sekunden: number): string {
  if (!isFinite(sekunden) || sekunden < 0) return "0:00"
  const m = Math.floor(sekunden / 60)
  const s = Math.floor(sekunden % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// Eigener Audio-Player im Dreamland-Stil (Variante B, ohne Download-Option)
export default function DemoPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const balkenRef = useRef<HTMLDivElement | null>(null)
  const [spielt, setSpielt] = useState(false)
  const [position, setPosition] = useState(0)
  const [dauer, setDauer] = useState(0)

  // Bei Sprachwechsel (neue Quelle): zurücksetzen
  useEffect(() => {
    setSpielt(false)
    setPosition(0)
    setDauer(0)
  }, [src])

  function dauerAktualisieren(neu: number) {
    if (isFinite(neu) && neu > 0) setDauer(neu)
  }

  function abspielenWechseln() {
    const audio = audioRef.current
    if (!audio) return
    if (spielt) {
      audio.pause()
      setSpielt(false)
    } else {
      // Gesamtdauer nachholen, falls sie (z.B. auf iOS) vor dem ersten
      // Abspielen noch nicht geladen war
      dauerAktualisieren(audio.duration)
      audio.play().catch(() => {})
      setSpielt(true)
    }
  }

  function spulen(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    const balken = balkenRef.current
    if (!audio || !balken || !dauer) return
    const rect = balken.getBoundingClientRect()
    const anteil = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = anteil * dauer
    setPosition(anteil * dauer)
  }

  const fortschritt = dauer > 0 ? Math.min(100, (position / dauer) * 100) : 0

  return (
    <div className="bg-indigo-950/60 rounded-xl px-4 py-3 flex items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => dauerAktualisieren(e.currentTarget.duration)}
        onDurationChange={(e) => dauerAktualisieren(e.currentTarget.duration)}
        onCanPlay={(e) => dauerAktualisieren(e.currentTarget.duration)}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        onEnded={() => {
          setSpielt(false)
          setPosition(0)
        }}
      />

      <button
        onClick={abspielenWechseln}
        aria-label={spielt ? "Pause" : "Abspielen"}
        className="w-11 h-11 min-w-11 rounded-full bg-yellow-400 hover:bg-yellow-300 flex items-center justify-center transition"
      >
        {spielt ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1e1b4b">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="#1e1b4b">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z" />
          </svg>
        )}
      </button>

      <div
        ref={balkenRef}
        onClick={spulen}
        className="flex-1 py-2 cursor-pointer relative"
      >
        {/* Mitlaufende Zeit-Anzeige direkt über dem Regler-Punkt, während gespielt wird */}
        {spielt && dauer > 0 && (
          <div
            className="absolute -top-6 -translate-x-1/2 text-[10px] leading-none text-indigo-100 bg-indigo-900 px-1.5 py-1 rounded whitespace-nowrap"
            style={{ left: `${fortschritt}%` }}
          >
            {formatZeit(position)}
          </div>
        )}

        <div className="h-1.5 rounded-full bg-indigo-800 relative">
          <div
            className="h-1.5 rounded-full bg-yellow-400"
            style={{ width: `${fortschritt}%` }}
          />
          {dauer > 0 && (
            <div
              className="absolute -top-1 w-3.5 h-3.5 rounded-full bg-yellow-400"
              style={{ left: `calc(${fortschritt}% - 7px)` }}
            />
          )}
        </div>
      </div>

      <span className="text-indigo-400 text-xs min-w-[76px] text-right">
        {formatZeit(position)} / {formatZeit(dauer)}
      </span>
    </div>
  )
}
