"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import { PLAN_INFO, berechnePreis } from "@/lib/plaene"

type AboDetails = {
  abo: {
    plan: string
    kinder: number
    status?: string
    wird_gekuendigt?: boolean
  }
  nextBilling: number | null
  cancelAtPeriodEnd: boolean
}

export default function AboPage() {
  const { t, sprache } = useSprache()
  const { nutzer, laden: authLaden, aboLaden, aboNeuLaden } = useAuth()

  const [details, setDetails] = useState<AboDetails | null>(null)
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState("")
  const [zeigBestaetigung, setZeigBestaetigung] = useState(false)
  const [kuendigtLaedt, setKuendigtLaedt] = useState(false)
  const [erfolg, setErfolg] = useState("")
  const [kuendigenFehler, setKuendigenFehler] = useState("")

  useEffect(() => {
    // Warten bis Auth fertig geladen
    if (authLaden || aboLaden) return
    if (!nutzer) {
      setLaden(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    fetch(`/api/abo/details?uid=${nutzer.uid}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timeout)
        if (data.fehler) {
          if (data.fehler === "Kein Abo") {
            setDetails(null)
          } else {
            setFehler(t("abo.fehler"))
          }
        } else {
          setDetails(data)
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        if (err.name !== "AbortError") {
          setFehler(t("abo.fehler"))
        } else {
          setFehler(t("abo.fehler"))
        }
      })
      .finally(() => setLaden(false))
  }, [nutzer, authLaden, aboLaden]) // eslint-disable-line react-hooks/exhaustive-deps

  async function kuendigen() {
    if (!nutzer) return
    setKuendigtLaedt(true)
    setKuendigenFehler("")
    try {
      const res = await fetch("/api/abo/kuendigen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: nutzer.uid }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setErfolg(t("abo.gekuendigt"))
      setZeigBestaetigung(false)
      await aboNeuLaden()
      const r2 = await fetch(`/api/abo/details?uid=${nutzer.uid}`)
      const d2 = await r2.json()
      if (!d2.fehler) setDetails(d2)
    } catch {
      setKuendigenFehler(t("abo.kuendigenFehler"))
    } finally {
      setKuendigtLaedt(false)
    }
  }

  const planInfo = details ? PLAN_INFO[details.abo.plan] : null
  const istJahr = details?.abo.plan === "familie-jahr"

  const planName = details
    ? details.abo.plan === "light"
      ? t("plan.light")
      : details.abo.plan === "familie"
      ? t("plan.familie")
      : t("plan.familieJahr")
    : ""

  const nextBillingFormatted = details?.nextBilling
    ? new Date(details.nextBilling * 1000).toLocaleDateString(sprache === "de" ? "de-DE" : "en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "–"

  const wirdGekuendigt = details?.cancelAtPeriodEnd || details?.abo.wird_gekuendigt

  return (
    <SchutzRoute>
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link href="/profile" className="text-indigo-400 hover:text-white text-sm transition">
            ← {t("nav.profile")}
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">{t("abo.titel")}</h1>

        {laden ? (
          <div className="bg-indigo-900 rounded-2xl p-8 text-center text-indigo-300">
            {t("abo.laeden")}
          </div>
        ) : fehler ? (
          <div className="flex flex-col gap-4">
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-2xl px-6 py-4">
              {fehler}
            </div>
            <button
              onClick={() => { setFehler(""); setLaden(true); setDetails(null) }}
              className="text-indigo-400 hover:text-white text-sm transition"
            >
              Nochmal versuchen
            </button>
          </div>
        ) : !details ? (
          <div className="bg-indigo-900 rounded-2xl p-8 text-center">
            <p className="text-indigo-300 mb-4">{t("abo.keinAbo")}</p>
            <Link
              href="/preise"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-6 py-3 rounded-xl transition inline-block"
            >
              {t("abo.aboAbschliessen")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {erfolg && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 rounded-2xl px-5 py-4 text-sm">
                {erfolg}
              </div>
            )}

            <div className="bg-indigo-900 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-indigo-400 text-sm">{t("abo.plan")}</span>
                <span className="text-white font-bold">{planName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-indigo-400 text-sm">{t("abo.kinder")}</span>
                <span className="text-white font-bold">{details.abo.kinder}</span>
              </div>

              {planInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.kosten")}</span>
                  <span className="text-white font-bold">
                    {berechnePreis(details.abo.plan, details.abo.kinder)
                      .toFixed(2)
                      .replace(".", sprache === "de" ? "," : ".")}{" "}
                    € / {planInfo.periode === "Jahr" ? t("preise.jahr") : t("preise.monat")}
                  </span>
                </div>
              )}

              {details.nextBilling && (
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.naechsteAbrechnung")}</span>
                  <span className="text-white font-bold">{nextBillingFormatted}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-indigo-400 text-sm">Status</span>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    wirdGekuendigt
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {wirdGekuendigt ? t("abo.status.wirdGekuendigt") : t("abo.status.aktiv")}
                </span>
              </div>
            </div>

            {istJahr && (
              <div className="bg-indigo-800/60 border border-indigo-700 rounded-2xl px-5 py-3 text-indigo-300 text-sm">
                {t("abo.jahrHinweis")}
              </div>
            )}

            {!wirdGekuendigt && (
              <div className="flex flex-col sm:flex-row gap-3">
                {!istJahr && (
                  <Link
                    href="/preise"
                    className="flex-1 text-center bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition"
                  >
                    {t("abo.planAendern")}
                  </Link>
                )}
                <button
                  onClick={() => setZeigBestaetigung(true)}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold px-5 py-3 rounded-xl border border-red-600/40 transition"
                >
                  {t("abo.kuendigen")}
                </button>
              </div>
            )}

            {zeigBestaetigung && (
              <div className="bg-indigo-800 border border-red-500/40 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-2">
                  {t("abo.kuendigenConfirmTitel")}
                </h3>
                <p className="text-indigo-300 text-sm mb-5">
                  {t("abo.kuendigenConfirmText")}
                </p>

                {kuendigenFehler && (
                  <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                    {kuendigenFehler}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setZeigBestaetigung(false); setKuendigenFehler("") }}
                    className="flex-1 bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl transition"
                  >
                    {t("abo.kuendigenNein")}
                  </button>
                  <button
                    onClick={kuendigen}
                    disabled={kuendigtLaedt}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition"
                  >
                    {kuendigtLaedt ? "…" : t("abo.kuendigenJa")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}
