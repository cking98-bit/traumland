import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

const MAX_GESCHICHTEN = 5

function sammlung(uid: string) {
  return adminDb.collection("users").doc(uid).collection("bibliothek")
}

// GET ?uid=...            → alle Geschichten (neueste zuerst)
// GET ?uid=...&anzahl=1   → nur die Anzahl
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")
  if (!uid) return NextResponse.json({ fehler: "uid fehlt" }, { status: 400 })

  try {
    if (req.nextUrl.searchParams.get("anzahl")) {
      const snap = await sammlung(uid).select().get()
      return NextResponse.json({ anzahl: snap.size })
    }

    const snap = await sammlung(uid).orderBy("datum", "desc").get()
    const geschichten = snap.docs.map((d) => d.data())
    return NextResponse.json({ geschichten })
  } catch (err) {
    console.error("Bibliothek GET Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}

// POST { uid, geschichte } → speichert (max. 5), gibt { id } zurück
export async function POST(req: NextRequest) {
  try {
    const { uid, geschichte } = await req.json()
    if (!uid || !geschichte?.geschichte) {
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

// PATCH { uid, id, bild } → Bild nachträglich speichern
export async function PATCH(req: NextRequest) {
  try {
    const { uid, id, bild } = await req.json()
    if (!uid || !id || !bild) {
      return NextResponse.json({ fehler: "Angaben unvollständig" }, { status: 400 })
    }
    await sammlung(uid).doc(id).set({ bild }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Bibliothek PATCH Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}

// DELETE ?uid=...&id=... → Geschichte löschen
export async function DELETE(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")
  const id = req.nextUrl.searchParams.get("id")
  if (!uid || !id) {
    return NextResponse.json({ fehler: "uid oder id fehlt" }, { status: 400 })
  }
  try {
    await sammlung(uid).doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Bibliothek DELETE Fehler:", err)
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500 })
  }
}
