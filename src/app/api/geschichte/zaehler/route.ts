import { NextRequest, NextResponse } from "next/server"
import { holeKontingent } from "@/lib/kontingent"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

// Liefert das Geschichten-Kontingent eines Kindes
// für den laufenden Abrechnungszeitraum
export async function GET(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  const profilId = req.nextUrl.searchParams.get("profilId")
  if (!profilId) {
    return NextResponse.json({ fehler: "profilId fehlt" }, { status: 400 })
  }

  try {
    const kontingent = await holeKontingent(uid, profilId)
    return NextResponse.json(kontingent)
  } catch (err) {
    console.error("Zähler Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
