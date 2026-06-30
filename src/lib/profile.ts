// Ein Kinder-Profil
export type Profil = {
  id: string
  name: string
  alter: string
}

const SCHLUESSEL = "traumland_profile"

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
