"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { authFetch } from "@/lib/apiClient"
import SchutzRoute from "@/components/SchutzRoute"

type Tag = {
  datum: string
  text_anfragen?: number
  tts_anfragen?: number
  gesamt_kosten_usd?: number
}

type Uebersicht = {
  aktiveVertraege: number
  planAufschluesselung: Record<string, number>
  mrrEur: number
  schnupperAnzahlDiesenMonat: number
  schnupperUmsatzDiesenMonatEur: number
  apiKostenUsd: number
  apiKostenEur: number
  stripeGebuehrenMonatEur: number
  umsatzMonatEur: number
  geschaetzterGewinnEur: number
}

function euro(n: number) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
}

export default function AdminPage() {
  const { nutzer } = useAuth()
  const router = useRouter()
  const [uebersicht, setUebersicht] = useState<Uebersicht | null>(null)
  const [kosten, setKosten] = useState<{ tage: Tag[] } | null>(null)
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState("")

  useEffect(() => {
    if (!nutzer) return
    Promise.all([
      authFetch("/api/admin/uebersicht").then((r) => {
        // Kein Admin → gar nichts von der Seite zeigen, direkt zur Startseite.
        // (Die Daten selbst sind ohnehin serverseitig geschützt.)
        if (r.status === 403) {
          router.replace("/")
          throw new Error("Kein Zugriff")
        }
        return r.json()
      }),
      authFetch("/api/admin/kosten").then((r) => r.json()),
    ])
      .then(([u, k]) => {
        setUebersicht(u)
        setKosten(k)
      })
      .catch((e) => setFehler(e.message || "Fehler beim Laden"))
      .finally(() => setLaden(false))
  }, [nutzer, router])

  // Bis die Berechtigung bestätigt ist (oder bei fehlender Berechtigung)
  // nur einen neutralen Ladezustand rendern – keine Admin-Struktur.
  if (laden || fehler || !uebersicht) {
    return (
      <SchutzRoute>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-5xl animate-bounce">🌙</div>
          <p className="text-indigo-300">…</p>
        </div>
      </SchutzRoute>
    )
  }

  return (
    <SchutzRoute>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Admin-Dashboard</h1>
        <p className="text-indigo-400 text-sm mb-8">
          Verträge und Umsatz live aus Stripe, API-Kosten geschätzt aus dem
          Token-Tracking. Für verbindliche Steuer-/Buchhaltungszahlen: Stripe- und
          Google-Cloud-Exporte nutzen.
        </p>

        {(
          <>
            {/* Kernzahlen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-indigo-900 rounded-xl p-5">
                <p className="text-indigo-400 text-xs mb-1">Aktive Verträge</p>
                <p className="text-white text-2xl font-bold">{uebersicht.aktiveVertraege}</p>
              </div>
              <div className="bg-indigo-900 rounded-xl p-5">
                <p className="text-indigo-400 text-xs mb-1">MRR</p>
                <p className="text-white text-2xl font-bold">{euro(uebersicht.mrrEur)}</p>
              </div>
              <div className="bg-indigo-900 rounded-xl p-5">
                <p className="text-indigo-400 text-xs mb-1">Umsatz diesen Monat</p>
                <p className="text-white text-2xl font-bold">{euro(uebersicht.umsatzMonatEur)}</p>
              </div>
              <div
                className={`rounded-xl p-5 ${
                  uebersicht.geschaetzterGewinnEur >= 0
                    ? "bg-green-500/10 border border-green-500/40"
                    : "bg-red-500/10 border border-red-500/40"
                }`}
              >
                <p className="text-indigo-400 text-xs mb-1">Geschätzter Gewinn/Monat</p>
                <p
                  className={`text-2xl font-bold ${
                    uebersicht.geschaetzterGewinnEur >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {euro(uebersicht.geschaetzterGewinnEur)}
                </p>
              </div>
            </div>

            {/* Aufschlüsselung */}
            <div className="bg-indigo-900 rounded-xl p-6 mb-6">
              <h2 className="text-white font-bold mb-4">Verträge nach Tarif</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-indigo-200">
                  <span>Nachtfunke (monatlich)</span>
                  <span className="font-medium">{uebersicht.planAufschluesselung.familie ?? 0}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Nachtfunke Jahr</span>
                  <span className="font-medium">
                    {uebersicht.planAufschluesselung["familie-jahr"] ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-200 pt-2 border-t border-indigo-800 mt-1">
                  <span>Schnupper-Pakete diesen Monat</span>
                  <span className="font-medium">
                    {uebersicht.schnupperAnzahlDiesenMonat} ·{" "}
                    {euro(uebersicht.schnupperUmsatzDiesenMonatEur)}
                  </span>
                </div>
              </div>
            </div>

            {/* Kosten-Aufschlüsselung */}
            <div className="bg-indigo-900 rounded-xl p-6 mb-8">
              <h2 className="text-white font-bold mb-4">Kosten diesen Monat (Schätzung)</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-indigo-200">
                  <span>Stripe-Gebühren</span>
                  <span className="font-medium">{euro(uebersicht.stripeGebuehrenMonatEur)}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Gemini-API (letzte 30 Tage)</span>
                  <span className="font-medium">
                    {euro(uebersicht.apiKostenEur)} (${uebersicht.apiKostenUsd.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Tages-Detail API-Kosten */}
            {kosten && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden">
                <h2 className="text-white font-bold p-6 pb-0">API-Nutzung pro Tag</h2>
                <table className="w-full text-sm mt-4">
                  <thead>
                    <tr className="text-indigo-400 text-left border-b border-indigo-800">
                      <th className="px-6 py-3">Datum</th>
                      <th className="px-6 py-3">Text</th>
                      <th className="px-6 py-3">TTS</th>
                      <th className="px-6 py-3">Kosten (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...kosten.tage].reverse().map((t) => (
                      <tr key={t.datum} className="border-b border-indigo-800/50 text-indigo-200">
                        <td className="px-6 py-2">{t.datum}</td>
                        <td className="px-6 py-2">{t.text_anfragen ?? 0}</td>
                        <td className="px-6 py-2">{t.tts_anfragen ?? 0}</td>
                        <td className="px-6 py-2">${(t.gesamt_kosten_usd ?? 0).toFixed(3)}</td>
                      </tr>
                    ))}
                    {kosten.tage.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-6 text-center text-indigo-400">
                          Noch keine Daten erfasst
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </SchutzRoute>
  )
}
