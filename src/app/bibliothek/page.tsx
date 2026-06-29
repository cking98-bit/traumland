"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ladeGeschichten,
  löscheGeschichte,
  MAX_GESCHICHTEN,
  type Geschichte,
} from "@/lib/geschichten"

export default function BibliothekPage() {
  const [geschichten, setGeschichten] = useState<Geschichte[]>([])
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    setGeschichten(ladeGeschichten())
    setGeladen(true)
  }, [])

  function entfernen(id: string) {
    löscheGeschichte(id)
    setGeschichten(ladeGeschichten())
  }

  function geschichteLink(g: Geschichte) {
    const params = new URLSearchParams({
      name: g.name,
      alter: g.alter,
      stichwörter: g.stichwörter,
      stil: g.stil,
      dauer: g.dauer,
      geschichte: g.geschichte,
      id: g.id,
    })
    return `/geschichte?${params.toString()}`
  }

  const anzahl = geschichten.length
  const istVoll = anzahl >= MAX_GESCHICHTEN

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">📚 Meine Bibliothek</h1>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            istVoll
              ? "bg-red-500/20 text-red-300"
              : "bg-indigo-800 text-indigo-300"
          }`}
        >
          {anzahl} / {MAX_GESCHICHTEN}
        </span>
      </div>

      {istVoll && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 rounded-xl px-4 py-3 text-sm mb-6">
          📚 Deine Bibliothek ist voll – lösche eine Geschichte um eine neue
          erstellen zu können.
        </div>
      )}

      <p className="text-indigo-300 mb-8">
        Alle deine generierten Geschichten auf einen Blick
      </p>

      {/* Leerer Zustand */}
      {geladen && geschichten.length === 0 && (
        <div className="bg-indigo-900 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="text-white text-xl font-bold mb-2">
            Noch keine Geschichten
          </h2>
          <p className="text-indigo-300 mb-6">
            Erstelle deine erste personalisierte Geschichte!
          </p>
          <Link
            href="/generator"
            className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-3 rounded-xl transition inline-block"
          >
            Erste Geschichte erstellen ✨
          </Link>
        </div>
      )}

      {/* Geschichten-Liste */}
      <div className="grid sm:grid-cols-2 gap-4">
        {geschichten.map((g) => (
          <div
            key={g.id}
            className="bg-indigo-900 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Gespeichertes Bild */}
            {g.bild ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={g.bild}
                alt="Illustration"
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-indigo-800 flex items-center justify-center">
                <span className="text-indigo-500 text-sm">🎨 Kein Bild</span>
              </div>
            )}

            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                🌙 {g.name}
              </h3>
              <p className="text-indigo-400 text-xs mb-2">
                {new Date(g.datum).toLocaleDateString("de-DE")} · {g.alter} Jahre · ~{g.dauer} Min
              </p>
              <p className="text-indigo-200 text-sm mb-4 line-clamp-2 flex-1">
                {g.geschichte}
              </p>
              <div className="flex gap-2">
                <Link
                  href={geschichteLink(g)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-2 rounded-lg text-center text-sm transition"
                >
                  Öffnen
                </Link>
                <button
                  onClick={() => entfernen(g.id)}
                  className="bg-indigo-800 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}