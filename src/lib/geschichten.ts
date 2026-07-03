import { authFetch } from "@/lib/apiClient"

export type Geschichte = {
  id: string
  name: string
  alter: string
  stichwörter: string
  stil: string
  dauer: string
  geschichte: string
  titel?: string
  bild?: string
  sprache?: string // Sprache der Geschichte: "de" | "en"
  datum: number
}

export const MAX_GESCHICHTEN = 10

const SCHLUESSEL = "traumland_geschichten"

// Lokale Geschichten (altes Format) – nur noch für die einmalige Migration
function ladeLokaleGeschichten(): Geschichte[] {
  if (typeof window === "undefined") return []
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    return roh ? JSON.parse(roh) : []
  } catch {
    return []
  }
}

// Bild verkleinern, damit es in ein Firestore-Dokument passt (< 1 MB)
export function komprimiereBild(
  dataUrl: string,
  maxBreite = 800,
  qualitaet = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const skala = Math.min(1, maxBreite / img.width)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * skala)
      canvas.height = Math.round(img.height * skala)
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", qualitaet))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// Geschichten aus Firestore laden – hängen am Nutzer-Account,
// damit die Bibliothek auf allen Geräten gleich ist
export async function ladeGeschichten(uid: string): Promise<Geschichte[]> {
  try {
    const res = await authFetch(`/api/bibliothek?uid=${uid}`)
    const data = await res.json()
    if (data.fehler) throw new Error(data.fehler)
    let liste: Geschichte[] = data.geschichten ?? []

    // Migration: lokale Geschichten einmalig in den Account übernehmen
    if (liste.length === 0) {
      const lokal = ladeLokaleGeschichten()
      if (lokal.length > 0) {
        for (const g of lokal.slice(0, MAX_GESCHICHTEN)) {
          const kopie = { ...g }
          if (kopie.bild) kopie.bild = await komprimiereBild(kopie.bild)
          await authFetch("/api/bibliothek", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, geschichte: kopie }),
          })
        }
        localStorage.removeItem(SCHLUESSEL)
        const res2 = await authFetch(`/api/bibliothek?uid=${uid}`)
        const data2 = await res2.json()
        liste = data2.geschichten ?? []
      }
    }

    return liste
  } catch {
    return ladeLokaleGeschichten()
  }
}

export async function zaehleGeschichten(uid: string): Promise<number> {
  try {
    const res = await authFetch(`/api/bibliothek?uid=${uid}&anzahl=1`)
    const data = await res.json()
    return data.anzahl ?? 0
  } catch {
    return ladeLokaleGeschichten().length
  }
}

export async function ladeGeschichteById(
  uid: string,
  id: string
): Promise<Geschichte | null> {
  const alle = await ladeGeschichten(uid)
  return alle.find((g) => g.id === id) ?? null
}

export async function speichereGeschichte(
  uid: string,
  g: Omit<Geschichte, "id" | "datum">
): Promise<string | null> {
  try {
    const res = await authFetch("/api/bibliothek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, geschichte: g }),
    })
    const data = await res.json()
    return data.id ?? null
  } catch {
    return null
  }
}

export async function speichereBild(uid: string, id: string, bild: string) {
  try {
    const klein = await komprimiereBild(bild)
    await authFetch("/api/bibliothek", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, id, bild: klein }),
    })
  } catch {
    // Bild ist optional – Fehler still ignorieren
  }
}

export async function löscheGeschichte(uid: string, id: string) {
  try {
    await authFetch(`/api/bibliothek?uid=${uid}&id=${id}`, { method: "DELETE" })
  } catch {
    // ignorieren
  }
}
