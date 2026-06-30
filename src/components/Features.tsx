"use client"

import { useState } from "react"
import { useSprache } from "@/components/LanguageProvider"

export default function Features() {
  const { t } = useSprache()
  const [offen, setOffen] = useState<string | null>(null)

  const FEATURES = [
    {
      key: "ki",
      icon: "🤖",
      titel: t("feature.ki.titel"),
      kurz: t("feature.ki.kurz"),
      info: t("feature.ki.info"),
    },
    {
      key: "bild",
      icon: "🎨",
      titel: t("feature.bild.titel"),
      kurz: t("feature.bild.kurz"),
      info: t("feature.bild.info"),
    },
    {
      key: "audio",
      icon: "🔊",
      titel: t("feature.audio.titel"),
      kurz: t("feature.audio.kurz"),
      info: t("feature.audio.info"),
    },
  ]

  return (
    <div className="grid sm:grid-cols-3 gap-6 mt-16 text-left">
      {FEATURES.map((f) => {
        const istOffen = offen === f.key
        return (
          <div
            key={f.key}
            className="group relative bg-indigo-900/60 border border-indigo-800 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="text-4xl mb-3">{f.icon}</div>
              <button
                type="button"
                onClick={() => setOffen(istOffen ? null : f.key)}
                aria-label={f.titel}
                className="w-6 h-6 rounded-full border border-indigo-500 text-indigo-300 text-xs font-bold flex items-center justify-center hover:bg-indigo-700 hover:text-white transition"
              >
                i
              </button>
            </div>

            <h3 className="text-white font-bold mb-1">{f.titel}</h3>
            <p className="text-indigo-300 text-sm">{f.kurz}</p>

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
