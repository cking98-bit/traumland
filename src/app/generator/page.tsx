"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { speichereGeschichte, istVoll, MAX_GESCHICHTEN } from "@/lib/geschichten"
import { ladeProfile, berechneAlter, type Profil } from "@/lib/profile"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"

const STIL_IDS = ["abenteuer", "maerchen", "lustig", "weltraum", "tiere", "fantasy"]

const DAUER = [
  { id: "2", key: "dauer.kurz" },
  { id: "5", key: "dauer.mittel" },
  { id: "10", key: "dauer.lang" },
]

export default function GeneratorPage() {
  const router = useRouter()
  const { t, sprache } = useSprache()

  const [profile, setProfile] = useState<Profil[]>([])
  const [profilId, setProfilId] = useState("")
  const [stichwörter, setStichwörter] = useState("")
  const [stil, setStil] = useState<string[]>([])
  const [dauer, setDauer] = useState("5")
  const [geschichteSprache, setGeschichteSprache] = useState<"de" | "en">(sprache)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    const geladen = ladeProfile()
    setProfile(geladen)

    // Kind aus dem Link (?kind=...) vorauswählen, sonst erstes Profil
    const params = new URLSearchParams(window.location.search)
    const kindId = params.get("kind")
    if (kindId && geladen.some((p) => p.id === kindId)) {
      setProfilId(kindId)
    } else if (geladen.length > 0) {
      setProfilId(geladen[0].id)
    }
  }, [])

  const ausgewählt = profile.find((p) => p.id === profilId)

  function toggleStil(id: string) {
    setStil((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function validieren() {
    if (istVoll())
      return t("gen.fehler.voll").replace("{n}", String(MAX_GESCHICHTEN))
    if (!ausgewählt) return t("gen.fehler.kind")
    if (!stichwörter.trim()) return t("gen.fehler.stichwort")
    if (stil.length === 0) return t("gen.fehler.stil")
    return ""
  }

  async function handleSubmit() {
    const fehlerText = validieren()
    if (fehlerText) {
      setFehler(fehlerText)
      return
    }

    setFehler("")
    setLaden(true)

    // Alter automatisch aus dem Geburtsdatum des Kindes berechnen
    const alter = String(berechneAlter(ausgewählt!.geburtsdatum))

    try {
      const response = await fetch("/api/geschichte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ausgewählt!.name,
          alter,
          stichwörter,
          stile: stil.join(", "),
          dauer,
          sprache: geschichteSprache,
        }),
      })

      const data = await response.json()

      if (data.fehler) {
        setFehler(data.fehler)
        setLaden(false)
        return
      }

      const stilText = stil.join(", ")
      const id = speichereGeschichte({
        name: ausgewählt!.name,
        alter,
        stichwörter,
        stil: stilText,
        dauer,
        geschichte: data.geschichte,
        sprache: geschichteSprache,
      })

      const params = new URLSearchParams({
        name: ausgewählt!.name,
        alter,
        stichwörter,
        stil: stilText,
        dauer,
        geschichte: data.geschichte,
        sprache: geschichteSprache,
        id: id || "",
      })

      router.push(`/geschichte?${params.toString()}`)
    } catch {
      setFehler(t("gen.fehler.verbindung"))
      setLaden(false)
    }
  }

  if (laden) {
    return (
      <SchutzRoute abo>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-7xl animate-bounce">🌙</div>
          <h2 className="text-2xl font-bold text-white">{t("gen.ladenTitel")}</h2>
          <p className="text-indigo-300">{t("gen.ladenText")}</p>
          <div className="flex gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </SchutzRoute>
    )
  }

  return (
    <SchutzRoute abo>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t("gen.titel")}</h1>
        <p className="text-indigo-300 mb-8">{t("gen.untertitel")}</p>

        {/* Kein Profil vorhanden → zuerst anlegen */}
        {profile.length === 0 ? (
          <div className="bg-indigo-900 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">👧</div>
            <h2 className="text-white text-xl font-bold mb-2">
              {t("gen.profilGateTitel")}
            </h2>
            <p className="text-indigo-300 mb-6">{t("gen.profilGateText")}</p>
            <Link
              href="/profile"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-3 rounded-xl transition inline-block"
            >
              {t("gen.profilGateCta")}
            </Link>
          </div>
        ) : (
          <div className="bg-indigo-900 rounded-2xl p-8 flex flex-col gap-6">
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}{" "}
                {istVoll() && (
                  <a href="/bibliothek" className="underline font-bold">
                    {t("gen.zurBibliothek")}
                  </a>
                )}
              </div>
            )}

            {/* Kind auswählen */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.fuerKind")}
              </label>
              <select
                value={profilId}
                onChange={(e) => setProfilId(e.target.value)}
                className="w-full bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {profile.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({berechneAlter(p.geburtsdatum)} {t("gemein.jahre")})
                  </option>
                ))}
              </select>
              <p className="text-indigo-400 text-xs mt-2">
                <Link href="/profile" className="underline">
                  {t("gen.weitereKinder")}
                </Link>
              </p>
            </div>

            {/* Sprache der Geschichte */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.spracheLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGeschichteSprache("de")}
                  className={`rounded-xl py-3 text-sm font-medium transition ${
                    geschichteSprache === "de"
                      ? "bg-yellow-400 text-indigo-950"
                      : "bg-indigo-800 hover:bg-indigo-700 text-white"
                  }`}
                >
                  🇩🇪 Deutsch
                </button>
                <button
                  onClick={() => setGeschichteSprache("en")}
                  className={`rounded-xl py-3 text-sm font-medium transition ${
                    geschichteSprache === "en"
                      ? "bg-yellow-400 text-indigo-950"
                      : "bg-indigo-800 hover:bg-indigo-700 text-white"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Stichwörter */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.stichwoerter")}{" "}
                <span className="text-indigo-400 text-sm">
                  {t("gen.stichwoerterHint")}
                </span>
              </label>
              <input
                type="text"
                value={stichwörter}
                onChange={(e) => setStichwörter(e.target.value)}
                placeholder={t("gen.stichwoerterPlaceholder")}
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Stil */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.stil")}{" "}
                <span className="text-indigo-400 text-sm">
                  {t("gen.stilHint")}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {STIL_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleStil(id)}
                    className={`rounded-xl py-3 text-sm font-medium transition ${
                      stil.includes(id)
                        ? "bg-yellow-400 text-indigo-950"
                        : "bg-indigo-800 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {t(`stil.${id}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dauer */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.dauer")}{" "}
                <span className="text-indigo-400 text-sm">
                  {t("gen.dauerHint")}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {DAUER.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDauer(d.id)}
                    className={`rounded-xl py-3 text-sm font-medium transition ${
                      dauer === d.id
                        ? "bg-yellow-400 text-indigo-950"
                        : "bg-indigo-800 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {t(d.key)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-4 rounded-xl text-lg transition mt-2"
            >
              {t("gen.btn")}
            </button>
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}
