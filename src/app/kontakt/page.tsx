"use client"

import { useState } from "react"
import Link from "next/link"

export default function KontaktPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [betreff, setBetreff] = useState("")
  const [nachricht, setNachricht] = useState("")
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState("")
  const [gesendet, setGesendet] = useState(false)

  async function absenden() {
    if (!email.trim() || !nachricht.trim()) {
      setFehler("Bitte gib deine E-Mail-Adresse und eine Nachricht ein.")
      return
    }
    setFehler("")
    setLaedt(true)
    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, betreff, nachricht }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setGesendet(true)
    } catch {
      setFehler("Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut oder schreibe direkt an support@nachtfunke.de.")
    } finally {
      setLaedt(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-indigo-400 hover:text-white text-sm transition">
          ← Zurück
        </Link>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Kontakt</h1>
        <p className="text-indigo-300 text-sm mb-8">
          Hast du eine Frage, einen Wunsch oder ein Problem? Schreib uns – wir melden uns so schnell wie möglich.
        </p>

        {gesendet ? (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl px-6 py-5">
            <p className="text-green-300 font-bold mb-2">
              ✓ Deine Nachricht ist bei uns eingegangen.
            </p>
            <p className="text-green-200 text-sm">
              Wir antworten in der Regel innerhalb von 24 Stunden an die angegebene E-Mail-Adresse.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}
              </div>
            )}

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vor- und Nachname"
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Betreff (optional)
              </label>
              <input
                type="text"
                value={betreff}
                onChange={(e) => setBetreff(e.target.value)}
                placeholder="Worum geht es?"
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Nachricht *
              </label>
              <textarea
                value={nachricht}
                onChange={(e) => setNachricht(e.target.value)}
                placeholder="Schreib uns deine Nachricht..."
                rows={5}
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
            </div>

            <button
              onClick={absenden}
              disabled={laedt}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-3 rounded-xl transition"
            >
              {laedt ? "…" : "Nachricht senden"}
            </button>

            <p className="text-indigo-400 text-xs">
              Oder schreib uns direkt an{" "}
              <a href="mailto:support@nachtfunke.de" className="text-yellow-400 hover:text-yellow-300">
                support@nachtfunke.de
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
