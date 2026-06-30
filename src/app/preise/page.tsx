"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import { setzeAbo } from "@/lib/abo"
import type { Sprache } from "@/lib/i18n"

type Plan = {
  id: string
  nameKey: string
  basisPreis: number
  proKind: number
  periodeKey: string
  basisGeschichten: number
  proKindGeschichten: number
  hinweisKey?: string
  beliebt?: boolean
  featureKeys: string[]
}

const PLAENE: Plan[] = [
  {
    id: "light",
    nameKey: "plan.light",
    basisPreis: 10.99,
    proKind: 6.99,
    periodeKey: "preise.monat",
    basisGeschichten: 30,
    proKindGeschichten: 30,
    featureKeys: [
      "feat.profil",
      "feat.bis5",
      "feat.illu",
      "feat.vorlesen",
      "feat.bibliothek",
      "feat.monatlichKuendbar",
    ],
  },
  {
    id: "familie",
    nameKey: "plan.familie",
    basisPreis: 13.99,
    proKind: 8.99,
    periodeKey: "preise.monat",
    basisGeschichten: 30,
    proKindGeschichten: 30,
    beliebt: true,
    featureKeys: [
      "feat.profil",
      "feat.alleLaengen",
      "feat.illu",
      "feat.vorlesen",
      "feat.bibliothek",
      "feat.prio",
      "feat.monatlichKuendbar",
    ],
  },
  {
    id: "familie-jahr",
    nameKey: "plan.familieJahr",
    basisPreis: 129.99,
    proKind: 79.99,
    periodeKey: "preise.jahr",
    basisGeschichten: 30,
    proKindGeschichten: 30,
    hinweisKey: "plan.jahrHinweis",
    featureKeys: [
      "feat.profil",
      "feat.alleLaengen",
      "feat.allesFamilie",
      "feat.festeLaufzeit",
    ],
  },
]

function euro(n: number, sprache: Sprache) {
  const s = n.toFixed(2)
  return (sprache === "de" ? s.replace(".", ",") : s) + " €"
}

function PlanKarte({ plan }: { plan: Plan }) {
  const { t, sprache } = useSprache()
  const { nutzer, aboNeuLaden } = useAuth()
  const router = useRouter()
  const [kinder, setKinder] = useState(1)

  const gesamtPreis = plan.basisPreis + (kinder - 1) * plan.proKind
  const gesamtGeschichten =
    plan.basisGeschichten + (kinder - 1) * plan.proKindGeschichten
  const periode = t(plan.periodeKey)

  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col ${
        plan.beliebt ? "bg-indigo-900 ring-2 ring-yellow-400" : "bg-indigo-900"
      }`}
    >
      {plan.beliebt && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full">
          {t("plan.beliebt")}
        </span>
      )}

      <h2 className="text-white font-bold text-xl mb-1">{t(plan.nameKey)}</h2>

      <div className="flex items-baseline gap-1">
        <span className="text-white text-4xl font-bold">
          {euro(gesamtPreis, sprache)}
        </span>
        <span className="text-indigo-400 text-sm">/ {periode}</span>
      </div>

      {plan.hinweisKey && (
        <p className="text-yellow-400 text-sm font-medium mt-1">
          {t(plan.hinweisKey)}
        </p>
      )}

      {/* Kinder-Auswahl */}
      <div className="bg-indigo-800/60 rounded-xl p-4 mt-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm font-medium">
            {t("preise.kinder")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setKinder((k) => Math.max(1, k - 1))}
              disabled={kinder <= 1}
              className="w-8 h-8 rounded-lg bg-indigo-700 text-white font-bold disabled:opacity-40 hover:bg-indigo-600 transition"
            >
              −
            </button>
            <span className="text-white font-bold w-5 text-center">{kinder}</span>
            <button
              onClick={() => setKinder((k) => Math.min(6, k + 1))}
              disabled={kinder >= 6}
              className="w-8 h-8 rounded-lg bg-indigo-700 text-white font-bold disabled:opacity-40 hover:bg-indigo-600 transition"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-indigo-300 text-xs">
          {kinder === 1
            ? t("preise.einKind")
            : `${t("preise.einKind")} · +${kinder - 1} × ${euro(plan.proKind, sprache)} / ${periode}`}
        </p>
        <p className="text-indigo-300 text-xs mt-1">
          ✨ {gesamtGeschichten} {t("preise.geschichtenProMonat")}
        </p>
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.featureKeys.map((fk) => (
          <li key={fk} className="flex items-start gap-2 text-indigo-200 text-sm">
            <span className="text-yellow-400 mt-0.5">✓</span>
            {t(fk)}
          </li>
        ))}
      </ul>

      <button
        onClick={async () => {
          // Ohne Login zuerst anmelden
          if (!nutzer) {
            router.push("/login")
            return
          }
          // Simuliertes Abo aktivieren (wird später durch Stripe ersetzt)
          await setzeAbo(nutzer.uid, plan.id, kinder)
          await aboNeuLaden()
          router.push("/profile")
        }}
        className={`w-full font-bold py-3 rounded-xl transition ${
          plan.beliebt
            ? "bg-yellow-400 hover:bg-yellow-300 text-indigo-950"
            : "bg-indigo-800 hover:bg-indigo-700 text-white"
        }`}
      >
        {t(plan.nameKey)} {t("preise.waehlen")}
      </button>
    </div>
  )
}

export default function PreisePage() {
  const { t } = useSprache()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">{t("preise.titel")}</h1>
        <p className="text-indigo-300 text-lg max-w-xl mx-auto">
          {t("preise.untertitel")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLAENE.map((plan) => (
          <PlanKarte key={plan.id} plan={plan} />
        ))}
      </div>

      <p className="text-indigo-400 text-sm text-center mt-10">
        {t("preise.trust")}
      </p>
    </div>
  )
}
