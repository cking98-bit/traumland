"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import {
  ladeProfile,
  speichereProfil,
  loescheProfil,
  berechneAlter,
  type Profil,
} from "@/lib/profile"
import { erhoeheKinder } from "@/lib/abo"
import { PLAN_INFO } from "@/lib/plaene"

const pad = (n: string) => n.padStart(2, "0")

export default function ProfilePage() {
  const { t, sprache } = useSprache()
  const { abo, nutzer, aboNeuLaden } = useAuth()

  const [profile, setProfile] = useState<Profil[]>([])
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [monat, setMonat] = useState("")
  const [jahr, setJahr] = useState("")
  const [fehler, setFehler] = useState("")

  // Formular für "weiteres Kind" (kostenpflichtig)
  const [zeigAddForm, setZeigAddForm] = useState(false)
  const [addName, setAddName] = useState("")
  const [addTag, setAddTag] = useState("")
  const [addMonat, setAddMonat] = useState("")
  const [addJahr, setAddJahr] = useState("")
  const [addFehler, setAddFehler] = useState("")
  const [addLaedt, setAddLaedt] = useState(false)

  const aktuellesJahr = new Date().getFullYear()
  const jahre = Array.from({ length: 13 }, (_, i) => aktuellesJahr - i)

  const geburtsdatum =
    tag && monat && jahr ? `${jahr}-${pad(monat)}-${pad(tag)}` : ""

  const addGeburtsdatum =
    addTag && addMonat && addJahr
      ? `${addJahr}-${pad(addMonat)}-${pad(addTag)}`
      : ""

  useEffect(() => {
    setProfile(ladeProfile())
  }, [])

  function hinzufuegen() {
    if (!name.trim()) {
      setFehler(t("profil.fehler.name"))
      return
    }
    if (!geburtsdatum) {
      setFehler(t("profil.fehler.datum"))
      return
    }
    if (berechneAlter(geburtsdatum) > 12) {
      setFehler(t("profil.fehler.alt"))
      return
    }
    speichereProfil({ name: name.trim(), geburtsdatum })
    setProfile(ladeProfile())
    setName("")
    setTag("")
    setMonat("")
    setJahr("")
    setFehler("")
  }

  function entfernen(id: string) {
    loescheProfil(id)
    setProfile(ladeProfile())
  }

  async function weiteresKindBestaetigen() {
    if (!nutzer || !abo) return
    if (!addName.trim()) {
      setAddFehler(t("profil.fehler.name"))
      return
    }
    if (!addGeburtsdatum) {
      setAddFehler(t("profil.fehler.datum"))
      return
    }
    if (berechneAlter(addGeburtsdatum) > 12) {
      setAddFehler(t("profil.fehler.alt"))
      return
    }
    setAddLaedt(true)
    try {
      await erhoeheKinder(nutzer.uid)
      speichereProfil({ name: addName.trim(), geburtsdatum: addGeburtsdatum })
      await aboNeuLaden()
      setProfile(ladeProfile())
      setZeigAddForm(false)
      setAddName("")
      setAddTag("")
      setAddMonat("")
      setAddJahr("")
      setAddFehler("")
    } finally {
      setAddLaedt(false)
    }
  }

  const selectClass =
    "bg-indigo-800 text-white rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-yellow-400"

  const belegt = profile.length
  // Platz frei wenn Slots übrig – oder noch gar kein Kind da (immer erstes Kind erlauben)
  const platzFrei = abo ? belegt < abo.kinder || belegt === 0 : false

  const planInfo = abo ? PLAN_INFO[abo.plan] : null
  const periode = planInfo?.periode === "Jahr" ? t("preise.jahr") : t("preise.monat")
  const preisAnzeige = planInfo
    ? `${planInfo.proKind.toFixed(2).replace(".", sprache === "de" ? "," : ".")} € / ${periode}`
    : ""

  return (
    <SchutzRoute abo>
      {!abo ? (
        <div className="flex items-center justify-center min-h-[40vh] text-indigo-300">
          …
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white">{t("profil.titel")}</h1>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-indigo-800 text-indigo-300">
              {belegt} {t("profil.von")} {abo.kinder} {t("profil.plaetze")}
            </span>
          </div>
          <p className="text-indigo-300 mb-8">{t("profil.untertitel")}</p>

          {/* Banner: erstes Kind noch nicht angelegt */}
          {profile.length === 0 && platzFrei && (
            <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🧒</span>
              <div>
                <p className="text-yellow-300 font-bold text-sm">{t("profil.erstesKindHinweis")}</p>
                <p className="text-yellow-200 text-xs mt-0.5">{t("profil.erstesKindCTA")}</p>
              </div>
            </div>
          )}

          {/* Neues Profil anlegen – nur wenn noch ein Platz frei ist */}
          {platzFrei && (
            <div className="bg-indigo-900 rounded-2xl p-6 mb-8">
              <h2 className="text-white font-bold mb-4">{t("profil.neu")}</h2>

              {fehler && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                  {fehler}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    {t("profil.name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("profil.namePlaceholder")}
                    className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    {t("profil.geburtsdatum")}{" "}
                    <span className="text-indigo-400 text-xs">
                      {t("profil.datumFormat")}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.tag")}</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>
                          {pad(String(d))}
                        </option>
                      ))}
                    </select>

                    <select
                      value={monat}
                      onChange={(e) => setMonat(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.monat")}</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={String(m)}>
                          {pad(String(m))}
                        </option>
                      ))}
                    </select>

                    <select
                      value={jahr}
                      onChange={(e) => setJahr(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.jahr")}</option>
                      {jahre.map((j) => (
                        <option key={j} value={String(j)}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {geburtsdatum && (
                    <p className="text-indigo-400 text-xs mt-2">
                      {t("profil.aktuellesAlter")}: {berechneAlter(geburtsdatum)}{" "}
                      {t("profil.jahre")}
                    </p>
                  )}
                </div>

                <button
                  onClick={hinzufuegen}
                  className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-6 py-3 rounded-xl transition"
                >
                  {t("profil.hinzufuegen")}
                </button>
              </div>
            </div>
          )}

          {/* Liste der Profile */}
          {profile.length === 0 && !platzFrei ? (
            <div className="bg-indigo-900 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🧸</div>
              <p className="text-indigo-300">{t("profil.leer")}</p>
            </div>
          ) : profile.length === 0 && platzFrei ? null : (
            <div className="flex flex-col gap-3">
              {profile.map((p) => (
                <div key={p.id} className="bg-indigo-900 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-400 text-indigo-950 font-bold flex items-center justify-center">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold">{p.name}</p>
                        <p className="text-indigo-400 text-sm">
                          {berechneAlter(p.geburtsdatum)} {t("profil.jahre")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Direkt-Link: Neue Geschichte für dieses Kind */}
                  <Link
                    href={`/generator?kind=${p.id}`}
                    className="mt-3 block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-2 rounded-lg text-sm transition"
                  >
                    ✨ {t("profil.neueGeschichteFuer")} {p.name}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Weiteres Kind – erst sichtbar wenn min. 1 Kind vorhanden */}
          {profile.length >= 1 && !zeigAddForm ? (
            <div className="mt-6 bg-indigo-900/60 border border-indigo-800 rounded-2xl p-5 text-center">
              <button
                onClick={() => setZeigAddForm(true)}
                className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition"
              >
                ➕ {t("profil.weiteresKind")}
              </button>
              <p className="text-indigo-400 text-xs mt-2">
                {t("profil.weiteresKindHinweis")}
              </p>
            </div>
          ) : profile.length >= 1 && zeigAddForm ? (
            <div className="mt-6 bg-indigo-900 border border-yellow-400/40 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-1">{t("profil.weiteresKind")}</h2>

              {/* Preis-Hinweis */}
              {planInfo && (
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 mb-5">
                  <p className="text-yellow-300 text-sm font-medium">
                    💳 {t("profil.weiteresKindConfirm").replace("{betrag}", preisAnzeige)}
                  </p>
                </div>
              )}

              {addFehler && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                  {addFehler}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    {t("profil.name")}
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder={t("profil.namePlaceholder")}
                    className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    {t("profil.geburtsdatum")}{" "}
                    <span className="text-indigo-400 text-xs">
                      {t("profil.datumFormat")}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={addTag}
                      onChange={(e) => setAddTag(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.tag")}</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>
                          {pad(String(d))}
                        </option>
                      ))}
                    </select>

                    <select
                      value={addMonat}
                      onChange={(e) => setAddMonat(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.monat")}</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={String(m)}>
                          {pad(String(m))}
                        </option>
                      ))}
                    </select>

                    <select
                      value={addJahr}
                      onChange={(e) => setAddJahr(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("profil.jahr")}</option>
                      {jahre.map((j) => (
                        <option key={j} value={String(j)}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {addGeburtsdatum && (
                    <p className="text-indigo-400 text-xs mt-2">
                      {t("profil.aktuellesAlter")}: {berechneAlter(addGeburtsdatum)}{" "}
                      {t("profil.jahre")}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setZeigAddForm(false)
                      setAddName("")
                      setAddTag("")
                      setAddMonat("")
                      setAddJahr("")
                      setAddFehler("")
                    }}
                    className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    {t("allgemein.abbrechen")}
                  </button>
                  <button
                    onClick={weiteresKindBestaetigen}
                    disabled={addLaedt}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold px-6 py-3 rounded-xl transition"
                  >
                    {addLaedt ? "…" : `💳 ${t("profil.kostenpflichtigHinzufuegen")}`}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SchutzRoute>
  )
}
