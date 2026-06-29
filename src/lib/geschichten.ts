// Eine gespeicherte Geschichte
export type Geschichte = {
    id: string
    name: string
    alter: string
    stichwörter: string
    stil: string
    dauer: string
    geschichte: string
    datum: number // Zeitstempel
  }
  
  const SCHLÜSSEL = "traumland_geschichten"
  
  // Alle Geschichten laden
  export function ladeGeschichten(): Geschichte[] {
    if (typeof window === "undefined") return [] // Schutz fürs Server-Rendering
    try {
      const roh = localStorage.getItem(SCHLÜSSEL)
      return roh ? JSON.parse(roh) : []
    } catch {
      return []
    }
  }
  
  // Eine neue Geschichte speichern (kommt ganz oben in die Liste)
  export function speichereGeschichte(g: Omit<Geschichte, "id" | "datum">) {
    if (typeof window === "undefined") return
    const alle = ladeGeschichten()
    const neue: Geschichte = {
      ...g,
      id: crypto.randomUUID(),
      datum: Date.now(),
    }
    localStorage.setItem(SCHLÜSSEL, JSON.stringify([neue, ...alle]))
  }
  
  // Eine Geschichte löschen
  export function löscheGeschichte(id: string) {
    if (typeof window === "undefined") return
    const alle = ladeGeschichten().filter((g) => g.id !== id)
    localStorage.setItem(SCHLÜSSEL, JSON.stringify(alle))
  }