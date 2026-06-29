export type Geschichte = {
  id: string
  name: string
  alter: string
  stichwörter: string
  stil: string
  dauer: string
  geschichte: string
  bild?: string
  datum: number
}

const SCHLÜSSEL = "traumland_geschichten"
export const MAX_GESCHICHTEN = 5

export function ladeGeschichten(): Geschichte[] {
  if (typeof window === "undefined") return []
  try {
    const roh = localStorage.getItem(SCHLÜSSEL)
    return roh ? JSON.parse(roh) : []
  } catch {
    return []
  }
}

export function istVoll(): boolean {
  return ladeGeschichten().length >= MAX_GESCHICHTEN
}

export function ladeGeschichteById(id: string): Geschichte | null {
  return ladeGeschichten().find((g) => g.id === id) || null
}

export function speichereGeschichte(
  g: Omit<Geschichte, "id" | "datum">
): string | null {
  if (typeof window === "undefined") return null
  if (istVoll()) return null // Kein Speichern wenn voll
  const alle = ladeGeschichten()
  const neue: Geschichte = {
    ...g,
    id: crypto.randomUUID(),
    datum: Date.now(),
  }
  localStorage.setItem(SCHLÜSSEL, JSON.stringify([neue, ...alle]))
  return neue.id
}

export function speichereBild(id: string, bild: string) {
  if (typeof window === "undefined") return
  const alle = ladeGeschichten().map((g) =>
    g.id === id ? { ...g, bild } : g
  )
  localStorage.setItem(SCHLÜSSEL, JSON.stringify(alle))
}

export function löscheGeschichte(id: string) {
  if (typeof window === "undefined") return
  const alle = ladeGeschichten().filter((g) => g.id !== id)
  localStorage.setItem(SCHLÜSSEL, JSON.stringify(alle))
}