import { NextRequest, NextResponse } from "next/server"
import { holeKontingent } from "@/lib/kontingent"

export const runtime = "nodejs"

// Liefert das Geschichten-Kontingent eines Kindes
// für den laufenden Abrechnungszeitraum
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")
  const profilId = req.nextUrl.searchParams.get("profilId")
  if (!uid || !profilId) {
    return NextResponse.json({ fehler: "uid oder profilId fehlt" }, { status: 400 })
  }

  try {
    const kontingent = await holeKontingent(uid, profilId)
    return NextResponse.json(kontingent)
  } catch (err) {
    console.error("Zähler Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
