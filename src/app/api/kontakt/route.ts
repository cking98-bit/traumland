import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import nodemailer from "nodemailer"

export const runtime = "nodejs"

const SUPPORT_EMAIL = process.env.ADMIN_EMAIL ?? "support@nachtfunke.de"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.ionos.de",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function sendeKontaktMail(an: string, betreff: string, text: string) {
  await transporter.sendMail({
    from: `"Nachtfunke" <${process.env.SMTP_USER}>`,
    to: an,
    subject: betreff,
    text,
  })
}

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
      await sendeKontaktMail(
        SUPPORT_EMAIL,
        `Kontaktanfrage: ${sBetreff}`,
        `Neue Kontaktanfrage über nachtfunke.de\n\nVon: ${sName || "–"} <${sEmail}>\nBetreff: ${sBetreff}\nReferenz: ${doc.id}\n\nNachricht:\n${sNachricht}`
      )

      await sendeKontaktMail(
        sEmail,
        `Deine Nachricht an Nachtfunke: ${sBetreff}`,
        `Hallo${sName ? " " + sName : ""},\n\nvielen Dank für deine Nachricht! Wir haben sie erhalten und melden uns so schnell wie möglich bei dir.\n\nDeine Nachricht:\n${sNachricht}\n\nReferenz: ${doc.id}`
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
