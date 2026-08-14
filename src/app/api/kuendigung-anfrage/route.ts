import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { sendeMail } from "@/lib/mail"

export const runtime = "nodejs"

// Öffentliche Kündigungserklärung nach § 312k BGB –
// muss OHNE Login erreichbar sein. Die Anfrage wird gespeichert,
// eine Eingangsbestätigung geht sofort per E-Mail raus (§ 312k Abs. 2 BGB:
// "unverzüglich in Textform"). Die eigentliche Bearbeitung (Stripe-Kündigung
// bei abweichender E-Mail o.ä.) erfolgt weiterhin manuell.
export async function POST(req: NextRequest) {
  try {
    const { email, name, nachricht } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ fehler: "Bitte geben Sie Ihre Emailadresse ein" }, { status: 400 })
    }

    const emailAdresse = String(email).trim().toLowerCase()
    const eingegangen = Date.now()
    const doc = await adminDb.collection("kuendigungsanfragen").add({
      email: emailAdresse,
      name: name ? String(name).trim() : "",
      nachricht: nachricht ? String(nachricht).trim() : "",
      eingegangen,
      status: "offen",
    })

    const eingangsDatum = new Date(eingegangen).toLocaleString("de-DE", {
      dateStyle: "long",
      timeStyle: "short",
    })

    try {
      await sendeMail(
        emailAdresse,
        "Deine Kündigung ist bei uns eingegangen – Nachtfunke",
        `Hallo${name ? " " + name : ""},

wir bestätigen den Eingang deiner Kündigungserklärung für dein Nachtfunke-Abonnement.

Eingegangen am: ${eingangsDatum}
Referenz: ${doc.id}

Deine Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam. Bitte bewahre diese E-Mail als Nachweis auf.

Falls du Fragen hast, antworte einfach auf diese E-Mail oder schreibe uns an support@nachtfunke.de.

Viele Grüße
Dein Nachtfunke-Team`
      )
    } catch (mailErr) {
      // Kündigung bleibt gültig (Eingang ist in Firestore dokumentiert),
      // auch wenn der Mailversand fehlschlägt – deshalb kein Request-Abbruch.
      console.error("Kündigungsbestätigung konnte nicht versendet werden:", mailErr)
    }

    return NextResponse.json({ ok: true, referenz: doc.id, eingegangen })
  } catch (err) {
    console.error("Bei Ihrer Kündigungsanfrage ist ein Fehler aufgetreten, bitte versuchen Sie es später erneut oder kontaktieren Sie uns hier über unser Kontaktformular:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
