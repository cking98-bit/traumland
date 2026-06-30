"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { speichereGeschichte, istVoll, MAX_GESCHICHTEN } from "@/lib/geschichten"
import { ladeProfile, berechneAlter, type Profil } from "@/lib/profile"
import SchutzRoute from "@/components/SchutzRoute"

const STILE = [
  { id: "abenteuer", label: "Abenteuer 🗺️" },
  { id: "maerchen", label: "Märchen 🧚" },
  { id: "lustig", label: "Lustig 😄" },
  { id: "weltraum", label: "Weltraum 🚀" },
  { id: "tiere", label: "Tiere 🦁" },
  { id: "fantasy", label: "Fantasy 🐉" },
]

const DAUER = [
  { id: "2", label: "Kurz · ~2 Min" },
  { id: "5", label: "Mittel · ~5 Min" },
  { id: "10", label: "Lang · ~10 Min" },
]

export default function GeneratorPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profil[]>([])
  const [profilId, setProfilId] = useState("")
  const [stichwörter, setStichwörter] = useState("")
  const [stil, setStil] = useState<string[]>([])
  const [dauer, setDauer] = useState("5")
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    const geladen = ladeProfile()
    setProfile(geladen)
    if (geladen.length > 0) setProfilId(geladen[0].id)
  }, [])

  const ausgewählt = profile.find((p) => p.id === profilId)

  function toggleStil(id: string) {
    setStil((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function validieren() {
    if (istVoll())
      return `Deine Bibliothek ist voll (max. ${MAX_GESCHICHTEN} Geschichten). Bitte lösche zuerst eine Geschichte.`
    if (!ausgewählt) return "Bitte wähle ein Kind aus."
    if (!stichwörter.trim()) return "Bitte gib mindestens ein Stichwort ein."
    if (stil.length === 0) return "Bitte wähle mindestens einen Geschichte-Stil aus."
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
      })

      const params = new URLSearchParams({
        name: ausgewählt!.name,
        alter,
        stichwörter,
        stil: stilText,
        dauer,
        geschichte: data.geschichte,
        id: id || "",
      })

      router.push(`/geschichte?${params.toString()}`)
    } catch {
      setFehler("Verbindungsfehler – bitte versuche es erneut.")
      setLaden(false)
    }
  }

  if (laden) {
    return (
      <SchutzRoute>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-7xl animate-bounce">🌙</div>
          <h2 className="text-2xl font-bold text-white">
            Wir zaubern deine Geschichte...
          </h2>
          <p className="text-indigo-300">Das dauert nur einen Moment ✨</p>
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
        <h1 className="text-3xl font-bold text-white mb-2">
          ✨ Neue Geschichte erstellen
        </h1>
        <p className="text-indigo-300 mb-8">
          Erzähl uns von deinem Kind – wir zaubern eine einzigartige Geschichte!
        </p>

        {/* Kein Profil vorhanden → zuerst anlegen */}
        {profile.length === 0 ? (
          <div className="bg-indigo-900 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">👧</div>
            <h2 className="text-white text-xl font-bold mb-2">
              Lege zuerst ein Kinder-Profil an
            </h2>
            <p className="text-indigo-300 mb-6">
              Damit wir Geschichten personalisieren können, brauchen wir den Namen
              und das Alter deines Kindes.
            </p>
            <Link
              href="/profile"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-3 rounded-xl transition inline-block"
            >
              Profil anlegen 👧
            </Link>
          </div>
        ) : (
          <div className="bg-indigo-900 rounded-2xl p-8 flex flex-col gap-6">
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}{" "}
                {istVoll() && (
                  <a href="/bibliothek" className="underline font-bold">
                    Zur Bibliothek →
                  </a>
                )}
              </div>
            )}

            {/* Kind auswählen */}
            <div>
              <label className="text-white font-medium block mb-2">
                Für welches Kind?
              </label>
              <select
                value={profilId}
                onChange={(e) => setProfilId(e.target.value)}
                className="w-full bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {profile.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({berechneAlter(p.geburtsdatum)} Jahre)
                  </option>
                ))}
              </select>
              <p className="text-indigo-400 text-xs mt-2">
                Weitere Kinder im{" "}
                <Link href="/profile" className="underline">
                  Profil-Bereich
                </Link>{" "}
                hinzufügen.
              </p>
            </div>

            {/* Stichwörter */}
            <div>
              <label className="text-white font-medium block mb-2">
                Stichwörter{" "}
                <span className="text-indigo-400 text-sm">
                  (was liebt dein Kind?)
                </span>
              </label>
              <input
                type="text"
                value={stichwörter}
                onChange={(e) => setStichwörter(e.target.value)}
                placeholder="z.B. Drachen, Weltall, Fußball"
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Stil */}
            <div>
              <label className="text-white font-medium block mb-2">
                Geschichte-Stil{" "}
                <span className="text-indigo-400 text-sm">
                  (mehrere auswählbar)
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {STILE.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStil(s.id)}
                    className={`rounded-xl py-3 text-sm font-medium transition ${
                      stil.includes(s.id)
                        ? "bg-yellow-400 text-indigo-950"
                        : "bg-indigo-800 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dauer */}
            <div>
              <label className="text-white font-medium block mb-2">
                Dauer{" "}
                <span className="text-indigo-400 text-sm">
                  (wie lange soll vorgelesen werden?)
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
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-4 rounded-xl text-lg transition mt-2"
            >
              Geschichte generieren ✨
            </button>
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}
