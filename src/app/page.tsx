"use client"

import Link from "next/link"
import Features from "@/components/Features"
import DemoPlayer from "@/components/DemoPlayer"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"

const FAQ_IDS = ["daten", "kuendigen", "kindgerecht", "personalisierung", "geraete", "gratis"]

export default function Home() {
  const { t, sprache } = useSprache()
  const { abo } = useAuth()
  const hatAbo = !!abo && abo.status !== "gekuendigt"
  const demoAudio = sprache === "en" ? "/demo-audio-en.wav" : "/demo-audio.wav"

  return (
    <div className="py-12">
      {/* Hero */}
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-6">🌙</div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{t("marke")}</h1>
        <p className="text-indigo-300 text-base md:text-xl mb-8 max-w-lg mx-auto">
          {t("home.untertitel")}
        </p>

        <Link
          href="/generator"
          className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-10 py-4 rounded-full text-lg transition inline-block"
        >
          {hatAbo ? t("home.cta") : t("home.ctaGratis")}
        </Link>
        {!hatAbo && (
          <p className="text-indigo-400 text-xs mt-3">{t("home.ctaHinweis")}</p>
        )}
      </div>

      {/* Beispiel-Geschichte */}
      <div className="mt-16 bg-indigo-900 rounded-3xl overflow-hidden md:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo-bild.png"
          alt={t("home.beispielAlt")}
          className="w-full md:w-2/5 h-56 md:h-auto object-cover"
        />
        <div className="p-6 md:p-8 flex-1 text-left">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-2">
            {t("home.beispielLabel")}
          </p>
          <h2 className="text-white font-bold text-xl mb-3">
            {t("home.beispielTitel")}
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-4">
            {t("home.beispielText")}
          </p>

          {/* Hörprobe – Quelle wechselt mit der Sprache */}
          <p className="text-indigo-300 text-xs mb-2">🔊 {t("home.hoerprobe")}</p>
          <DemoPlayer key={sprache} src={demoAudio} />
        </div>
      </div>

      {/* So funktioniert's */}
      <div className="mt-16">
        <h2 className="text-white font-bold text-2xl text-center mb-8">
          {t("home.schritteTitel")}
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { emoji: "👧", nr: "1", key: "schritt1" },
            { emoji: "✨", nr: "2", key: "schritt2" },
            { emoji: "🌙", nr: "3", key: "schritt3" },
          ].map((s) => (
            <div key={s.nr} className="bg-indigo-900 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">{s.emoji}</div>
              <p className="text-yellow-400 font-bold text-sm mb-1">
                {t("home.schritt")} {s.nr}
              </p>
              <h3 className="text-white font-bold mb-2">{t(`home.${s.key}.titel`)}</h3>
              <p className="text-indigo-300 text-sm">{t(`home.${s.key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features – informativ, mit Info-Icons */}
      <div className="text-center">
        <Features />
      </div>

      {/* Vertrauen: drei offene Spalten ohne Box */}
      <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
        {[
          { icon: "🔒", key: "vertrauen1" },
          { icon: "🚫", key: "vertrauen2" },
          { icon: "✅", key: "vertrauen3" },
        ].map((v) => (
          <div key={v.key}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-800 flex items-center justify-center text-xl">
              {v.icon}
            </div>
            <p className="text-white font-bold text-sm mb-1">
              {t(`home.${v.key}.titel`)}
            </p>
            <p className="text-indigo-400 text-xs leading-relaxed max-w-[220px] mx-auto">
              {t(`home.${v.key}.text`)}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-white font-bold text-2xl text-center mb-8">
          {t("home.faqTitel")}
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ_IDS.map((id) => (
            <details
              key={id}
              className="bg-indigo-900 rounded-xl px-5 py-4 group"
            >
              <summary className="text-white font-medium text-sm cursor-pointer list-none flex justify-between items-center">
                {t(`faq.${id}.frage`)}
                <span className="text-indigo-400 group-open:rotate-180 transition-transform">
                  ⌄
                </span>
              </summary>
              <p className="text-indigo-300 text-sm mt-3 leading-relaxed">
                {t(`faq.${id}.antwort`)}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Abschluss-CTA */}
      <div className="mt-16 text-center">
        <Link
          href="/preise"
          className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-10 py-4 rounded-full text-lg transition inline-block"
        >
          {t("home.ctaPreise")}
        </Link>
      </div>
    </div>
  )
}
