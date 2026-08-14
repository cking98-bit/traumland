import { NextRequest, NextResponse } from "next/server"
import { sendeMail } from "@/lib/mail"
import { findeNutzer, erzeugeResetLink } from "@/lib/identityToolkit"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) return NextResponse.json({ ok: true })

    const sEmail = String(email).trim().toLowerCase()

    // Unbekannte Adressen bewusst wie Erfolg behandeln – sonst liesse sich
    // ueber die Antwort herausfinden, welche Adressen ein Konto haben.
    const nutzer = await findeNutzer(sEmail)
    if (!nutzer) return NextResponse.json({ ok: true })

    const link = await erzeugeResetLink(sEmail)
    const name = nutzer.displayName.trim()

    await sendeMail(
      sEmail,
      "Passwort zurücksetzen – Nachtfunke",
      `Hallo${name ? " " + name : ""},

du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.

Klicke auf den folgenden Link, um ein neues Passwort zu vergeben:

${link}

Der Link ist aus Sicherheitsgründen nur begrenzt gültig.

Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Passwort-Reset fehlgeschlagen:", err)
    return NextResponse.json({ ok: true })
  }
}
