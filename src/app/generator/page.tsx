"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  speichereGeschichte,
  speichereBild,
  zaehleGeschichten,
  ladeGeschichteById,
  MAX_GESCHICHTEN,
  type Geschichte,
} from "@/lib/geschichten"
import { ladeProfile, berechneAlter, type Profil } from "@/lib/profile"
import SchutzRoute from "@/components/SchutzRoute"
import { useSprache } from "@/components/LanguageProvider"
import { useAuth } from "@/components/AuthProvider"
import { authFetch } from "@/lib/apiClient"
import { texte } from "@/lib/i18n"

const STIL_IDS = ["abenteuer", "maerchen", "lustig", "weltraum", "tiere", "fantasy"]
const THEMA_IDS = ["mut", "einschlafen", "zaehneputzen", "teilen", "kita", "freundschaft", "dunkelheit"]

const DAUER = [
  { id: "2", key: "dauer.kurz" },
  { id: "5", key: "dauer.mittel" },
  { id: "10", key: "dauer.lang" },
]

// "Abenteuer 🗺️" → "Abenteuer" (Label ohne Emoji, großgeschrieben)
function stilLabel(id: string, uebersetze: (k: string) => string): string {
  return uebersetze(`stil.${id}`).replace(/[^\p{L}\p{N}\s-]+/gu, "").trim()
}

// Gespeicherten Stil-Text (Label oder alte Klein-ID) zurück zur Stil-ID mappen
function zuStilId(wert: string): string | null {
  const w = wert.trim().toLowerCase()
  if (!w) return null
  for (const id of STIL_IDS) {
    if (id === w) return id
    if (texte.de[`stil.${id}`]?.toLowerCase().startsWith(w)) return id
    if (texte.en[`stil.${id}`]?.toLowerCase().startsWith(w)) return id
  }
  return null
}

