import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

// Öffentliche Kündigungserklärung nach § 312k BGB –
// muss OHNE Login erreichbar sein. Die Anfrage wird gespeichert
// und manuell bearbeitet (Abgleich per E-Mail-Adresse).
export async function POST(req: NextRequest) {
  try {
    const { email, name, nachricht } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ fehler: "Bitte geben Sie Ihre Emailadresse ein" }, { status: 400 })
    }

    const eingegangen = Date.now()
    const doc = await adminDb.collection("kuendigungsanfragen").add({
      email: String(email).trim().toLowerCase(),
      name: name ? String(name).trim() : "",
      nachricht: nachricht ? String(nachricht).trim() : "",
      eingegangen,
      status: "offen",
    })

    return NextResponse.json({ ok: true, referenz: doc.id, eingegangen })
  } catch (err) {
    console.error("Bei Ihrer Kündigungsanfrage ist ein Fehler aufgetreten, bitte versuchen Sie es später erneut oder kontaktieren Sie uns hier über unser Kontaktformular:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
