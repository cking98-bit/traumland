"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import VorleseButton from "@/components/VorleseButton"
import Illustration from "@/components/Illustration"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"

type Params = {
  name: string
  alter: string
  stichwörter: string
  stil: string
  dauer: string
  geschichte: string
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
      id: sp.get("id") ?? "",
    })
  }, [])

  return (
    <SchutzRoute abo>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">
          {t("reader.fuer")} {p?.name}
        </h1>
        <p className="text-indigo-400 text-sm mb-8">
          {p?.alter} {t("gemein.jahre")} · {p?.stichwörter} · {p?.stil}
          {p?.dauer ? ` · ~${p.dauer} ${t("gemein.min")}` : ""}
        </p>

        <div className="bg-indigo-900 rounded-2xl p-8">
          {p && (
            <Illustration
              stichwörter={p.stichwörter}
              stil={p.stil}
              geschichteId={p.id || undefined}
            />
          )}

          {p?.geschichte && <VorleseButton text={p.geschichte} />}

          <div className="text-indigo-100 leading-relaxed text-lg whitespace-pre-line">
            {p?.geschichte}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Link
            href="/generator"
            className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center transition"
          >
            {t("reader.neue")}
          </Link>
          <Link
            href="/bibliothek"
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-xl text-center transition"
          >
            {t("reader.zurBibliothek")}
          </Link>
        </div>
      </div>
    </SchutzRoute>
  )
}
