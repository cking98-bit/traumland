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

// Einheitliche Signatur unter allen ausgehenden Mails.
// Bewusst ohne Anschrift – die Pflichtangaben stehen im Impressum auf
// nachtfunke.de und (fuer Rechnungen) in der Stripe-Rechnungsfusszeile.
export const SIGNATUR = `

--
🌙 Nachtfunke
KI-Gute-Nacht-Geschichten für dein Kind

nachtfunke.de · support@nachtfunke.de`

export async function sendeMail(an: string, betreff: string, text: string) {
  await transporter.sendMail({
    from: `"Nachtfunke" <${process.env.SMTP_USER}>`,
    to: an,
    subject: betreff,
    text: text + SIGNATUR,
  })
}
