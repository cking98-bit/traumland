"use client"

import { useState } from "react"

type Feature = {
  icon: string
  title: string
  kurz: string
  info: string
}

const FEATURES: Feature[] = [
  {
    icon: "🤖",
    title: "KI-generiert",
    kurz: "Jedes Mal eine neue Geschichte",
    info: "Jede Geschichte wird von künstlicher Intelligenz (Google Gemini) frisch für dein Kind geschrieben – basierend auf Name, Alter, Interessen und gewünschtem Stil. Keine zwei Geschichten sind gleich.",
  },
  {
    icon: "🎨",
    title: "Mit Illustrationen",
    kurz: "Passendes Bild zur Geschichte",
    info: "Zu jeder Geschichte erzeugt die KI automatisch ein passendes Bild im gewählten Stil – damit das Vorlesen noch lebendiger und magischer wird.",
  },
  {
    icon: "🔊",
    title: "Vorlesefunktion",
    kurz: "Optional – Text immer dabei",
    info: "Auf Wunsch liest eine natürliche KI-Stimme (männlich oder weiblich) die Geschichte vor. Das ist komplett optional: Der Text wird immer mitgeliefert, du kannst die Geschichte also auch selbst vorlesen.",
  },
]

export default function Features() {
  // Welches Info-Feld ist gerade offen (für Klick auf Mobilgeräten)
  const [offen, setOffen] = useState<string | null>(null)

  return (
    <div className="grid sm:grid-cols-3 gap-6 mt-16 text-left">
      {FEATURES.map((f) => {
        const istOffen = offen === f.title
        return (
          <div
            key={f.title}
            className="group relative bg-indigo-900/60 border border-indigo-800 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="text-4xl mb-3">{f.icon}</div>

              {/* Info-Icon */}
              <button
                type="button"
                onClick={() => setOffen(istOffen ? null : f.title)}
                aria-label={`Mehr Infos zu ${f.title}`}
                className="w-6 h-6 rounded-full border border-indigo-500 text-indigo-300 text-xs font-bold flex items-center justify-center hover:bg-indigo-700 hover:text-white transition"
              >
                i
              </button>
            </div>

            <h3 className="text-white font-bold mb-1">{f.title}</h3>
            <p className="text-indigo-300 text-sm">{f.kurz}</p>

            {/* Erklärungs-Tooltip: erscheint bei Hover (Desktop) oder Klick (Mobil) */}
            <div
              className={`absolute left-0 right-0 top-full mt-2 z-10 bg-indigo-800 border border-indigo-600 rounded-xl p-4 text-indigo-100 text-sm shadow-xl transition
                ${istOffen ? "block" : "hidden group-hover:block"}`}
            >
              {f.info}
            </div>
          </div>
        )
      })}
    </div>
  )
}
