"use client"

import Link from "next/link"

type Plan = {
  id: string
  name: string
  preis: string
  periode: string
  hinweis?: string
  beliebt?: boolean
  features: string[]
  cta: string
}

const PLAENE: Plan[] = [
  {
    id: "light",
    name: "Light",
    preis: "7,99 €",
    periode: "/ Monat",
    features: [
      "15 Geschichten pro Monat",
      "Alle Längen (2, 5 & 10 Min)",
      "KI-Illustrationen",
      "Vorlesen (männlich & weiblich)",
      "Persönliche Bibliothek",
    ],
    cta: "Light wählen",
  },
  {
    id: "familie",
    name: "Familie",
    preis: "11,99 €",
    periode: "/ Monat",
    beliebt: true,
    features: [
      "30 Geschichten pro Monat",
      "Alle Längen (2, 5 & 10 Min)",
      "KI-Illustrationen",
      "Vorlesen (männlich & weiblich)",
      "Persönliche Bibliothek",
      "Priorität bei neuen Funktionen",
    ],
    cta: "Familie wählen",
  },
  {
    id: "familie-jahr",
    name: "Familie · Jahr",
    preis: "79,99 €",
    periode: "/ Jahr",
    hinweis: "Nur 6,67 €/Monat · spare 44 %",
    features: [
      "30 Geschichten pro Monat",
      "Alles aus Familie",
      "12 Monate zum Preis von ~7",
      "Jederzeit kündbar",
    ],
    cta: "Jahresabo wählen",
  },
]

export default function PreisePage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Kopf */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">
          Wähle deinen Plan 🌙
        </h1>
        <p className="text-indigo-300 text-lg max-w-xl mx-auto">
          Unbegrenzt magische Gute-Nacht-Geschichten – personalisiert, illustriert
          und vorgelesen.
        </p>
      </div>

      {/* Gratis-Schnupper Banner */}
      <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-white font-bold">
            ✨ Erste Geschichte gratis testen
          </p>
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
          <div
            key={plan.id}
            className={`relative rounded-2xl p-7 flex flex-col ${
              plan.beliebt
                ? "bg-indigo-900 ring-2 ring-yellow-400"
                : "bg-indigo-900"
            }`}
          >
            {plan.beliebt && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full">
                BELIEBTESTE WAHL
              </span>
            )}

            <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-white text-4xl font-bold">{plan.preis}</span>
              <span className="text-indigo-400 text-sm">{plan.periode}</span>
            </div>

            {plan.hinweis && (
              <p className="text-yellow-400 text-sm font-medium mb-4">
                {plan.hinweis}
              </p>
            )}
            {!plan.hinweis && <div className="mb-4" />}

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-indigo-200 text-sm">
                  <span className="text-yellow-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() =>
                alert(
                  "Die Bezahlung richten wir im nächsten Schritt mit Stripe ein 🙂"
                )
              }
              className={`w-full font-bold py-3 rounded-xl transition ${
                plan.beliebt
                  ? "bg-yellow-400 hover:bg-yellow-300 text-indigo-950"
                  : "bg-indigo-800 hover:bg-indigo-700 text-white"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Vertrauens-Hinweis */}
      <p className="text-indigo-400 text-sm text-center mt-10">
        Jederzeit kündbar · Sichere Bezahlung · Keine versteckten Kosten
      </p>
    </div>
  )
}
