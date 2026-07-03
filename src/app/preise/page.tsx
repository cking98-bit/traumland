"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import { authFetch } from "@/lib/apiClient"
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
  const { nutzer, abo, aboNeuLaden } = useAuth()
  const router = useRouter()
  const [kinder, setKinder] = useState(1)
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState("")

  // Planwechsel (wenn bereits ein Abo besteht)
  const [zeigWechsel, setZeigWechsel] = useState(false)
  const [wechselDatum, setWechselDatum] = useState<number | null>(null)

  const gesamtPreis = plan.basisPreis + (kinder - 1) * plan.proKind
  const periode = t(plan.periodeKey)

  const hatAbo = !!abo && abo.status !== "gekuendigt"
  const istAktuellerPlan = hatAbo && abo!.plan === plan.id

  function formatDatum(ts: number) {
    return new Date(ts * 1000).toLocaleDateString(
      sprache === "de" ? "de-DE" : "en-GB",
      { day: "2-digit", month: "long", year: "numeric" }
    )
  }

  // Wechsel-Dialog öffnen: Datum des nächsten Abrechnungszeitraums holen
  async function wechselStarten() {
    if (!nutzer) return
    if (abo!.plan === "familie-jahr") {
      setFehler(t("wechsel.jahrGesperrt"))
      return
    }
    setFehler("")
    setLaedt(true)
    try {
      const res = await authFetch(`/api/abo/details`)
      const data = await res.json()
      setWechselDatum(data.nextBilling ?? null)
      setZeigWechsel(true)
    } catch {
      setFehler(t("wechsel.fehler"))
    } finally {
      setLaedt(false)
    }
  }

  async function wechselBestaetigen() {
    if (!nutzer) return
    setLaedt(true)
    setFehler("")
    try {
      const res = await authFetch("/api/abo/wechseln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, kinder }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error()
      await aboNeuLaden()
      router.push("/abo")
    } catch {
      setFehler(t("wechsel.fehler"))
      setLaedt(false)
    }
  }

  async function neuAbschliessen() {
    if (!nutzer) {
      router.push("/login")
      return
    }
    setLaedt(true)
    setFehler("")
    try {
      const res = await authFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          kinder,
          email: nutzer.email,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setFehler(t("wechsel.fehler"))
        setLaedt(false)
      }
    } catch {
      setFehler(t("wechsel.fehler"))
      setLaedt(false)
    }
  }

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
          ✨ {t("preise.proTag")}
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

      {fehler && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-xs mb-4">
          {fehler}
        </div>
      )}

      {/* Wechsel-Bestätigung */}
      {zeigWechsel ? (
        <div className="bg-indigo-800 border border-yellow-400/40 rounded-xl p-4 mb-2">
          <h3 className="text-white font-bold text-sm mb-2">{t("wechsel.titel")}</h3>
          <p className="text-indigo-200 text-xs mb-4">
            {t("wechsel.text")
              .replace("{plan}", t(plan.nameKey))
              .replace("{datum}", wechselDatum ? formatDatum(wechselDatum) : "–")}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={wechselBestaetigen}
              disabled={laedt}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-2.5 rounded-lg text-sm transition"
            >
              {laedt ? "…" : t("wechsel.bestaetigen")}
            </button>
            <button
              onClick={() => setZeigWechsel(false)}
              disabled={laedt}
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg text-sm transition"
            >
              {t("wechsel.abbrechen")}
            </button>
          </div>
        </div>
      ) : (
        <button
          disabled={laedt || istAktuellerPlan}
          onClick={hatAbo ? wechselStarten : neuAbschliessen}
          className={`w-full font-bold py-3 rounded-xl transition disabled:opacity-60 ${
            plan.beliebt
              ? "bg-yellow-400 hover:bg-yellow-300 text-indigo-950"
              : "bg-indigo-800 hover:bg-indigo-700 text-white"
          }`}
        >
          {laedt
            ? "…"
            : istAktuellerPlan
            ? `✓ ${t("abo.plan")}`
            : hatAbo
            ? `${t("wechsel.titel")}: ${t(plan.nameKey)}`
            : `${t(plan.nameKey)} ${t("preise.waehlen")}`}
        </button>
      )}
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
      <p className="text-indigo-500 text-xs text-center mt-2">
        {t("preise.agbHinweis1")}{" "}
        <a href="/agb" className="underline hover:text-indigo-300">
          {t("preise.agbLink")}
        </a>{" "}
        {t("preise.agbHinweis2")}{" "}
        <a href="/widerruf" className="underline hover:text-indigo-300">
          {t("preise.widerrufLink")}
        </a>
        .
      </p>
    </div>
  )
}
