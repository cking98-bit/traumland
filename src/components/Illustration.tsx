"use client"

import { useState, useEffect } from "react"
import { speichereBild } from "@/lib/geschichten"
import { useSprache } from "@/components/LanguageProvider"

export default function Illustration({
  stichwörter,
  stil,
  geschichteId,
  vorhandenessBild,
}: {
  stichwörter: string
  stil: string
  geschichteId?: string
  vorhandenessBild?: string
}) {
  const { t } = useSprache()
  const [bild, setBild] = useState<string | null>(vorhandenessBild || null)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    // Nicht neu generieren wenn schon ein Bild vorhanden
    if (bild) return
    erzeugen()
  }, [])

  async function erzeugen() {
    setFehler("")
    setLaden(true)
    try {
      const res = await fetch("/api/bild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stichwörter, stil }),
      })
      const data = await res.json()

      if (data.fehler) {
        setFehler(data.fehler)
        return
      }

      setBild(data.bild)

      // Bild in der Bibliothek speichern falls wir eine ID haben
      if (geschichteId) {
        speichereBild(geschichteId, data.bild)
      }
    } catch {
      setFehler(t("illu.fehler"))
    } finally {
      setLaden(false)
    }
  }

  if (laden) {
    return (
      <div className="bg-indigo-800 rounded-xl h-56 flex flex-col items-center justify-center mb-6 gap-3">
        <div className="text-4xl animate-pulse">🎨</div>
        <p className="text-indigo-300 text-sm">{t("illu.malt")}</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (fehler) {
    return (
      <div className="bg-indigo-800 rounded-xl h-56 flex flex-col items-center justify-center mb-6 gap-3">
        <div className="text-4xl">🎨</div>
        <p className="text-red-300 text-sm">{fehler}</p>
        <button
          onClick={erzeugen}
          className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-2 rounded-lg text-sm transition"
        >
          {t("illu.nochmal")}
        </button>
      </div>
    )
  }

  if (bild) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bild}
        alt="Illustration zur Geschichte"
        className="rounded-xl w-full mb-6"
      />
    )
  }

  return null
}
