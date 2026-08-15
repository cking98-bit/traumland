@AGENTS.md

# Nachtfunke

KI-Gute-Nacht-Geschichten als Web-App. Next.js 16 (App Router) · TypeScript ·
Tailwind · Firebase (Auth + Firestore) · Stripe · Google Gemini · Vercel.

Der Projektordner und das Firebase-Projekt heissen noch `traumland` – das ist
Absicht, nicht umbenennen. Nach aussen heisst alles Nachtfunke.

Ausfuehrliches Handbuch (auch fuer Nicht-Techniker): `docs/handbuch.md`

## Sprache

Code-Kommentare, UI-Texte, Variablennamen und Commit-Nachrichten auf **Deutsch**.
Kommentare erklaeren das *Warum*, nicht das *Was*.

## Regeln, die Bugs verhindern

Diese Punkte haben in der Vergangenheit bereits Fehler verursacht.

1. **Preise stehen an vier Stellen.** Wer einen Preis aendert, muss alle
   anpassen, sonst weicht der abgebuchte Betrag vom beworbenen ab:
   - `src/lib/stripePlaene.ts` – was Stripe tatsaechlich abbucht
   - `src/lib/plaene.ts` – Anzeige unter „Mein Abonnement" und im Profil
   - `src/app/preise/page.tsx` – Preisseite, Zahlen fest im Code
   - Stripe-Dashboard – Produktname und Beschreibung

2. **`src/lib/i18n.ts` immer zweisprachig pflegen.** Jeder Schluessel existiert
   unter `de` *und* `en`. Nur eine Seite zu ergaenzen faellt beim Testen nicht
   auf, weil lokal Deutsch aktiv ist.

3. **Neue oeffentliche Seiten in `src/proxy.ts` eintragen.** Die Middleware
   leitet alles, was nicht in `öffentlicheSeiten` steht, auf `/login` um.
   Symptom bei Vergessen: Seite ist fertig, aber niemand kommt hin.

4. **Niemals `firebase-admin/auth` importieren.** Das Paket laesst sich auf
   Vercel nicht laden, die Route liefert dann 500 – und zwar erst live, der
   lokale Build ist gruen. Stattdessen:
   - Token pruefen: `src/lib/serverAuth.ts` (jose gegen Googles JWKS)
   - Nutzer suchen / Reset-Link erzeugen: `src/lib/identityToolkit.ts` (REST)
   `firebase-admin/firestore` ist unproblematisch und wird genutzt.

5. **Der Stripe-Webhook darf nicht scheitern.** `src/app/api/webhook/route.ts`
   schaltet Kaeufe frei. Wirft er einen Fehler, wiederholt Stripe die Zustellung
   und der Kauf wird doppelt gutgeschrieben. Alles Nebensaechliche (Mailversand,
   Rechnungsfusszeile) gehoert deshalb in `try/catch`.

6. **Vor jedem Push `npm run build`.** Fehler wie eine fehlende
   Suspense-Boundary treten nur im Production-Build auf. Ein gescheiterter
   Vercel-Build bedeutet: die Aenderung ist nie live gegangen.

## Zugangslogik (`src/app/api/geschichte/route.ts`)

Reihenfolge der Pruefung, erste zutreffende Regel gewinnt:

1. Aktives Abo → `holeKontingent()`; bei 0 verbleibend `429 limit`
2. `schnupper_guthaben > 0` → 1 Guthaben abziehen, Dauer hart auf 5 Minuten
3. sonst → `403 kein_zugang`

Kontingent = Anzahl Tage im Abrechnungszeitraum, **frei einteilbar** (nicht
„eine pro Kalendertag"). Jahresabos bekommen es monatsweise zugeteilt.

## Firestore

- `users/{uid}` – `profile[]`, `abo{}`, `schnupper_guthaben`, `stripeCustomerId`
- `users/{uid}/zaehler/{JJJJ-MM-TT}` – je Profil-ID die Anzahl Geschichten
- `api_nutzung/{JJJJ-MM-TT}` – Token- und Kostensummen fuer `/admin`
- `kontaktanfragen` – Eingaenge aus dem Kontaktformular

## Recht

Kleinunternehmer nach § 19 UStG: **keine** Umsatzsteuer berechnen oder
ausweisen. Der Hinweis gehoert auf jede Rechnung – Schnupper-Paket ueber
`invoice_data.footer` beim Checkout, Abos ueber das Webhook-Ereignis
`invoice.created`, solange die Rechnung Entwurf ist.

Weiter gilt: ausdrueckliche Zustimmung zum sofortigen Vertragsbeginn vor dem
Kauf (§ 356 Abs. 4 BGB) und Kuendigungsbestaetigung per Mail (§ 312k BGB).

## Gemini

Modelle fallen ohne Vorwarnung aus, deshalb nie ein einzelnes ansprechen:
- Text: `mitModellFallback()` – der Reihe nach
- Vorlesen: `mitModellWettlauf()` – parallel, erste Antwort gewinnt

Neue Modelle zusaetzlich in `src/lib/kostenTracking.ts` eintragen, sonst
erscheinen sie im Admin-Dashboard mit 0 € Kosten.
