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

export function ladeProfile(): Profil[] {
  if (typeof window === "undefined") return []
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    return roh ? JSON.parse(roh) : []
  } catch {
    return []
  }
}

export function speichereProfil(p: Omit<Profil, "id">): string {
  if (typeof window === "undefined") return ""
  const alle = ladeProfile()
  const neu: Profil = { ...p, id: crypto.randomUUID() }
  localStorage.setItem(SCHLUESSEL, JSON.stringify([...alle, neu]))
  return neu.id
}

export function loescheProfil(id: string) {
  if (typeof window === "undefined") return
  const alle = ladeProfile().filter((p) => p.id !== id)
  localStorage.setItem(SCHLUESSEL, JSON.stringify(alle))
}
