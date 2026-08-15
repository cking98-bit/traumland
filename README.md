# Nachtfunke

Personalisierte KI-Gute-Nacht-Geschichten für Kinder — [nachtfunke.de](https://nachtfunke.de)

Eltern legen pro Kind ein Profil an (Name, Geburtsdatum, Interessen), wählen
Thema, Stil und Länge; die KI schreibt daraufhin eine Geschichte und liest sie
auf Wunsch vor.

> **Der Ordner heißt `traumland`, das Produkt heißt Nachtfunke.**
> Projektordner und Firebase-Projekt tragen noch den alten Namen. Eine
> Umbenennung würde Datenbank, Deployment und Schlüssel gleichzeitig betreffen
> und ist bewusst unterblieben.

## Dokumentation

| Wofür | Wo |
| --- | --- |
| Wo ändere ich was, wie hängt alles zusammen | [`docs/handbuch.md`](docs/handbuch.md) |
| Regeln beim Programmieren | [`CLAUDE.md`](CLAUDE.md) |

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/app/` | Seiten — ein Ordner je Adresse (`src/app/preise/` → `/preise`) |
| `src/app/api/` | Serverlogik: KI-Anfragen, Zahlungen, E-Mails |
| `src/components/` | Wiederverwendbare Bausteine (Menü, Fußzeile, Login-Schutz) |
| `src/lib/` | Logik ohne Oberfläche: Preise, Kontingente, Texte, Anbindungen |

## Technik

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS ·
Firebase Auth + Firestore · Stripe · Google Gemini · Nodemailer (IONOS) ·
gehostet auf Vercel

## Lokal starten

```bash
npm install
npm run dev
```

Läuft auf http://localhost:3000. Dafür wird eine `.env.local` mit den unten
genannten Variablen benötigt — ohne sie starten Login, Zahlung und
Geschichtenerzeugung nicht.

**Vor jedem Push:**

```bash
npm run build
```

Manche Fehler treten ausschließlich im Production-Build auf. Schlägt er fehl,
scheitert auch das Deployment — die Änderung geht dann nicht live.

## Umgebungsvariablen

Lokal in `.env.local`, live bei Vercel unter Settings → Environment Variables.
Niemals in Git einchecken.

| Variable | Zweck |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` (6) | Login im Browser — dürfen öffentlich sein |
| `FIREBASE_ADMIN_PROJECT_ID` | Serverzugriff auf Firestore |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Serverzugriff auf Firestore |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Serverzugriff auf Firestore — streng geheim |
| `STRIPE_SECRET_KEY` | Zahlungen — wer ihn hat, kann Geld bewegen |
| `STRIPE_WEBHOOK_SECRET` | Prüft die Echtheit der Stripe-Rückmeldungen |
| `GEMINI_API_KEY` | Geschichten und Vorlesen — verursacht direkt Kosten |
| `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASSWORD` | Postfach bei IONOS |
| `ADMIN_EMAIL` | Einzige Adresse mit Zugriff auf `/admin` |
| `NEXT_PUBLIC_BASE_URL` | Basisadresse für Links in E-Mails und Checkout |
| `STEUERNUMMER` | Optional — erscheint auf Rechnungen, sobald gesetzt |

## Veröffentlichen

Jeder Push auf `main` löst bei Vercel automatisch ein Deployment aus. Ältere
Stände lassen sich im Vercel-Dashboard per Klick zurückholen — im Störfall der
schnellste Weg.

## Tarife

| Tarif | Preis | Umfang |
| --- | --- | --- |
| Schnupper-Paket | 4,99 € einmalig | 10 Geschichten, je max. 5 Minuten, kein Abo |
| Nachtfunke | 13,99 € / Monat (+ 8,99 € je weiterem Kind) | Geschichten = Tage im Abrechnungszeitraum, frei einteilbar |
| Nachtfunke Jahr | 129,99 € / Jahr (+ 79,99 € je weiterem Kind) | wie oben, Kontingent monatsweise |

Preise werden an vier Stellen gepflegt — siehe [`CLAUDE.md`](CLAUDE.md), Regel 1.

## Rechtliches

Kleinunternehmer nach § 19 UStG: Es wird keine Umsatzsteuer berechnet oder
ausgewiesen. Der entsprechende Hinweis muss auf jeder Rechnung stehen.
