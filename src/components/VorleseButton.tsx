"use client"

import { useState, useRef } from "react"
import { useSprache } from "@/components/LanguageProvider"

type AudioMitSink = HTMLAudioElement & {
  setSinkId?: (id: string) => Promise<void>
}
type MediaDevicesMitAuswahl = MediaDevices & {
  selectAudioOutput?: () => Promise<MediaDeviceInfo>
}

export default function VorleseButton({ text }: { text: string }) {
  const { t } = useSprache()

  const [geschlecht, setGeschlecht] = useState<"weiblich" | "männlich">("weiblich")
  const [laden, setLaden] = useState(false)
  const [spielt, setSpielt] = useState(false)
  const [fehler, setFehler] = useState("")

  const [geraetId, setGeraetId] = useState<string | null>(null)
  const [geraetName, setGeraetName] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const geraeteAuswahlMoeglich =
    typeof navigator !== "undefined" &&
    typeof (navigator.mediaDevices as MediaDevicesMitAuswahl)
      ?.selectAudioOutput === "function"

  async function geraetWaehlen() {
    setFehler("")
    try {
      const md = navigator.mediaDevices as MediaDevicesMitAuswahl
      const geraet = await md.selectAudioOutput!()
      setGeraetId(geraet.deviceId)
      setGeraetName(geraet.label || "✓")
    } catch {
      // Abgebrochen – kein harter Fehler
    }
  }

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

      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(data.audio) as AudioMitSink
      audioRef.current = audio

      if (geraetId && typeof audio.setSinkId === "function") {
        try {
          await audio.setSinkId(geraetId)
        } catch {
          setFehler(t("vorlese.fehler.geraet"))
        }
      }

      audio.onended = () => setSpielt(false)
      audio.onerror = () => {
        setFehler(t("vorlese.fehler.audio"))
        setSpielt(false)
      }

      await audio.play()
      setSpielt(true)
    } catch {
      setFehler(t("vorlese.fehler.verbindung"))
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

      {/* Ausgabegerät */}
      {geraeteAuswahlMoeglich ? (
        <button
          onClick={geraetWaehlen}
          disabled={spielt}
          className="w-full bg-indigo-700 hover:bg-indigo-600 text-white text-sm rounded-lg py-2 mb-4 transition disabled:opacity-50"
        >
          {t("vorlese.geraet")} {geraetName ?? t("vorlese.geraetStandard")}
        </button>
      ) : (
        <p className="text-indigo-400 text-xs mb-4 text-center">
          {t("vorlese.geraetHint")}
        </p>
      )}

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
