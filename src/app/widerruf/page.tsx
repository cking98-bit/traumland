import Link from "next/link"

export default function WiderrufPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-indigo-400 hover:text-white text-sm transition">
          ← Zurück
        </Link>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Widerrufsbelehrung</h1>

        <div className="text-indigo-200 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-lg mb-2">Widerrufsrecht</h2>
            <p>
              Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
              Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag
              des Vertragsschlusses.
            </p>
            <p className="mt-2">
              Um dein Widerrufsrecht auszuüben, musst du uns (Colin King, Rostockerstraße 38,
              10553 Berlin, E-Mail:{" "}
              <a href="mailto:colin.kinginfo@gmail.com" className="text-yellow-400 hover:text-yellow-300">
                colin.kinginfo@gmail.com
              </a>
              ) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über deinen Entschluss,
              diesen Vertrag zu widerrufen, informieren. Du kannst dafür das beigefügte
              Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
            </p>
            <p className="mt-2">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die
              Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Folgen des Widerrufs</h2>
            <p>
              Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von
              dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem
              Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses Vertrags
              bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
              Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast.
            </p>
            <p className="mt-2">
              Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen
              soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der
              bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts
              unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum
              Gesamtumfang der vorgesehenen Dienstleistungen entspricht.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-2">Muster-Widerrufsformular</h2>
            <div className="bg-indigo-800/60 border border-indigo-700 rounded-xl p-5 font-mono text-xs leading-relaxed">
              <p>
                An: Colin King, Rostockerstraße 38, 10553 Berlin<br />
                E-Mail: colin.kinginfo@gmail.com<br />
                <br />
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
                über die Erbringung der folgenden Dienstleistung: Dreamland-Abonnement<br />
                <br />
                Bestellt am (*): ______________<br />
                Name des/der Verbraucher(s): ______________<br />
                Anschrift des/der Verbraucher(s): ______________<br />
                E-Mail-Adresse des Kontos: ______________<br />
                <br />
                Datum, Unterschrift (nur bei Mitteilung auf Papier)<br />
                <br />
                (*) Unzutreffendes streichen
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
