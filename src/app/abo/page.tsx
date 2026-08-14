"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import { PLAN_INFO, berechnePreis } from "@/lib/plaene"
import { authFetch } from "@/lib/apiClient"

type AboDetails = {
  abo: {
    plan: string
    kinder: number
    status?: string
    wird_gekuendigt?: boolean
    naechster_plan?: {
      plan: string
      kinder: number
      ab: number
    }
  }
  nextBilling: number | null
  periodStart: number | null
  cancelAtPeriodEnd: boolean
  subscriptionStatus: string | null
}

type Rechnung = {
  id: string
  datum: number
  betrag: number
  beschreibung: string
  status: string
  pdfUrl: string | null
  ansichtUrl: string | null
}

export default function AboPage() {
  const { t, sprache } = useSprache()
  const { nutzer, laden: authLaden, aboLaden, aboNeuLaden, schnupperGuthaben } = useAuth()

  const [details, setDetails] = useState<AboDetails | null>(null)
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([])
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState("")
  const [zeigBestaetigung, setZeigBestaetigung] = useState(false)
  const [kuendigtLaedt, setKuendigtLaedt] = useState(false)
  const [erfolg, setErfolg] = useState("")
  const [kuendigenFehler, setKuendigenFehler] = useState("")
  const [widerrufLaedt, setWiderrufLaedt] = useState(false)
  const [reaktivierenLaedt, setReaktivierenLaedt] = useState(false)

  useEffect(() => {
    // Warten bis Auth fertig geladen
    if (authLaden || aboLaden) return
    if (!nutzer) {
      setLaden(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    authFetch(`/api/abo/details`, { signal: controller.signal })
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

    // Rechnungen unabhängig vom Abo laden – auch reine Schnupper-Käufer
    // sollen ihre Belege sehen.
    authFetch(`/api/abo/rechnungen`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rechnungen)) setRechnungen(data.rechnungen)
      })
      .catch(() => {})
  }, [nutzer, authLaden, aboLaden]) // eslint-disable-line react-hooks/exhaustive-deps

  async function kuendigen() {
    if (!nutzer) return
    setKuendigtLaedt(true)
    setKuendigenFehler("")
    try {
      const res = await authFetch("/api/abo/kuendigen", { method: "POST" })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setErfolg(t("abo.gekuendigt"))
      setZeigBestaetigung(false)
      await aboNeuLaden()
      const r2 = await authFetch(`/api/abo/details`)
      const d2 = await r2.json()
      if (!d2.fehler) setDetails(d2)
    } catch {
      setKuendigenFehler(t("abo.kuendigenFehler"))
    } finally {
      setKuendigtLaedt(false)
    }
  }

  async function reaktivieren() {
    if (!nutzer) return
    setReaktivierenLaedt(true)
    setErfolg("")
    setFehler("")
    try {
      const res = await authFetch("/api/abo/reaktivieren", { method: "POST" })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setErfolg(t("abo.reaktiviert"))
      await aboNeuLaden()
      const r2 = await authFetch(`/api/abo/details`)
      const d2 = await r2.json()
      if (!d2.fehler) setDetails(d2)
    } catch {
      setFehler(t("abo.reaktivierenFehler"))
    } finally {
      setReaktivierenLaedt(false)
    }
  }

  async function wechselWiderrufen() {
    if (!nutzer) return
    setWiderrufLaedt(true)
    setErfolg("")
    setFehler("")
    try {
      const res = await authFetch("/api/abo/wechsel-widerrufen", { method: "POST" })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setErfolg(t("wechsel.widerrufenErfolg"))
      await aboNeuLaden()
      const r2 = await authFetch(`/api/abo/details`)
      const d2 = await r2.json()
      if (!d2.fehler) setDetails(d2)
    } catch {
      setFehler(t("wechsel.widerrufenFehler"))
    } finally {
      setWiderrufLaedt(false)
    }
  }

  const planInfo = details ? PLAN_INFO[details.abo.plan] : null
  const istJahr = details?.abo.plan === "familie-jahr"

  function planNameFuer(plan: string) {
    return plan === "familie" ? t("plan.familie") : t("plan.familieJahr")
  }

  function formatDatum(ts: number) {
    return new Date(ts * 1000).toLocaleDateString(sprache === "de" ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  function formatPreis(plan: string, kinder: number) {
    const info = PLAN_INFO[plan]
    if (!info) return ""
    return (
      berechnePreis(plan, kinder).toFixed(2).replace(".", sprache === "de" ? "," : ".") +
      " € / " +
      (info.periode === "Jahr" ? t("preise.jahr") : t("preise.monat"))
    )
  }

  const planName = details ? planNameFuer(details.abo.plan) : ""
  const nextBillingFormatted = details?.nextBilling ? formatDatum(details.nextBilling) : "–"

  const wirdGekuendigt = details?.cancelAtPeriodEnd || details?.abo.wird_gekuendigt
  const naechster = details?.abo.naechster_plan
  // Reaktivierung nur möglich, solange Stripe die Subscription noch aktiv führt
  // (also bis zum Laufzeitende) – danach ist sie final gekündigt
  const kannReaktivieren = wirdGekuendigt && details?.subscriptionStatus === "active"

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
          <div className="flex flex-col gap-4">
            {/* Schnupper-Paket: kein Abo, aber Guthaben vorhanden */}
            {schnupperGuthaben > 0 ? (
              <div className="bg-indigo-900 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.plan")}</span>
                  <span className="text-white font-bold">{t("plan.schnupper")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.verbleibend")}</span>
                  <span className="text-white font-bold">
                    {t("abo.geschichtenAnzahl").replace("{n}", String(schnupperGuthaben))}
                  </span>
                </div>

                <div className="bg-indigo-800/60 rounded-xl px-4 py-3">
                  <p className="text-indigo-300 text-xs">{t("abo.schnupperHinweis")}</p>
                </div>

                <Link
                  href="/preise"
                  className="text-center bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-5 py-3 rounded-xl transition"
                >
                  {t("abo.aboAbschliessen")}
                </Link>
              </div>
            ) : (
              <div className="bg-indigo-900 rounded-2xl p-8 text-center">
                <p className="text-indigo-300 mb-4">{t("abo.keinAbo")}</p>
                <Link
                  href="/preise"
                  className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-6 py-3 rounded-xl transition inline-block"
                >
                  {t("abo.aboAbschliessen")}
                </Link>
              </div>
            )}

            <Rechnungsliste
              rechnungen={rechnungen}
              t={t}
              sprache={sprache}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {erfolg && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 rounded-2xl px-5 py-4 text-sm">
                {erfolg}
              </div>
            )}

            {/* Aktueller Plan */}
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
                    {formatPreis(details.abo.plan, details.abo.kinder)}
                  </span>
                </div>
              )}

              {/* Laufzeit bis: nur bei Kündigung oder anstehendem Wechsel */}
              {(wirdGekuendigt || naechster) && details.nextBilling ? (
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.laufzeitBis")}</span>
                  <span className="text-white font-bold">{nextBillingFormatted}</span>
                </div>
              ) : details.nextBilling ? (
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.naechsteAbrechnung")}</span>
                  <span className="text-white font-bold">{nextBillingFormatted}</span>
                </div>
              ) : null}

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

            {/* Reaktivierung: solange die Kündigung noch nicht wirksam wurde */}
            {kannReaktivieren && (
              <div className="bg-indigo-900 border border-green-500/30 rounded-2xl p-6 flex flex-col gap-3">
                <p className="text-indigo-200 text-sm">
                  {t("abo.reaktivierenHinweis").replace("{datum}", nextBillingFormatted)}
                </p>
                <button
                  onClick={reaktivieren}
                  disabled={reaktivierenLaedt}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold px-5 py-3 rounded-xl transition"
                >
                  {reaktivierenLaedt ? "…" : t("abo.reaktivieren")}
                </button>
              </div>
            )}

            {/* Nächster Plan (bei anstehendem Tarifwechsel) */}
            {naechster && (
              <div className="bg-indigo-900 border border-yellow-400/40 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-yellow-300 font-bold">{t("abo.naechsterPlan")}</h2>
                  <button
                    onClick={wechselWiderrufen}
                    disabled={widerrufLaedt}
                    className="text-indigo-400 hover:text-red-300 text-xs underline transition disabled:opacity-50"
                  >
                    {widerrufLaedt ? "…" : t("wechsel.widerrufen")}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.neuerPlan")}</span>
                  <span className="text-white font-bold">{planNameFuer(naechster.plan)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.kinder")}</span>
                  <span className="text-white font-bold">{naechster.kinder}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.kosten")}</span>
                  <span className="text-white font-bold">
                    {formatPreis(naechster.plan, naechster.kinder)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-sm">{t("abo.startAb")}</span>
                  <span className="text-yellow-300 font-bold">{formatDatum(naechster.ab)}</span>
                </div>
              </div>
            )}

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

            <Rechnungsliste rechnungen={rechnungen} t={t} sprache={sprache} />
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}

// Zahlungsbelege kommen direkt von Stripe (gehostet + als PDF) – wir listen
// sie nur auf, statt eigene Rechnungen zu erzeugen.
function Rechnungsliste({
  rechnungen,
  t,
  sprache,
}: {
  rechnungen: Rechnung[]
  t: (k: string) => string
  sprache: string
}) {
  if (rechnungen.length === 0) return null

  function datum(ts: number) {
    return new Date(ts * 1000).toLocaleDateString(
      sprache === "de" ? "de-DE" : "en-GB",
      { day: "2-digit", month: "2-digit", year: "numeric" }
    )
  }

  function betrag(n: number) {
    return n.toFixed(2).replace(".", sprache === "de" ? "," : ".") + " €"
  }

  return (
    <div className="bg-indigo-900 rounded-2xl p-6">
      <h2 className="text-white font-bold mb-4">{t("abo.rechnungen")}</h2>
      <div className="flex flex-col divide-y divide-indigo-800">
        {rechnungen.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {r.beschreibung}
              </p>
              <p className="text-indigo-400 text-xs">
                {datum(r.datum)} · {betrag(r.betrag)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {r.pdfUrl && (
                <a
                  href={r.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 text-xs font-medium underline"
                >
                  PDF
                </a>
              )}
              {r.ansichtUrl && (
                <a
                  href={r.ansichtUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-white text-xs font-medium underline"
                >
                  {t("abo.belegAnsehen")}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
