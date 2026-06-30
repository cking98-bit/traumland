"use client"

import { useEffect, useState } from "react"
import SchutzRoute from "@/components/SchutzRoute"
import {
  ladeProfile,
  speichereProfil,
  loescheProfil,
  berechneAlter,
  type Profil,
} from "@/lib/profile"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profil[]>([])
  const [name, setName] = useState("")
  const [geburtsdatum, setGeburtsdatum] = useState("")
  const [fehler, setFehler] = useState("")

  // Heutiges Datum als Obergrenze (kein Geburtsdatum in der Zukunft)
  const heute = new Date().toISOString().split("T")[0]

  useEffect(() => {
    setProfile(ladeProfile())
  }, [])

  function hinzufuegen() {
    if (!name.trim()) {
      setFehler("Bitte gib einen Namen ein.")
      return
    }
    if (!geburtsdatum) {
      setFehler("Bitte gib das Geburtsdatum an.")
      return
    }
    const alter = berechneAlter(geburtsdatum)
    if (alter > 12) {
      setFehler("Die Geschichten sind für Kinder bis ca. 8 Jahre gedacht.")
      return
    }
    speichereProfil({ name: name.trim(), geburtsdatum })
    setProfile(ladeProfile())
    setName("")
    setGeburtsdatum("")
    setFehler("")
  }

  function entfernen(id: string) {
    loescheProfil(id)
    setProfile(ladeProfile())
  }

  return (
    <SchutzRoute>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">👧 Kinder-Profile</h1>
        <p className="text-indigo-300 mb-8">
          Lege für jedes Kind ein Profil an – das Alter berechnen wir automatisch
          aus dem Geburtsdatum.
        </p>

        {/* Neues Profil anlegen */}
        <div className="bg-indigo-900 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold mb-4">Neues Kind hinzufügen</h2>

          {fehler && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
              {fehler}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-white text-sm font-medium block mb-2">
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

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                Geburtsdatum
              </label>
              <input
                type="date"
                value={geburtsdatum}
                max={heute}
                onChange={(e) => setGeburtsdatum(e.target.value)}
                className="w-full bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {geburtsdatum && (
                <p className="text-indigo-400 text-xs mt-2">
                  Aktuelles Alter: {berechneAlter(geburtsdatum)} Jahre
                </p>
              )}
            </div>

            <button
              onClick={hinzufuegen}
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-6 py-3 rounded-xl transition"
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Liste der Profile */}
        {profile.length === 0 ? (
          <div className="bg-indigo-900 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">🧸</div>
            <p className="text-indigo-300">
              Noch keine Profile – füge oben dein erstes Kind hinzu.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.map((p) => (
              <div
                key={p.id}
                className="bg-indigo-900 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 text-indigo-950 font-bold flex items-center justify-center">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold">{p.name}</p>
                    <p className="text-indigo-400 text-sm">
                      {berechneAlter(p.geburtsdatum)} Jahre
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => entfernen(p.id)}
                  className="bg-indigo-800 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  🗑 Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SchutzRoute>
  )
}
