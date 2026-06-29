"use client"

import { useState, useRef } from "react"

export default function VorleseButton({ text }: { text: string }) {
  const [geschlecht, setGeschlecht] = useState<"weiblich" | "männlich">("weiblich")
  const [laden, setLaden] = useState(false)
  const [spielt, setSpielt] = useState(false)
  const [fehler, setFehler] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function vorlesen() {
    setFehler("")
    setLaden(true)

    try {
      const response = await fetch("/api/vorlesen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, geschlecht }),
      })

      const data = await response.json()

      if (data.fehler) {
        setFehler(data.fehler)
        setLaden(false)
        return
      }

      // Vorhandenes Audio stoppen
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(data.audio)
      audioRef.current = audio
      audio.onended = () => setSpielt(false)
      audio.onerror = () => {
        setFehler("Audio konnte nicht abgespielt werden")
        setSpielt(false)
      }

      await audio.play()
      setSpielt(true)
    } catch {
      setFehler("Verbindungsfehler beim Vorlesen")
    } finally {
      setLaden(false)
    }
  }

  function stoppen() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setSpielt(false)
  }

  return (
    <div className="bg-indigo-800/50 rounded-xl p-4 mb-6">
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
          👩 Weibliche Stimme
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
          👨 Männliche Stimme
        </button>
      </div>

      {/* Abspiel-Steuerung */}
      {laden ? (
        <button
          disabled
          className="w-full bg-yellow-400/60 text-indigo-950 font-bold py-3 rounded-lg"
        >
          🎙️ Stimme wird erzeugt...
        </button>
      ) : !spielt ? (
        <button
          onClick={vorlesen}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-lg transition"
        >
          🔊 Geschichte vorlesen
        </button>
      ) : (
        <button
          onClick={stoppen}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-lg transition"
        >
          ⏹ Vorlesen stoppen
        </button>
      )}

      {fehler && (
        <p className="text-red-300 text-xs mt-2 text-center">{fehler}</p>
      )}
    </div>
  )
}
