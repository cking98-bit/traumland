"use client"

import { useState } from "react"
import Link from "next/link"
import { updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"

export default function KontoPage() {
  const { t } = useSprache()
  const { nutzer, abo, schnupperGuthaben } = useAuth()

  // Firebase kennt nur displayName – für die Anzeige in zwei Felder auftrennen
  // (alles vor dem letzten Leerzeichen ist der Vorname).
  const gespeicherterName = nutzer?.displayName ?? ""
  const letzteLuecke = gespeicherterName.lastIndexOf(" ")
  const [vorname, setVorname] = useState(
    letzteLuecke > 0 ? gespeicherterName.slice(0, letzteLuecke) : gespeicherterName
  )
  const [nachname, setNachname] = useState(
    letzteLuecke > 0 ? gespeicherterName.slice(letzteLuecke + 1) : ""
  )
  const [speichert, setSpeichert] = useState(false)
  const [erfolg, setErfolg] = useState("")
  const [fehler, setFehler] = useState("")

  const hatAbo = !!abo && abo.status !== "gekuendigt"

  async function speichern() {
    if (!auth?.currentUser) return
    if (!vorname.trim() || !nachname.trim()) {
      setFehler(t("konto.fehlerName"))
      return
    }
    setSpeichert(true)
    setFehler("")
    setErfolg("")
    try {
      await updateProfile(auth.currentUser, {
        displayName: `${vorname.trim()} ${nachname.trim()}`,
      })
      setErfolg(t("konto.gespeichert"))
    } catch {
      setFehler(t("konto.fehlerSpeichern"))
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <SchutzRoute>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          {t("konto.titel")}
        </h1>

        <div className="flex flex-col gap-4">
          {/* Persönliche Daten */}
          <div className="bg-indigo-900 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-bold">{t("konto.daten")}</h2>

            {erfolg && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 rounded-xl px-4 py-3 text-sm">
                {erfolg}
              </div>
            )}
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-indigo-400 text-sm block mb-2">
                  {t("login.vorname")}
                </label>
                <input
                  type="text"
                  value={vorname}
                  onChange={(e) => setVorname(e.target.value)}
                  autoComplete="given-name"
                  className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="text-indigo-400 text-sm block mb-2">
                  {t("login.nachname")}
                </label>
                <input
                  type="text"
                  value={nachname}
                  onChange={(e) => setNachname(e.target.value)}
                  autoComplete="family-name"
                  className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="text-indigo-400 text-sm block mb-2">
                {t("konto.email")}
              </label>
              <p className="text-white bg-indigo-800/50 rounded-xl px-4 py-3">
                {nutzer?.email}
              </p>
            </div>

            <button
              onClick={speichern}
              disabled={speichert}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-3 rounded-xl transition"
            >
              {speichert ? "…" : t("konto.speichern")}
            </button>
          </div>

          {/* Aktueller Zugang */}
          <div className="bg-indigo-900 rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="text-white font-bold">{t("konto.zugang")}</h2>
            <div className="flex justify-between items-center">
              <span className="text-indigo-400 text-sm">{t("abo.plan")}</span>
              <span className="text-white font-bold">
                {hatAbo
                  ? abo!.plan === "familie"
                    ? t("plan.familie")
                    : t("plan.familieJahr")
                  : schnupperGuthaben > 0
                  ? t("plan.schnupper")
                  : "–"}
              </span>
            </div>
            {!hatAbo && schnupperGuthaben > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-indigo-400 text-sm">{t("abo.verbleibend")}</span>
                <span className="text-white font-bold">
                  {t("abo.geschichtenAnzahl").replace("{n}", String(schnupperGuthaben))}
                </span>
              </div>
            )}
            <Link
              href="/abo"
              className="mt-2 text-center bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition"
            >
              💳 {t("abo.titel")} →
            </Link>
          </div>

          {/* Rechnungsadresse-Hinweis */}
          <div className="bg-indigo-900/60 border border-indigo-800 rounded-2xl p-5">
            <p className="text-indigo-300 text-sm">{t("konto.adresseHinweis")}</p>
          </div>

          {/* Weitere Links */}
          <div className="bg-indigo-900 rounded-2xl p-6 flex flex-col gap-2">
            <Link
              href="/profile"
              className="text-indigo-300 hover:text-white text-sm transition py-1"
            >
              🧒 {t("nav.profile")} →
            </Link>
            <Link
              href="/bibliothek"
              className="text-indigo-300 hover:text-white text-sm transition py-1"
            >
              📚 {t("nav.bibliothek")} →
            </Link>
            <Link
              href="/kontakt"
              className="text-indigo-300 hover:text-white text-sm transition py-1"
            >
              ✉️ {t("konto.kontakt")} →
            </Link>
          </div>
        </div>
      </div>
    </SchutzRoute>
  )
}
