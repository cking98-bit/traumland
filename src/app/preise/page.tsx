"use client"

import { useState } from "react"
import Link from "next/link"

type Plan = {
  id: string
  name: string
  basisPreis: number // pro Abrechnungszeitraum
  proKind: number // Aufpreis je weiteres Kind
  periode: string // "Monat" | "Jahr"
  basisGeschichten: number // pro Monat, inkl. 1 Kind
  proKindGeschichten: number // zusätzliche Geschichten je weiteres Kind
  hinweis?: string
  beliebt?: boolean
  features: string[]
}

const PLAENE: Plan[] = [
  {
    id: "light",
    name: "Light",
    basisPreis: 7.99,
    proKind: 3.99,
    periode: "Monat",
    basisGeschichten: 15,
    proKindGeschichten: 10,
    features: [
      "Eigenes Profil pro Kind",
      "Alle Längen (2, 5 & 10 Min)",
      "KI-Illustrationen",
      "Vorlesen (männlich & weiblich)",
      "Persönliche Bibliothek",
    ],
  },
  {
    id: "familie",
    name: "Familie",
    basisPreis: 11.99,
    proKind: 4.99,
    periode: "Monat",
    basisGeschichten: 30,
    proKindGeschichten: 15,
    beliebt: true,
    features: [
      "Eigenes Profil pro Kind",
      "Alle Längen (2, 5 & 10 Min)",
      "KI-Illustrationen",
      "Vorlesen (männlich & weiblich)",
      "Persönliche Bibliothek",
      "Priorität bei neuen Funktionen",
    ],
  },
  {
    id: "familie-jahr",
    name: "Familie · Jahr",
    basisPreis: 79.99,
    proKind: 39.99,
    periode: "Jahr",
    basisGeschichten: 30,
    proKindGeschichten: 15,
    hinweis: "Nur 6,67 €/Monat · spare 44 %",
    features: [
      "Eigenes Profil pro Kind",
      "Alles aus Familie",
      "12 Monate zum Preis von ~7",
      "Jederzeit kündbar",
    ],
  },
]

function euro(n: number) {
  return n.toFixed(2).replace(".", ",") + " €"
}

function PlanKarte({ plan }: { plan: Plan }) {
  const [kinder, setKinder] = useState(1)

  const gesamtPreis = plan.basisPreis + (kinder - 1) * plan.proKind
  const gesamtGeschichten =
    plan.basisGeschichten + (kinder - 1) * plan.proKindGeschichten

  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col ${
        plan.beliebt ? "bg-indigo-900 ring-2 ring-yellow-400" : "bg-indigo-900"
      }`}
    >
      {plan.beliebt && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full">
          BELIEBTESTE WAHL
        </span>
      )}

      <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>

      <div className="flex items-baseline gap-1">
        <span className="text-white text-4xl font-bold">
          {euro(gesamtPreis)}
        </span>
        <span className="text-indigo-400 text-sm">/ {plan.periode}</span>
      </div>

      {plan.hinweis && (
        <p className="text-yellow-400 text-sm font-medium mt-1">{plan.hinweis}</p>
      )}

      {/* Kinder-Auswahl */}
      <div className="bg-indigo-800/60 rounded-xl p-4 mt-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm font-medium">Kinder</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setKinder((k) => Math.max(1, k - 1))}
              disabled={kinder <= 1}
              className="w-8 h-8 rounded-lg bg-indigo-700 text-white font-bold disabled:opacity-40 hover:bg-indigo-600 transition"
            >
              −
            </button>
            <span className="text-white font-bold w-5 text-center">{kinder}</span>
            <button
              onClick={() => setKinder((k) => Math.min(6, k + 1))}
              disabled={kinder >= 6}
              className="w-8 h-8 rounded-lg bg-indigo-700 text-white font-bold disabled:opacity-40 hover:bg-indigo-600 transition"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-indigo-300 text-xs">
          {kinder === 1
            ? "1 Kind inklusive"
            : `1 Kind inklusive · +${kinder - 1} × ${euro(plan.proKind)} / ${plan.periode}`}
        </p>
        <p className="text-indigo-300 text-xs mt-1">
          ✨ {gesamtGeschichten} Geschichten / Monat
        </p>
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-indigo-200 text-sm"
          >
            <span className="text-yellow-400 mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() =>
          alert(
            `Auswahl: ${plan.name}, ${kinder} Kind(er) – ${euro(
              gesamtPreis
            )}/${plan.periode}.\n\nDie Bezahlung richten wir im nächsten Schritt mit Stripe ein 🙂`
          )
        }
        className={`w-full font-bold py-3 rounded-xl transition ${
          plan.beliebt
            ? "bg-yellow-400 hover:bg-yellow-300 text-indigo-950"
            : "bg-indigo-800 hover:bg-indigo-700 text-white"
        }`}
      >
        {plan.name} wählen
      </button>
    </div>
  )
}

export default function PreisePage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Kopf */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">
          Wähle deinen Plan 🌙
        </h1>
        <p className="text-indigo-300 text-lg max-w-xl mx-auto">
          Ein Plan pro Kind – jederzeit weitere Kinder hinzufügen. Personalisiert,
          illustriert und auf Wunsch vorgelesen.
        </p>
      </div>

      {/* Gratis-Schnupper Banner */}
      <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-white font-bold">✨ Erste Geschichte gratis testen</p>
          <p className="text-indigo-300 text-sm">
            Nach der Anmeldung erstellst du 1 kostenlose 2-Minuten-Geschichte –
            ganz ohne Zahlung.
          </p>
        </div>
        <Link
          href="/login"
          className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap transition"
        >
          Kostenlos starten
        </Link>
      </div>

      {/* Plan-Karten */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLAENE.map((plan) => (
          <PlanKarte key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Vertrauens-Hinweis */}
      <p className="text-indigo-400 text-sm text-center mt-10">
        Jederzeit kündbar · Sichere Bezahlung · Keine versteckten Kosten
      </p>
    </div>
  )
}
