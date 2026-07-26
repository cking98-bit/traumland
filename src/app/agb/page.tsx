import Link from "next/link"

export default function AgbPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-indigo-400 hover:text-white text-sm transition">
          ← Zurück
        </Link>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <div className="text-indigo-200 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 1 Geltungsbereich und Anbieter</h2>
            <p>
              Diese AGB gelten für alle Verträge über die Nutzung des Dienstes „Dreamland"
              (KI-generierte Gute-Nacht-Geschichten) zwischen Colin King, Rostockerstraße 38,
              10553 Berlin (nachfolgend „Anbieter") und Verbrauchern (nachfolgend „Kunde").
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 2 Leistungsbeschreibung</h2>
            <p>
              Der Anbieter stellt eine Web-Anwendung bereit, mit der personalisierte,
              KI-generierte Gute-Nacht-Geschichten für Kinder erstellt werden können –
              einschließlich optionaler Vorlesefunktion. Der Umfang
              (Anzahl der Geschichten, Geschichtenlänge, Anzahl der Kinderprofile) richtet
              sich nach dem gewählten Tarif. Die Geschichten werden durch künstliche
              Intelligenz erzeugt; der Anbieter übernimmt keine Gewähr für einen bestimmten
              Inhalt einzelner Geschichten.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 3 Vertragsschluss</h2>
            <p>
              Der Vertrag kommt zustande, wenn der Kunde einen Tarif auswählt und den
              Bezahlvorgang über den Zahlungsdienstleister Stripe abschließt. Vor dem
              Kauf kann eine kostenlose Probegeschichte erstellt werden; hierdurch kommt
              kein kostenpflichtiger Vertrag zustande.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 4 Preise und Zahlung</h2>
            <p>
              Es gelten die zum Zeitpunkt der Bestellung auf der Preisseite angegebenen
              Preise. Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer.
              Die Zahlung erfolgt über Stripe. Monatstarife werden monatlich im Voraus
              abgerechnet, der Jahrestarif jährlich im Voraus.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 5 Laufzeit und Kündigung</h2>
            <p>
              Monatstarife verlängern sich automatisch um jeweils einen Monat und können
              jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden.
              Der Jahrestarif hat eine Laufzeit von 12 Monaten, verlängert sich automatisch
              um weitere 12 Monate und kann jederzeit zum Ende der laufenden Vertragslaufzeit
              gekündigt werden. Die Kündigung ist über die Abo-Verwaltung im Kundenkonto
              oder über die Seite{" "}
              <Link href="/kuendigen" className="text-yellow-400 hover:text-yellow-300 underline">
                „Verträge hier kündigen"
              </Link>{" "}
              möglich. Ein Tarifwechsel bei Monatstarifen wird zum nächsten
              Abrechnungszeitraum wirksam.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 6 Widerrufsrecht</h2>
            <p>
              Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten ergeben
              sich aus der{" "}
              <Link href="/widerruf" className="text-yellow-400 hover:text-yellow-300 underline">
                Widerrufsbelehrung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 7 Nutzungsrechte</h2>
            <p>
              Die erstellten Geschichten dürfen für private,
              nicht-kommerzielle Zwecke frei genutzt werden. Eine kommerzielle Verwertung
              ist ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 8 Verfügbarkeit</h2>
            <p>
              Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit
              des Dienstes. Wartungsarbeiten, Weiterentwicklungen oder Störungen bei
              Drittanbietern (z. B. KI-Diensten) können zu vorübergehenden Einschränkungen
              führen.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 9 Haftung</h2>
            <p>
              Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie
              bei Verletzung von Leben, Körper und Gesundheit. Bei einfacher Fahrlässigkeit
              haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten
              (Kardinalpflichten), begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 10 Datenschutz</h2>
            <p>
              Informationen zur Verarbeitung personenbezogener Daten finden sich in der{" "}
              <Link href="/datenschutz" className="text-yellow-400 hover:text-yellow-300 underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">§ 11 Schlussbestimmungen</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
              UN-Kaufrechts. Sollten einzelne Bestimmungen dieser AGB unwirksam sein,
              bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>

          <p className="text-indigo-400 text-xs pt-4 border-t border-indigo-700">
            Stand: Juli 2026
          </p>
        </div>
      </div>
    </div>
  )
}
