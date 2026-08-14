import Link from "next/link"

export default function DatenschutzPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-indigo-400 hover:text-white text-sm transition">
          ← Zurück
        </Link>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Datenschutzerklärung</h1>

        <div className="text-indigo-200 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher für die Datenverarbeitung auf dieser Website ist:<br /><br />
              Colin King<br />
              Rostockerstraße 38<br />
              10553 Berlin<br />
              E-Mail:{" "}
              <a href="mailto:support@nachtfunke.de" className="text-yellow-400 hover:text-yellow-300">
                support@nachtfunke.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">2. Erhobene Daten</h2>
            <p>
              Wir erheben folgende personenbezogene Daten:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>E-Mail-Adresse (bei Registrierung)</li>
              <li>Name des Kindes und Geburtsdatum (für Kinderprofil)</li>
              <li>Stichwörter, Stil-Präferenzen und optionale Themen für die Geschichten</li>
              <li>Erstellte Geschichten (in deiner Bibliothek, max. 10)</li>
              <li>Nutzungszähler (Anzahl erstellter Geschichten pro Abrechnungszeitraum)</li>
              <li>Abo-Daten (Tarif, Anzahl Kinder, Stripe-Kunden- und Abonnement-ID)</li>
              <li>Zahlungsdaten (werden direkt an Stripe übermittelt, nicht bei uns gespeichert)</li>
              <li>Bei Nutzung des Kündigungsformulars: E-Mail-Adresse, ggf. Name, Eingangsdatum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">3. Zweck der Datenverarbeitung</h2>
            <p>
              Wir verarbeiten deine Daten ausschließlich zum Zweck der Bereitstellung unseres Dienstes:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Personalisierung von KI-Gute-Nacht-Geschichten für dein Kind</li>
              <li>Verwaltung deines Nutzerkontos und Abonnements</li>
              <li>Abwicklung von Zahlungen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">4. Drittanbieter</h2>

            <h3 className="text-white font-semibold mt-3 mb-1">Vercel (Hosting)</h3>
            <p>
              Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet.
              Beim Aufruf der Seite verarbeitet Vercel technisch notwendige Verbindungsdaten
              (u. a. IP-Adresse, Zeitpunkt des Zugriffs) in Server-Logs. Datenschutzerklärung:{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">
                vercel.com/legal/privacy-policy
              </a>
            </p>

            <h3 className="text-white font-semibold mt-3 mb-1">Firebase (Google LLC)</h3>
            <p>
              Wir nutzen Firebase für Authentifizierung und Datenspeicherung (Firestore). Dort werden dein
              Konto, die Kinderprofile, deine Bibliothek mit Geschichten sowie Abo- und
              Nutzungsdaten gespeichert. Anbieter ist Google LLC, 1600 Amphitheatre
              Parkway, Mountain View, CA 94043, USA. Datenschutzerklärung:{" "}
              <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">
                firebase.google.com/support/privacy
              </a>
            </p>

            <h3 className="text-white font-semibold mt-3 mb-1">Stripe</h3>
            <p>
              Zahlungen werden über Stripe Inc., 510 Townsend Street, San Francisco, CA 94103, USA abgewickelt.
              Stripe erhält direkt deine Zahlungsdaten. Datenschutzerklärung:{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">
                stripe.com/de/privacy
              </a>
            </p>

            <h3 className="text-white font-semibold mt-3 mb-1">Google Gemini AI</h3>
            <p>
              Zur Generierung von Geschichten und der Vorlesestimme nutzen wir die Google
              Gemini API. Die Anfragen enthalten den Kindernamen, das Alter, Stichwörter, gewählte Stile
              und Themen sowie für die Vorlesefunktion den Geschichtentext. Datenschutzerklärung:{" "}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">
                ai.google.dev/gemini-api/terms
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Datenübermittlung in Drittländer</h2>
            <p>
              Die genannten Anbieter (Vercel, Google, Stripe) verarbeiten Daten auch in den USA.
              Google LLC, Stripe Inc. und Vercel Inc. sind unter dem EU-U.S. Data Privacy Framework
              zertifiziert; ergänzend kommen EU-Standardvertragsklauseln (Art. 46 DSGVO) zum Einsatz.
              Damit besteht ein von der EU-Kommission anerkanntes Datenschutzniveau.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Cookies und lokale Speicherung</h2>
            <p>
              Wir verwenden ausschließlich technisch notwendige Cookies für die Anmeldung
              (Session-Cookie) sowie localStorage für deine Cookie-Einwilligung und Spracheinstellung.
              Es gibt keine Tracking- oder Werbe-Cookies. Deine Kinderprofile und Geschichten werden
              in deinem Nutzerkonto (Firebase Firestore) gespeichert, damit sie auf allen deinen
              Geräten verfügbar sind.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">7. Kinder und besondere Datenkategorien</h2>
            <p>
              Unser Dienst richtet sich an Eltern. Wir erheben keine Daten direkt von Kindern. Die Angaben zu Kindern
              (Vorname, Geburtsdatum) werden von Eltern/Erziehungsberechtigten eingegeben und ausschließlich zur
              Personalisierung der Geschichten verwendet. Das Geburtsdatum wird lokal zur Altersberechnung genutzt.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">8. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung deiner Daten erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
              sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen an der sicheren Bereitstellung des Dienstes).
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">9. Deine Rechte</h2>
            <p>Du hast das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung dieser Rechte wende dich an:{" "}
              <a href="mailto:support@nachtfunke.de" className="text-yellow-400 hover:text-yellow-300">
                support@nachtfunke.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">10. Beschwerderecht</h2>
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig für Berlin ist
              die Berliner Beauftragte für Datenschutz und Informationsfreiheit.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">11. Speicherdauer und Datenlöschung</h2>
            <p>
              Kontodaten, Profile und Geschichten speichern wir für die Dauer der Vertragsbeziehung.
              Bei Löschung deines Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen
              gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten (z. B. steuerrechtliche
              Fristen für Rechnungsdaten) entgegenstehen. Kündigungsanfragen über das
              Kündigungsformular bewahren wir zu Nachweiszwecken bis zu 3 Jahre auf.
            </p>
          </section>

          <p className="text-indigo-400 text-xs pt-4 border-t border-indigo-700">
            Stand: August 2026
          </p>
        </div>
      </div>
    </div>
  )
}
