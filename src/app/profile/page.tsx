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

const pad = (n: string) => n.padStart(2, "0")

export default function ProfilePage() {
  const { t } = useSprache()
  const { abo, nutzer, aboNeuLaden } = useAuth()

  const [profile, setProfile] = useState<Profil[]>([])
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [monat, setMonat] = useState("")
  const [jahr, setJahr] = useState("")
  const [fehler, setFehler] = useState("")

  const aktuellesJahr = new Date().getFullYear()
  const jahre = Array.from({ length: 13 }, (_, i) => aktuellesJahr - i)

  const geburtsdatum =
    tag && monat && jahr ? `${jahr}-${pad(monat)}-${pad(tag)}` : ""

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

  async function weiteresKind() {
    if (!nutzer) return
    await erhoeheKinder(nutzer.uid)
    await aboNeuLaden()
  }

  const selectClass =
    "bg-indigo-800 text-white rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-yellow-400"

  const belegt = profile.length
  const platzFrei = abo ? belegt < abo.kinder : false

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
              {belegt} / {abo.kinder} {t("profil.plaetze")}
            </span>
          </div>
          <p className="text-indigo-300 mb-8">{t("profil.untertitel")}</p>

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
          {profile.length === 0 ? (
            <div className="bg-indigo-900 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🧸</div>
              <p className="text-indigo-300">{t("profil.leer")}</p>
            </div>
          ) : (
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
                    <button
                      onClick={() => entfernen(p.id)}
                      className="bg-indigo-800 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      {t("profil.entfernen")}
                    </button>
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

          {/* Weiteres Kind zum laufenden Vertrag hinzufügen */}
          <div className="mt-6 bg-indigo-900/60 border border-indigo-800 rounded-2xl p-5 text-center">
            <button
              onClick={weiteresKind}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              ➕ {t("profil.weiteresKind")}
            </button>
            <p className="text-indigo-400 text-xs mt-2">
              {t("profil.weiteresKindHinweis")}
            </p>
          </div>
        </div>
      )}
    </SchutzRoute>
  )
}
