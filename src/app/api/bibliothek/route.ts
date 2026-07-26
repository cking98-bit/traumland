import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { verifiziereNutzer } from "@/lib/serverAuth"

export const runtime = "nodejs"

const MAX_GESCHICHTEN = 10

function sammlung(uid: string) {
  return adminDb.collection("users").doc(uid).collection("bibliothek")
}

// GET             → alle Geschichten (neueste zuerst)
// GET ?anzahl=1   → nur die Anzahl
export async function GET(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  try {
    if (req.nextUrl.searchParams.get("anzahl")) {
      const snap = await sammlung(uid).select().get()
      return NextResponse.json({ anzahl: snap.size, max: MAX_GESCHICHTEN })
    }

    const snap = await sammlung(uid).orderBy("datum", "desc").get()
    const geschichten = snap.docs.map((d) => d.data())
    return NextResponse.json({ geschichten })
  } catch (err) {
    console.error("Bibliothek GET Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}

// POST { geschichte } → speichert (max. 10), gibt { id } zurück
export async function POST(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  try {
    const { geschichte } = await req.json()
    if (!geschichte?.geschichte) {
      return NextResponse.json({ fehler: "Angaben unvollständig" }, { status: 400 })
    }

    const vorhandene = await sammlung(uid).select().get()
    if (vorhandene.size >= MAX_GESCHICHTEN) {
      return NextResponse.json({ fehler: "voll" }, { status: 409 })
    }

    const id: string = geschichte.id ?? crypto.randomUUID()
    const datum: number = geschichte.datum ?? Date.now()

    await sammlung(uid).doc(id).set({ ...geschichte, id, datum })
    return NextResponse.json({ id })
  } catch (err) {
    console.error("Bibliothek POST Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}

// DELETE ?id=... → Geschichte löschen
export async function DELETE(req: NextRequest) {
  const uid = await verifiziereNutzer(req)
  if (!uid) return NextResponse.json({ fehler: "Nicht angemeldet" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ fehler: "id fehlt" }, { status: 400 })

  try {
    await sammlung(uid).doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Bibliothek DELETE Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
