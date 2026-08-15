# Nachtfunke — Handbuch

Wo liegt was, warum ist es so gebaut, und was darf beim Ändern nicht übersehen
werden. Geschrieben für Menschen, die nicht täglich programmieren.

Es gibt dieselbe Doku als lesbarere Web-Fassung mit Suchfunktion. Diese Datei
hier ist die verbindliche Quelle: Sie liegt in Git und veraltet nicht unbemerkt.

Stand: 15.08.2026 — 61 Dateien, ~8.400 Zeilen, 17 Seiten, 18 API-Routen.

---

## 1. Das Produkt

Nachtfunke schreibt personalisierte Gute-Nacht-Geschichten. Eltern legen pro
Kind ein Profil an (Name, Geburtsdatum, Interessen), wählen Thema, Stil und
Länge — die KI schreibt daraufhin eine Geschichte und liest sie auf Wunsch vor.

| Tarif | Preis | Umfang |
| --- | --- | --- |
| Schnupper-Paket | 4,99 € einmalig | 10 Geschichten, je **höchstens 5 Minuten**, kein Abo |
| Nachtfunke | 13,99 €/Monat (+ 8,99 € je weiterem Kind) | So viele Geschichten wie der Abrechnungszeitraum Tage hat, **frei einteilbar**, alle Längen bis 10 Minuten |
| Nachtfunke Jahr | 129,99 €/Jahr (+ 79,99 € je weiterem Kind) | Gleicher Umfang, Kontingent wird **monatsweise** vergeben |

> **Häufiges Missverständnis:** „30 Geschichten pro Monat" heißt nicht „eine pro
> Abend, sonst verfällt sie". Das Kontingent entspricht der Anzahl Tage im
> Abrechnungszeitraum und ist frei über den Monat verteilbar.
> Nachzulesen in `src/lib/kontingent.ts`.

**Rechtlicher Rahmen**

- Kleinunternehmer nach § 19 UStG — keine Umsatzsteuer, Hinweis auf jeder Rechnung
- Ausdrückliche Zustimmung zum sofortigen Start vor dem Kauf (§ 356 Abs. 4 BGB)
- Kündigungsbutton und Bestätigungsmail (§ 312k BGB)

---

## 2. Wie eine Geschichte entsteht

1. **Formular** — Profil, Thema, Stil, Länge → `src/app/generator/page.tsx`
2. **Anfrage mit Ausweis** — `authFetch` hängt das Firebase-Token an → `src/lib/apiClient.ts`
3. **Prüfung** — Token echt? Kontingent oder Guthaben da? → `src/app/api/geschichte/route.ts`
4. **Prompt bauen** — deutsch oder englisch, gerechnet mit **130 Wörtern pro Minute**
5. **Gemini schreibt** — drei Modelle nacheinander als Reserve → `src/lib/geminiFallback.ts`
6. **Abrechnen** — Zähler hoch bzw. Guthaben runter, Kosten protokollieren → `src/lib/kostenTracking.ts`

Das Vorlesen läuft getrennt über `src/app/api/vorlesen/route.ts` und fragt alle
Modelle *gleichzeitig* — beim Ton fällt Wartezeit stärker auf als beim Text.

---

## 3. Wo ändere ich was?

| Ich möchte… | Datei | Darauf achten |
| --- | --- | --- |
| Einen Preis ändern | `src/lib/stripePlaene.ts` | **An vier Stellen** — siehe Gefahrenzone 1 |
| Einen sichtbaren Text ändern | `src/lib/i18n.ts` | Immer **DE und EN** |
| Startseite umbauen | `src/app/page.tsx` | Texte kommen aus `i18n.ts` |
| Preisseite umbauen | `src/app/preise/page.tsx` | Preiszahlen stehen hier fest im Code |
| Rechtstexte ändern | `src/app/agb/`, `datenschutz/`, `impressum/`, `widerruf/` | § 19 UStG muss in den AGB bleiben |
| E-Mail-Wortlaut ändern | `api/webhook/`, `api/kontakt/`, `api/passwort-reset/` | Signatur zentral in `src/lib/mail.ts` |
| E-Mail-Signatur ändern | `src/lib/mail.ts` | Gilt nicht fürs Kontaktformular (bewusst ohne) |
| KI-Modell wechseln | `src/app/api/geschichte/route.ts` (Z. 15) | Auch in `kostenTracking.ts` eintragen |
| Geschichtenlänge ändern | `src/app/api/geschichte/route.ts` | 130 Wörter/Minute; länger = teurer |
| Schreibstil der KI ändern | `src/app/api/geschichte/route.ts` (Prompt) | Zwei Sprachfassungen |
| Neue Seite anlegen | neuer Ordner in `src/app/` mit `page.tsx` | Öffentlich? → **`src/proxy.ts`** |
| Menüpunkt ergänzen | `src/components/Navigation.tsx` | Fußzeile separat in `Footer.tsx` |
| Kontingent-Verhalten ändern | `src/lib/kontingent.ts` | Herzstück der Abo-Logik |
| Schnupper-Umfang ändern | `src/lib/stripePlaene.ts` | 5-Minuten-Deckel sitzt in `api/geschichte/route.ts` |
| KI-Kosten sehen | `/admin` im Browser | Nur mit `ADMIN_EMAIL`; Zahlen sind **geschätzt** |
| Umsatz und Verträge sehen | `/admin` im Browser | Kommt live aus Stripe |
| Logo/App-Icon tauschen | `public/`, `public/manifest.json` | Der Mond im Kopf ist ein Emoji, keine Datei |
| Steuernummer auf Rechnungen | Variable `STEUERNUMMER` bei Vercel | Kein Code nötig |
| Absenderadresse ändern | Variablen `SMTP_*` bei Vercel | Postfach bei IONOS |

