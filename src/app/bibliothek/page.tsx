"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ladeGeschichten,
  löscheGeschichte,
  MAX_GESCHICHTEN,
  type Geschichte,
} from "@/lib/geschichten"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"

export default function BibliothekPage() {
  const { t, sprache } = useSprache()
  const { nutzer } = useAuth()
  const [geschichten, setGeschichten] = useState<Geschichte[]>([])
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    if (!nutzer) return
    ladeGeschichten(nutzer.uid).then((liste) => {
      setGeschichten(liste)
      setGeladen(true)
    })
  }, [nutzer])

  async function entfernen(id: string) {
    if (!nutzer) return
    await löscheGeschichte(nutzer.uid, id)
    setGeschichten(await ladeGeschichten(nutzer.uid))
  }

  function geschichteLink(g: Geschichte) {
    const params = new URLSearchParams({
      name: g.name,
      alter: g.alter,
      stichwörter: g.stichwörter,
      stil: g.stil,
      dauer: g.dauer,
      geschichte: g.geschichte,
      titel: g.titel ?? "",
      id: g.id,
    })
    return `/geschichte?${params.toString()}`
  }

  const anzahl = geschichten.length
  const istVoll = anzahl >= MAX_GESCHICHTEN

  return (
    <SchutzRoute>
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">{t("bib.titel")}</h1>
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
          {t("bib.voll")}
        </div>
      )}

      <p className="text-indigo-300 mb-8">{t("bib.untertitel")}</p>

      {/* Ladezustand */}
      {!geladen && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <div className="text-5xl animate-bounce">🌙</div>
          <p className="text-indigo-300">…</p>
        </div>
      )}

      {/* Leerer Zustand */}
      {geladen && geschichten.length === 0 && (
        <div className="bg-indigo-900 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="text-white text-xl font-bold mb-2">
            {t("bib.leerTitel")}
          </h2>
          <p className="text-indigo-300 mb-6">{t("bib.leerText")}</p>
          <Link
            href="/generator"
            className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-3 rounded-xl transition inline-block"
          >
            {t("bib.leerCta")}
          </Link>
        </div>
      )}

      {/* Geschichten-Liste */}
      <div className="grid sm:grid-cols-2 gap-4">
        {geschichten.map((g) => {
          const stilTags = g.stil
            ? g.stil.split(",").map((s) => s.trim()).filter(Boolean)
            : []
          return (
            <div
              key={g.id}
              className="bg-indigo-900 rounded-2xl p-5 flex flex-col"
            >
              {/* Meta-Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {stilTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-indigo-800 text-indigo-300 text-[11px] font-medium px-2.5 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                <span className="bg-indigo-800 text-indigo-300 text-[11px] font-medium px-2.5 py-1 rounded-md">
                  {g.alter} {t("gemein.jahre")}
                </span>
                <span className="bg-indigo-800 text-indigo-300 text-[11px] font-medium px-2.5 py-1 rounded-md">
                  ~{g.dauer} {t("gemein.min")}
                </span>
              </div>

              <h3 className="text-white font-bold text-lg leading-snug mb-1">
                {g.titel || g.name}
              </h3>
              <p className="text-indigo-400 text-xs mb-3">
                {g.titel ? `${t("reader.fuer")} ${g.name} · ` : ""}
                {new Date(g.datum).toLocaleDateString(sprache === "de" ? "de-DE" : "en-GB")}
              </p>

              <p className="text-indigo-200 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                {g.geschichte}
              </p>

              <div className="flex gap-2">
                <Link
                  href={geschichteLink(g)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-2 rounded-lg text-center text-sm transition"
                >
                  {t("bib.oeffnen")}
                </Link>
                <button
                  onClick={() => entfernen(g.id)}
                  className="bg-indigo-800 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  🗑
                </button>
              </div>
              <Link
                href={`/generator?fortsetzung=${g.id}`}
                className="mt-2 block w-full bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-center text-sm transition"
              >
                {t("bib.fortsetzung")}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
    </SchutzRoute>
  )
}