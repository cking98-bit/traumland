import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Ein Kinder-Profil
export type Profil = {
  id: string
  name: string
  geburtsdatum: string // ISO-Format: "JJJJ-MM-TT"
}

const SCHLUESSEL = "traumland_profile"

// Alter aus dem Geburtsdatum berechnen (immer aktuell)
export function berechneAlter(geburtsdatum: string): number {
  const geb = new Date(geburtsdatum)
  if (isNaN(geb.getTime())) return 0
  const heute = new Date()
  let alter = heute.getFullYear() - geb.getFullYear()
  const monatsDiff = heute.getMonth() - geb.getMonth()
  // Geburtstag dieses Jahr noch nicht erreicht? → 1 Jahr abziehen
  if (monatsDiff < 0 || (monatsDiff === 0 && heute.getDate() < geb.getDate())) {
    alter--
  }
  return Math.max(0, alter)
}

// Lokale Profile (altes Format) – nur noch für die einmalige Migration
function ladeLokaleProfile(): Profil[] {
  if (typeof window === "undefined") return []
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    return roh ? JSON.parse(roh) : []
  } catch {
    return []
  }
}

// Profile aus Firestore laden – hängen am Nutzer-Account,
// damit sie auf allen Geräten gleich sind
export async function ladeProfile(uid: string): Promise<Profil[]> {
  if (!db) return ladeLokaleProfile()
  try {
    const snap = await getDoc(doc(db, "users", uid))
    const profile = snap.data()?.profile as Profil[] | undefined

    if (profile && profile.length > 0) return profile

    // Migration: Profile aus localStorage einmalig in den Account übernehmen
    const lokal = ladeLokaleProfile()
    if (lokal.length > 0) {
      await setDoc(doc(db, "users", uid), { profile: lokal }, { merge: true })
      return lokal
    }

    return []
  } catch (e) {
    console.error("Profile laden fehlgeschlagen:", e)
    return ladeLokaleProfile()
  }
}

export async function speichereProfil(
  uid: string,
  p: Omit<Profil, "id">
): Promise<{ id: string; profile: Profil[] }> {
  const alle = await ladeProfile(uid)
  const neu: Profil = { ...p, id: crypto.randomUUID() }
  const neueListe = [...alle, neu]
  if (db) {
    await setDoc(doc(db, "users", uid), { profile: neueListe }, { merge: true })
  }
  return { id: neu.id, profile: neueListe }
}

export async function loescheProfil(uid: string, id: string): Promise<Profil[]> {
  const alle = await ladeProfile(uid)
  const neueListe = alle.filter((p) => p.id !== id)
  if (db) {
    await setDoc(doc(db, "users", uid), { profile: neueListe }, { merge: true })
  }
  return neueListe
}
