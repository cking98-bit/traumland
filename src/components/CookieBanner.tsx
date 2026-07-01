"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSprache } from "@/components/LanguageProvider"

export default function CookieBanner() {
  const { t } = useSprache()
  const [sichtbar, setSichtbar] = useState(false)

  useEffect(() => {
    const einwilligung = localStorage.getItem("cookie-einwilligung")
    if (!einwilligung) setSichtbar(true)
  }, [])

  function akzeptieren() {
    localStorage.setItem("cookie-einwilligung", "ja")
    setSichtbar(false)
  }

  function ablehnen() {
    localStorage.setItem("cookie-einwilligung", "minimal")
    setSichtbar(false)
  }

  if (!sichtbar) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-indigo-900 border border-indigo-700 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-indigo-200 text-sm flex-1">
          {t("cookie.text")}{" "}
          <Link href="/datenschutz" className="text-yellow-400 hover:text-yellow-300 underline">
            {t("cookie.mehr")}
          </Link>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={ablehnen}
            className="text-indigo-400 hover:text-white text-sm px-4 py-2 rounded-xl border border-indigo-700 hover:border-indigo-500 transition"
          >
            {t("cookie.ablehnen")}
          </button>
          <button
            onClick={akzeptieren}
            className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold text-sm px-4 py-2 rounded-xl transition"
          >
            {t("cookie.akzeptieren")}
          </button>
        </div>
      </div>
    </div>
  )
}
