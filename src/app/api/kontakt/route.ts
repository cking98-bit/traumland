import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { sendeMail } from "@/lib/mail"

export const runtime = "nodejs"

const SUPPORT_EMAIL = process.env.ADMIN_EMAIL ?? "support@nachtfunke.de"

export async function POST(req: NextRequest) {
  try {
    const { name, email, betreff, nachricht } = await req.json()
    if (!email?.trim() || !nachricht?.trim()) {
      return NextResponse.json({ fehler: "E-Mail und Nachricht sind erforderlich." }, { status: 400 })
    }

    const sName = name ? String(name).trim() : ""
    const sEmail = String(email).trim().toLowerCase()
    const sBetreff = betreff ? String(betreff).trim() : "Kontaktanfrage"
    const sNachricht = String(nachricht).trim()

    const eingegangen = Date.now()
    const doc = await adminDb.collection("kontaktanfragen").add({
      name: sName,
      email: sEmail,
      betreff: sBetreff,
      nachricht: sNachricht,
      eingegangen,
      status: "offen",
    })

    try {
      await sendeMail(
        SUPPORT_EMAIL,
        `Kontaktanfrage: ${sBetreff}`,
        `Neue Kontaktanfrage über nachtfunke.de

Von:      ${sName || "–"} <${sEmail}>
Betreff:  ${sBetreff}
Referenz: ${doc.id}

Nachricht:
${sNachricht}`
      )

      await sendeMail(
        sEmail,
        `Deine Nachricht an Nachtfunke: ${sBetreff}`,
        `Hallo${sName ? " " + sName : ""},

vielen Dank für deine Nachricht! Wir haben sie erhalten und melden uns so schnell wie möglich bei dir.

Deine Nachricht:
${sNachricht}

Referenz: ${doc.id}`
      )
    } catch (mailErr) {
      console.error("Kontakt-Mail konnte nicht versendet werden:", mailErr)
    }

    return NextResponse.json({ ok: true, referenz: doc.id, eingegangen })
  } catch (err) {
    console.error("Kontaktanfrage fehlgeschlagen:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
