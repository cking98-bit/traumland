"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"

// Kündigungsbutton nach § 312k BGB – ohne Login erreichbar
export default function KuendigenPage() {
  const { nutzer, abo } = useAuth()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState("")
  const [bestaetigung, setBestaetigung] = useState<{
    referenz: string
    eingegangen: number
  } | null>(null)

  async function absenden() {
    if (!email.trim()) {
      setFehler("Bitte gib die E-Mail-Adresse deines Kontos an.")
      return
    }
    setFehler("")
    setLaedt(true)
    try {
      const res = await fetch("/api/kuendigung-anfrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, nachricht: "Kündigung über Kündigungsbutton" }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error()
      setBestaetigung({ referenz: data.referenz, eingegangen: data.eingegangen })
    } catch {
      setFehler("Die Kündigung konnte nicht übermittelt werden. Bitte versuche es erneut oder schreibe an support@nachtfunke.de.")
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
        <h1 className="text-3xl font-bold text-white mb-2">Verträge hier kündigen</h1>
        <p className="text-indigo-300 text-sm mb-8">
          Hier kannst du dein Nachtfunke-Abonnement kündigen – auch ohne eingeloggt zu sein.
          Die Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam.
        </p>

        {/* Eingeloggt mit Abo → direkt zur Abo-Verwaltung */}
        {nutzer && abo && (
          <div className="bg-indigo-800/60 border border-indigo-700 rounded-xl px-5 py-4 mb-6">
            <p className="text-indigo-200 text-sm mb-3">
              Du bist eingeloggt. Am schnellsten kündigst du direkt in deiner Abo-Verwaltung:
            </p>
            <Link
              href="/abo"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-6 py-3 rounded-xl transition"
            >
              Zur Abo-Verwaltung →
            </Link>
          </div>
        )}

        {bestaetigung ? (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl px-6 py-5">
            <p className="text-green-300 font-bold mb-2">
              ✓ Deine Kündigungserklärung ist eingegangen.
            </p>
            <p className="text-green-200 text-sm">
              Eingegangen am:{" "}
              {new Date(bestaetigung.eingegangen).toLocaleString("de-DE")}
              <br />
              Referenz: {bestaetigung.referenz}
            </p>
            <p className="text-green-200 text-sm mt-3">
              Wir bestätigen die Kündigung zusätzlich per E-Mail an die angegebene Adresse.
              Bitte bewahre diese Referenz auf.
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
                E-Mail-Adresse deines Kontos *
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

            <button
              onClick={absenden}
              disabled={laedt}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              {laedt ? "…" : "Jetzt kündigen"}
            </button>

            <p className="text-indigo-400 text-xs">
              Mit dem Klick auf „Jetzt kündigen" erklärst du die Kündigung deines
              Abonnements zum nächstmöglichen Zeitpunkt. Du erhältst eine Bestätigung
              mit Eingangsdatum.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