export default function GeneratorPage() {
  const router = useRouter()
  const { t, sprache } = useSprache()
  const { nutzer, abo, aboLaden, gratisGenutzt, aboNeuLaden } = useAuth()

  const hatAbo = !!abo && abo.status !== "gekuendigt"

  const [profile, setProfile] = useState<Profil[]>([])
  const [profileGeladen, setProfileGeladen] = useState(false)
  const [profilId, setProfilId] = useState("")
  const [stichwörter, setStichwörter] = useState("")
  const [stil, setStil] = useState<string[]>([])
  const [themen, setThemen] = useState<string[]>([])
  const [dauer, setDauer] = useState("5")
  const [geschichteSprache, setGeschichteSprache] = useState<"de" | "en">(sprache)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")
  const [vorherige, setVorherige] = useState<Geschichte | null>(null)

  // Gratis-Modus: Name + Alter direkt eingeben (ohne Profil)
  const [gratisName, setGratisName] = useState("")
  const [gratisAlter, setGratisAlter] = useState("")

  // Geschichten-Kontingent für den laufenden Abrechnungszeitraum
  const [zaehler, setZaehler] = useState<{
    erstellt: number
    gesamt: number
    verbleibend: number
  } | null>(null)

  // Anzahl gespeicherter Geschichten (Bibliothek)
  const [anzahlGeschichten, setAnzahlGeschichten] = useState(0)

  useEffect(() => {
    if (!nutzer) return

    zaehleGeschichten(nutzer.uid).then(setAnzahlGeschichten)

    ladeProfile(nutzer.uid).then(async (geladen) => {
      setProfile(geladen)
      setProfileGeladen(true)

      const params = new URLSearchParams(window.location.search)

      // Fortsetzung (?fortsetzung=<geschichtenId>): Felder aus der alten Geschichte übernehmen
      const fortsetzungId = params.get("fortsetzung")
      if (fortsetzungId) {
        const alt = await ladeGeschichteById(nutzer.uid, fortsetzungId)
        if (alt) {
          setVorherige(alt)
          setStichwörter(alt.stichwörter)
          setStil(
            alt.stil
              .split(",")
              .map((s) => zuStilId(s))
              .filter((s): s is string => !!s)
          )
          setDauer(alt.dauer)
          if (alt.sprache === "de" || alt.sprache === "en") {
            setGeschichteSprache(alt.sprache)
          }
          const passendesKind = geladen.find((p) => p.name === alt.name)
          if (passendesKind) {
            setProfilId(passendesKind.id)
            return
          }
        }
      }

      const kindId = params.get("kind")
      if (kindId && geladen.some((p) => p.id === kindId)) {
        setProfilId(kindId)
      } else if (geladen.length > 0) {
        setProfilId(geladen[0].id)
      }
    })
  }, [nutzer])

  // Kontingent laden (nur mit Abo)
  useEffect(() => {
    if (!nutzer || !profilId || !hatAbo) return
    authFetch(`/api/geschichte/zaehler?uid=${nutzer.uid}&profilId=${profilId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.fehler) setZaehler(data)
      })
      .catch(() => {})
  }, [nutzer, profilId, hatAbo])

  const ausgewählt = profile.find((p) => p.id === profilId)

  function toggleStil(id: string) {
    setStil((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleThema(id: string) {
    setThemen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const bibliothekVoll = anzahlGeschichten >= MAX_GESCHICHTEN
  const gratisModus = !hatAbo

  // Light-Tarif: Geschichten bis maximal 5 Minuten
  const istLight = abo?.plan === "light"
  const verfuegbareDauern = istLight ? DAUER.filter((d) => d.id !== "10") : DAUER

  useEffect(() => {
    if (istLight && dauer === "10") setDauer("5")
  }, [istLight, dauer])

  function validieren() {
    if (bibliothekVoll)
      return t("gen.fehler.voll").replace("{n}", String(MAX_GESCHICHTEN))
    if (!gratisModus && zaehler && zaehler.verbleibend <= 0)
      return t("gen.fehler.limit")
    if (gratisModus) {
      if (!gratisName.trim()) return t("profil.fehler.name")
      if (!gratisAlter) return t("gen.fehler.alter")
    } else {
      if (!ausgewählt) return t("gen.fehler.kind")
    }
    if (!stichwörter.trim()) return t("gen.fehler.stichwort")
    if (stil.length === 0) return t("gen.fehler.stil")
    return ""
  }

  async function handleSubmit() {
    if (!nutzer) return
    const fehlerText = validieren()
    if (fehlerText) {
      setFehler(fehlerText)
      return
    }

    setFehler("")
    setLaden(true)

    const name = gratisModus ? gratisName.trim() : ausgewählt!.name
    const alter = gratisModus
      ? gratisAlter
      : String(berechneAlter(ausgewählt!.geburtsdatum))
    // Light-Tarif: maximal 5 Minuten
    const echteDauer = gratisModus ? "2" : istLight && dauer === "10" ? "5" : dauer
    const themenText = themen.map((id) => t(`thema.${id}`)).join(", ")
    // Stil als lesbares Label speichern ("Abenteuer, Märchen" statt "abenteuer, maerchen")
    const stilText = stil.map((id) => stilLabel(id, t)).join(", ")

    try {
      // Bild parallel zur Geschichte generieren – so ist beides zusammen fertig
      const bildPromise = authFetch("/api/bild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stichwörter, stil: stilText }),
      })
        .then((r) => r.json())
        .catch(() => null)

      const response = await authFetch("/api/geschichte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          alter,
          stichwörter,
          stile: stilText,
          themen: themenText || null,
          dauer: echteDauer,
          sprache: geschichteSprache,
          profilId: gratisModus ? null : profilId,
          vorherigeGeschichte: vorherige?.geschichte ?? null,
        }),
      })

      const data = await response.json()

      if (response.status === 429 || data.fehler === "limit") {
        setFehler(t("gen.fehler.limit"))
        setLaden(false)
        return
      }

      if (response.status === 403 || data.fehler === "gratis_verbraucht") {
        setFehler(t("gen.gratisVerbraucht"))
        setLaden(false)
        return
      }

      if (data.fehler) {
        setFehler(data.fehler)
        setLaden(false)
        return
      }

      const id = await speichereGeschichte(nutzer.uid, {
        name,
        alter,
        stichwörter,
        stil: stilText,
        dauer: echteDauer,
        geschichte: data.geschichte,
        titel: data.titel || "",
        sprache: geschichteSprache,
      })

      // Gratis-Status aktualisieren (Flag wurde serverseitig gesetzt)
      if (gratisModus) aboNeuLaden()

      // Auf die Illustration warten und speichern –
      // die Geschichte öffnet sich erst, wenn beides fertig ist
      const bildDaten = await bildPromise
      if (id && bildDaten?.bild) {
        await speichereBild(nutzer.uid, id, bildDaten.bild)
      }

      const params = new URLSearchParams({
        name,
        alter,
        stichwörter,
        stil: stilText,
        dauer: echteDauer,
        geschichte: data.geschichte,
        titel: data.titel || "",
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
      <SchutzRoute>
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
    <SchutzRoute>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t("gen.titel")}</h1>
        <p className="text-indigo-300 mb-8">{t("gen.untertitel")}</p>

        {/* Auth/Profile werden geladen */}
        {aboLaden || (!gratisModus && !profileGeladen) ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <div className="text-5xl animate-bounce">🌙</div>
            <p className="text-indigo-300">…</p>
          </div>
        ) : gratisModus && gratisGenutzt ? (
          /* Gratis-Geschichte schon verbraucht → Abo-CTA */
          <div className="bg-indigo-900 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">🌙</div>
            <h2 className="text-white text-xl font-bold mb-2">
              {t("gen.gratisVerbrauchtTitel")}
            </h2>
            <p className="text-indigo-300 mb-6">{t("gen.gratisVerbrauchtText")}</p>
            <Link
              href="/preise"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-3 rounded-xl transition inline-block"
            >
              {t("gen.gratisVerbrauchtCta")}
            </Link>
          </div>
        ) : !gratisModus && profile.length === 0 ? (
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
            {/* Gratis-Banner */}
            {gratisModus && (
              <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-xl px-4 py-3">
                <p className="text-yellow-300 font-bold text-sm">
                  {t("gen.gratisBanner")}
                </p>
                <p className="text-yellow-200 text-xs mt-0.5">
                  {t("gen.gratisBannerText")}
                </p>
              </div>
            )}

            {/* Geschichten-Kontingent */}
            {!gratisModus && zaehler && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  zaehler.verbleibend <= 0
                    ? "bg-orange-500/10 border border-orange-400/40 text-orange-300"
                    : "bg-indigo-800/60 border border-indigo-700 text-indigo-200"
                }`}
              >
                <p className="font-medium">
                  ✨{" "}
                  {t("gen.zaehler")
                    .replace("{verbleibend}", String(zaehler.verbleibend))
                    .replace("{gesamt}", String(zaehler.gesamt))}
                </p>
              </div>
            )}

            {vorherige && (
              <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-xl px-4 py-3">
                <p className="text-yellow-300 font-bold text-sm">
                  {t("gen.fortsetzungBanner")}
                </p>
                <p className="text-yellow-200 text-xs mt-0.5">
                  {t("gen.fortsetzungText")}
                </p>
              </div>
            )}

            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}{" "}
                {bibliothekVoll && (
                  <a href="/bibliothek" className="underline font-bold">
                    {t("gen.zurBibliothek")}
                  </a>
                )}
              </div>
            )}

            {/* Kind: Profil-Auswahl (Abo) oder Name+Alter (Gratis) */}
            {gratisModus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white font-medium block mb-2">
                    {t("profil.name")}
                  </label>
                  <input
                    type="text"
                    value={gratisName}
                    onChange={(e) => setGratisName(e.target.value)}
                    placeholder={t("profil.namePlaceholder")}
                    className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-white font-medium block mb-2">
                    {t("gen.alter")}
                  </label>
                  <select
                    value={gratisAlter}
                    onChange={(e) => setGratisAlter(e.target.value)}
                    className="w-full bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">–</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((a) => (
                      <option key={a} value={String(a)}>
                        {a} {t("gemein.jahre")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
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
            )}

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

            {/* Pädagogisches Thema (optional) */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.thema")}{" "}
                <span className="text-indigo-400 text-sm">
                  {t("gen.themaHint")}
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {THEMA_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleThema(id)}
                    className={`rounded-xl py-3 text-sm font-medium transition ${
                      themen.includes(id)
                        ? "bg-yellow-400 text-indigo-950"
                        : "bg-indigo-800 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {t(`thema.${id}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dauer – im Gratis-Modus fest 2 Minuten */}
            <div>
              <label className="text-white font-medium block mb-2">
                {t("gen.dauer")}{" "}
                <span className="text-indigo-400 text-sm">
                  {gratisModus ? t("gen.dauerGratisHint") : t("gen.dauerHint")}
                </span>
              </label>
              {gratisModus ? (
                <div className="rounded-xl py-3 text-center text-sm font-medium bg-yellow-400 text-indigo-950">
                  {t("dauer.kurz")}
                </div>
              ) : (
                <>
                  <div
                    className={`grid gap-3 ${
                      verfuegbareDauern.length === 3 ? "grid-cols-3" : "grid-cols-2"
                    }`}
                  >
                    {verfuegbareDauern.map((d) => (
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
                  {istLight && (
                    <p className="text-indigo-400 text-xs mt-2">
                      {t("gen.dauerLightHint")}
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-4 rounded-xl text-lg transition mt-2"
            >
              {gratisModus ? t("gen.btnGratis") : t("gen.btn")}
            </button>
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}
