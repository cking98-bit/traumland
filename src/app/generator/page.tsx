"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const STILE = [
  { id: "abenteuer", label: "Abenteuer 🗺️" },
  { id: "maerchen", label: "Märchen 🧚" },
  { id: "lustig", label: "Lustig 😄" },
  { id: "weltraum", label: "Weltraum 🚀" },
  { id: "tiere", label: "Tiere 🦁" },
  { id: "fantasy", label: "Fantasy 🐉" },
]

export default function GeneratorPage() {
  const router = useRouter()

  // Form-Daten speichern
  const [name, setName] = useState("")
  const [alter, setAlter] = useState("5")
  const [stichwörter, setStichwörter] = useState("")
  const [stil, setStil] = useState("")
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState("")

  function validieren() {
    if (!name.trim()) return "Bitte gib den Namen deines Kindes ein."
    if (!stichwörter.trim()) return "Bitte gib mindestens ein Stichwort ein."
    if (!stil) return "Bitte wähle einen Geschichte-Stil aus."
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

    // Später: echte KI-Anfrage. Jetzt: kurz warten und weiterleiten
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Daten als URL-Parameter übergeben
    const params = new URLSearchParams({
      name,
      alter,
      stichwörter,
      stil,
    })

    router.push(`/geschichte?${params.toString()}`)
  }

  if (laden) {
    return (
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
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">
        ✨ Neue Geschichte erstellen
      </h1>
      <p className="text-indigo-300 mb-8">
        Erzähl uns von deinem Kind – wir zaubern eine einzigartige Geschichte!
      </p>

      <div className="bg-indigo-900 rounded-2xl p-8 flex flex-col gap-6">
        {/* Fehlermeldung */}
        {fehler && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
            {fehler}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="text-white font-medium block mb-2">
            Name des Kindes
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Emma"
            className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Alter */}
        <div>
          <label className="text-white font-medium block mb-2">
            Alter
          </label>
          <select
            value={alter}
            onChange={(e) => setAlter(e.target.value)}
            className="w-full bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((age) => (
              <option key={age} value={age}>
                {age} Jahre
              </option>
            ))}
          </select>
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
            Geschichte-Stil
          </label>
          <div className="grid grid-cols-3 gap-3">
            {STILE.map((s) => (
              <button
                key={s.id}
                onClick={() => setStil(s.id)}
                className={`rounded-xl py-3 text-sm font-medium transition ${
                  stil === s.id
                    ? "bg-yellow-400 text-indigo-950"
                    : "bg-indigo-800 hover:bg-indigo-700 text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-4 rounded-xl text-lg transition mt-2"
        >
          Geschichte generieren ✨
        </button>
      </div>
    </div>
  )
}