---

## 4. Gefahrenzonen

### 1 — Preise stehen an vier Stellen

- `src/lib/stripePlaene.ts` — was tatsächlich abgebucht wird
- `src/lib/plaene.ts` — Anzeige unter „Mein Abonnement" und im Profil
- `src/app/preise/page.tsx` — Preisseite
- Stripe-Dashboard — Produktname und Beschreibung

Wird eine vergessen, wirbst du mit einem Preis und buchst einen anderen ab.
Das ist abmahnfähig.

> `src/lib/plaene.ts` enthält außerdem noch den abgeschafften `light`-Tarif.
> Tote Konfiguration — beim nächsten Aufräumen entfernen.

### 2 — Neue öffentliche Seiten müssen freigeschaltet werden

`src/proxy.ts` führt eine Liste aller Seiten, die ohne Login erreichbar sind.
Fehlt eine Seite dort, landet jeder Besucher auf `/login` — und der Fehler wird
in der Seite selbst gesucht, wo er nicht ist. Genau das ist beim
Passwort-Zurücksetzen passiert.

### 3 — Der Stripe-Webhook darf nicht scheitern

`src/app/api/webhook/route.ts` macht aus einer Zahlung einen freigeschalteten
Zugang. Wirft die Route einen Fehler, wiederholt Stripe die Zustellung und der
Kauf wird doppelt gutgeschrieben. Deshalb sind Mailversand und
Rechnungsfußzeile bewusst in `try/catch` gekapselt.

### 4 — `firebase-admin/auth` funktioniert auf Vercel nicht

Das Paket lässt sich dort nicht laden, die Route liefert 500 — und zwar **erst
live**, der lokale Build ist grün. Stattdessen:

- Token prüfen → `src/lib/serverAuth.ts` (jose gegen Googles JWKS)
- Nutzer suchen, Reset-Link erzeugen → `src/lib/identityToolkit.ts` (REST)

`firebase-admin/firestore` ist unproblematisch und wird genutzt.

### 5 — Texte immer zweisprachig pflegen

`src/lib/i18n.ts` enthält jeden Text unter `de` und `en`. Nur eine Seite zu
ergänzen fällt beim Testen nie auf, weil lokal Deutsch aktiv ist.

---

## 5. Der Code im Überblick

| Ordner | Inhalt |
| --- | --- |
| `src/app/` | Seiten — ein Ordner je Adresse (`src/app/preise/` → `/preise`) |
| `src/app/api/` | Serverlogik: KI, Zahlungen, E-Mails. Hier liegen die Geheimnisse |
| `src/components/` | Menü, Fußzeile, Vorlese-Knopf, Login-Schutz |
| `src/lib/` | Preise, Kontingente, Texte, Mailversand, Firebase- und Stripe-Anbindung |

**Bausteine:** Next.js 16 + React (Grundgerüst) · Vercel (Hosting, Deployment
bei jedem Push) · Firebase (Login + Datenbank) · Stripe (Zahlungen) ·
Google Gemini (Texte und Stimme) · IONOS (Domain, Postfach).

---

## 6. Der Geldfluss

1. **Kunde bestätigt den Kauf** inkl. Zustimmung zum sofortigen Start → `src/app/preise/page.tsx`
2. **Weiterleitung zu Stripe** — Abo als `subscription`, Schnupper als `payment`; Rechnungsadresse holt Stripe selbst → `src/app/api/checkout/route.ts`
3. **Stripe meldet zurück** — erst dieser Rückruf schaltet frei und verschickt die Bestätigung → `src/app/api/webhook/route.ts`
4. **Rechnung mit § 19-Hinweis** — Schnupper beim Checkout, Abos nachträglich im Entwurfsstatus
5. **Kunde sieht die Rechnung** — live von Stripe geholt, nicht bei uns gespeichert → `src/app/api/abo/rechnungen/route.ts`

