"use client"

import { useEffect, useState } from "react"
import SchutzRoute from "@/components/SchutzRoute"
import {
  ladeProfile,
  speichereProfil,
  loescheProfil,
  type Profil,
} from "@/lib/profile"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profil[]>([])
  const [name, setName] = useState("")
  const [alter, setAlter] = useState("5")
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    setProfile(ladeProfile())
  }, [])

  function hinzufuegen() {
    if (!name.trim()) {
      setFehler("Bitte gib einen Namen ein.")
      return
    }
    speichereProfil({ name: name.trim(), alter })
    setProfile(ladeProfile())
    setName("")
    setAlter("5")
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
          Lege für jedes Kind ein Profil an – so wird jede Geschichte perfekt
          personalisiert.
        </p>

        {/* Neues Profil anlegen */}
        <div className="bg-indigo-900 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold mb-4">Neues Kind hinzufügen</h2>

          {fehler && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
              {fehler}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name des Kindes"
              className="flex-1 bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <select
              value={alter}
              onChange={(e) => setAlter(e.target.value)}
              className="bg-indigo-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((a) => (
                <option key={a} value={a}>
                  {a} Jahre
                </option>
              ))}
            </select>
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
                    <p className="text-indigo-400 text-sm">{p.alter} Jahre</p>
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
