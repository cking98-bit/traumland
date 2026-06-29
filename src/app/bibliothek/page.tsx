"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ladeGeschichten,
  löscheGeschichte,
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

  // Baut den Link zur Geschichte-Seite mit allen Daten
  function geschichteLink(g: Geschichte) {
    const params = new URLSearchParams({
      name: g.name,
      alter: g.alter,
      stichwörter: g.stichwörter,
      stil: g.stil,
      dauer: g.dauer,
      geschichte: g.geschichte,
    })
    return `/geschichte?${params.toString()}`
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">
        📚 Meine Bibliothek
      </h1>
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
            className="bg-indigo-900 rounded-2xl p-6 flex flex-col"
          >
            <h3 className="text-white font-bold text-lg mb-1">
              🌙 Geschichte für {g.name}
            </h3>
            <p className="text-indigo-400 text-xs mb-3">
              {new Date(g.datum).toLocaleDateString("de-DE")} · {g.alter} Jahre ·{" "}
              {g.stil}
            </p>
            <p className="text-indigo-200 text-sm mb-4 line-clamp-3 flex-1">
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
        ))}
      </div>
    </div>
  )
}