> Wenn jemand bezahlt hat, aber nichts bekommt, ist fast immer der Webhook die
> Ursache. Stripe-Dashboard → Entwickler → Webhooks zeigt fehlgeschlagene
> Zustellungen und erlaubt erneutes Senden.

---

## 7. Wer darf was

Erste zutreffende Regel gewinnt:

| Zustand | Ergebnis |
| --- | --- |
| Abo aktiv, Kontingent übrig | Geschichte wird erstellt, Tageszähler +1 |
| Abo aktiv, Kontingent leer | `429 limit` |
| Kein Abo, Schnupper-Guthaben > 0 | Guthaben −1, Dauer **zwingend 5 Minuten** |
| Weder noch | `403 kein_zugang` → Weiterleitung zur Preisseite |
| Nicht angemeldet | `401` |

Die 5-Minuten-Grenze ist Kostenschutz: Bei 4,99 € einmalig würden zehn
Zehn-Minuten-Geschichten samt Vertonung die Marge auffressen.

`/admin` ist ausschließlich über die Adresse in `ADMIN_EMAIL` erreichbar; alle
anderen werden sofort zur Startseite geschickt.

---

## 8. Wo die Daten liegen

Alles in Firebase Firestore.

| Ort | Inhalt |
| --- | --- |
| `users/{uid}` | `profile[]`, `abo{}`, `schnupper_guthaben`, `stripeCustomerId` |
| `users/{uid}/zaehler/{JJJJ-MM-TT}` | Je Profil-ID die Anzahl erstellter Geschichten |
| `api_nutzung/{JJJJ-MM-TT}` | Token- und Kostensummen, Grundlage für `/admin` |
| `kontaktanfragen` | Eingänge aus dem Kontaktformular |

---

## 9. Schlüssel & Zugänge

19 Umgebungsvariablen, lokal in `.env.local`, live bei Vercel unter
Settings → Environment Variables. **Niemals in Git, niemals in einen Chat.**

Die vollständige Liste steht in der [README](../README.md).

Grob: `NEXT_PUBLIC_FIREBASE_*` (öffentlich, Login im Browser) ·
`FIREBASE_ADMIN_*` (geheim, Serverzugriff) · `STRIPE_*` (Zahlungen) ·
`GEMINI_API_KEY` (verursacht direkt Kosten) · `SMTP_*` (Postfach) ·
`ADMIN_EMAIL`, `NEXT_PUBLIC_BASE_URL`, `STEUERNUMMER`.

> **Offener Punkt:** Der Stripe Secret Key wurde in einem Chatverlauf geteilt
> und gilt bis zur Erneuerung im Stripe-Dashboard als kompromittiert.

---

## 10. Wenn etwas kaputt ist

1. **Ist das Deployment durchgelaufen?** Vercel-Dashboard. Ein fehlgeschlagener
   Build heißt: die Änderung ist nie live gegangen, die alte Fassung läuft weiter.
2. **Baut es lokal?** `npm run build` zeigt denselben Fehler wie Vercel, nur
   sofort und mit Zeilenangabe.
3. **Betrifft es Zahlungen?** Stripe → Entwickler → Webhooks, fehlgeschlagene
   Zustellungen erneut senden.
4. **Zurück auf den letzten guten Stand.** In Vercel lässt sich jedes frühere
   Deployment per Klick zurückholen — schneller und sicherer, als unter Druck
   im Code zu suchen.

**Faustregel:** erst `npm run build`, dann pushen.

---

## 11. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Deployment | Der Vorgang, mit dem eine Änderung live geht — bei jedem Push automatisch |
| Build | Übersetzung vom Code zur fertigen Website. Schlägt er fehl, geht nichts live |
| API-Route | Programmteil, der auf dem Server läuft statt im Browser — nötig, wo Geheimnisse im Spiel sind |
| Webhook | Rückruf von außen. Stripe meldet: „Zahlung ist durch." Erst dann wird freigeschaltet |
| Firestore | Die Datenbank von Firebase |
| Token | Beim Login: digitaler Ausweis. Bei der KI: Abrechnungseinheit, etwa ein halbes Wort |
| Middleware | Türsteher vor allen Seiten — hier `src/proxy.ts` |
| Umgebungsvariable | Geheimnis, das außerhalb des Codes liegt, damit es nicht in Git landet |
| Fallback | Reserve. Fällt ein KI-Modell aus, wird das nächste versucht |
| Prompt | Anweisungstext an die KI — bestimmt Ton, Länge und Inhalt |
