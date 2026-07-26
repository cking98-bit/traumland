"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import VorleseButton from "@/components/VorleseButton"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"

type Params = {
  name: string
  alter: string
  stichwörter: string
  stil: string
  dauer: string
  geschichte: string
  titel: string
  id: string
}

export default function GeschichtePage() {
  const { t } = useSprache()
  const [p, setP] = useState<Params | null>(null)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setP({
      name: sp.get("name") ?? "",
      alter: sp.get("alter") ?? "",
      stichwörter: sp.get("stichwörter") ?? "",
      stil: sp.get("stil") ?? "",
      dauer: sp.get("dauer") ?? "",
      geschichte: sp.get("geschichte") ?? "",
      titel: sp.get("titel") ?? "",
      id: sp.get("id") ?? "",
    })
  }, [])

  // Stil-Liste ("Abenteuer, Märchen") in einzelne Tags aufteilen
  const stilTags = p?.stil
    ? p.stil.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <SchutzRoute>
      <article className="max-w-2xl mx-auto">
        {/* Meta-Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {stilTags.map((tag) => (
            <span
              key={tag}
              className="bg-indigo-800 text-indigo-200 text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              {tag}
            </span>
          ))}
          {p?.alter && (
            <span className="bg-indigo-800 text-indigo-200 text-xs font-medium px-3 py-1.5 rounded-lg">
              {p.alter} {t("gemein.jahre")}
            </span>
          )}
          {p?.dauer && (
            <span className="bg-indigo-800 text-indigo-200 text-xs font-medium px-3 py-1.5 rounded-lg">
              ~{p.dauer} {t("gemein.min")}
            </span>
          )}
        </div>

        {/* Titel */}
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
          {p?.titel || `${t("reader.fuer")} ${p?.name}`}
        </h1>
        {p?.titel && (
          <p className="text-indigo-400 text-sm mb-6">
            {t("reader.fuer")} {p?.name}
            {p?.stichwörter ? ` · ${p.stichwörter}` : ""}
          </p>
        )}

        {/* Vorlesen */}
        {p?.geschichte && (
          <div className="border-y border-indigo-800 py-5 my-6">
            <VorleseButton text={p.geschichte} titel={p.titel || undefined} />
          </div>
        )}

        {/* Geschichte mit Initial-Buchstabe */}
        <div className="text-indigo-100 leading-[1.85] text-lg whitespace-pre-line first-letter:float-left first-letter:text-6xl first-letter:font-bold first-letter:text-yellow-400 first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8]">
          {p?.geschichte}
        </div>

        {/* Fortsetzung – nur wenn die Geschichte gespeichert ist (id vorhanden) */}
        {p?.id && (
          <Link
            href={`/generator?fortsetzung=${p.id}`}
            className="block w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-xl text-center transition mt-10"
          >
            {t("reader.fortsetzung")}
          </Link>
        )}

        <div className="flex gap-4 mt-4">
          <Link
            href="/generator"
            className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center transition"
          >
            {t("reader.neue")}
          </Link>
          <Link
            href="/bibliothek"
            className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center transition"
          >
            {t("reader.zurBibliothek")}
          </Link>
        </div>
      </article>
    </SchutzRoute>
  )
}
