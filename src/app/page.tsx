"use client"

import Link from "next/link"
import Features from "@/components/Features"
import { useSprache } from "@/components/LanguageProvider"

export default function Home() {
  const { t } = useSprache()

  return (
    <div className="text-center py-12">
      {/* Hero */}
      <div className="text-6xl md:text-8xl mb-6">🌙</div>
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{t("marke")}</h1>
      <p className="text-indigo-300 text-base md:text-xl mb-10 max-w-lg mx-auto">
        {t("home.untertitel")}
      </p>

      <Link
        href="/generator"
        className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-10 py-4 rounded-full text-lg transition inline-block"
      >
        {t("home.cta")}
      </Link>

      {/* Features – informativ, mit Info-Icons */}
      <Features />
    </div>
  )
}
