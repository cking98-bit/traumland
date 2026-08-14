import nodemailer from "nodemailer"

// Versand über das IONOS-Postfach support@nachtfunke.de (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.ionos.de",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false, // STARTTLS auf Port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Einheitliche Signatur unter allen ausgehenden Mails
export const SIGNATUR = `

--
🌙 Nachtfunke
KI-Gute-Nacht-Geschichten für dein Kind

nachtfunke.de · support@nachtfunke.de

Colin King · Rostockerstraße 38 · 10553 Berlin`

export async function sendeMail(an: string, betreff: string, text: string) {
  await transporter.sendMail({
    from: `"Nachtfunke" <${process.env.SMTP_USER}>`,
    to: an,
    subject: betreff,
    text: text + SIGNATUR,
  })
}
