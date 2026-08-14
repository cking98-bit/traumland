import Link from "next/link"

export default function ImpressumPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-indigo-400 hover:text-white text-sm transition">
          ← Zurück
        </Link>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>

        <div className="text-indigo-200 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">Angaben gemäß § 5 DDG</h2>
            <p>
              Colin King<br />
              Rostockerstraße 38<br />
              10553 Berlin<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a
                href="mailto:support@nachtfunke.de"
                className="text-yellow-400 hover:text-yellow-300"
              >
                support@nachtfunke.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Verantwortlich für den Inhalt</h2>
            <p>
              Colin King<br />
              Rostockerstraße 38<br />
              10553 Berlin
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Verbraucherstreitbeilegung</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
              forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
