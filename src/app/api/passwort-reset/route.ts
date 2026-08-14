import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { sendeMail } from "@/lib/mail"
import "@/lib/firebaseAdmin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ ok: true })
    }

    const sEmail = String(email).trim().toLowerCase()

    let user
    try {
      user = await getAuth().getUserByEmail(sEmail)
    } catch {
      return NextResponse.json({ ok: true })
    }

    const link = await getAuth().generatePasswordResetLink(sEmail, {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
    })

    const vorname = user.displayName?.split(" ")[0] ?? ""

    await sendeMail(
      sEmail,
      "Passwort zurücksetzen – Nachtfunke",
      `Hallo${vorname ? " " + vorname : ""},

du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.

Klicke auf den folgenden Link, um ein neues Passwort zu vergeben:

${link}

Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Passwort-Reset fehlgeschlagen:", err)
    return NextResponse.json({ ok: true })
  }
}
