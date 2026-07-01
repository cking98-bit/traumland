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
              <a href="mailto:colin.kinginfo@gmail.com" className="text-yellow-400 hover:text-yellow-300">
                colin.kinginfo@gmail.com
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
              <li>Stichwörter und Präferenzen für die Geschichte</li>
              <li>Zahlungsdaten (werden direkt an Stripe übermittelt, nicht bei uns gespeichert)</li>
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

            <h3 className="text-white font-semibold mt-3 mb-1">Firebase (Google LLC)</h3>
            <p>
              Wir nutzen Firebase für Authentifizierung und Datenspeicherung. Anbieter ist Google LLC, 1600 Amphitheatre
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
              Zur Generierung von Geschichten und Illustrationen nutzen wir die Google Gemini API. Die Anfragen
              enthalten den Kindernamen, Alter und Stichwörter. Datenschutzerklärung:{" "}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300">
                ai.google.dev/gemini-api/terms
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">5. Cookies</h2>
            <p>
              Wir verwenden technisch notwendige Cookies für die Authentifizierung (Firebase Session-Cookie) sowie
              lokale Speicherung (localStorage) für Kinderprofil-Daten und Geschichten. Diese Daten verlassen dein
              Gerät nicht und werden nicht für Werbezwecke genutzt.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">6. Kinder und besondere Datenkategorien</h2>
            <p>
              Unser Dienst richtet sich an Eltern. Wir erheben keine Daten direkt von Kindern. Die Angaben zu Kindern
              (Vorname, Geburtsdatum) werden von Eltern/Erziehungsberechtigten eingegeben und ausschließlich zur
              Personalisierung der Geschichten verwendet. Das Geburtsdatum wird lokal zur Altersberechnung genutzt.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">7. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung deiner Daten erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
              sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen an der sicheren Bereitstellung des Dienstes).
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">8. Deine Rechte</h2>
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
              <a href="mailto:colin.kinginfo@gmail.com" className="text-yellow-400 hover:text-yellow-300">
                colin.kinginfo@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">9. Beschwerderecht</h2>
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig für Berlin ist
              die Berliner Beauftragte für Datenschutz und Informationsfreiheit.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">10. Datenlöschung bei Kontokündigung</h2>
            <p>
              Bei Kündigung deines Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht,
              sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <p className="text-indigo-400 text-xs pt-4 border-t border-indigo-700">
            Stand: Juli 2025
          </p>
        </div>
      </div>
    </div>
  )
}
