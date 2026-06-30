// Abo-Status – VORERST SIMULIERT (wird später durch echtes Stripe-Abo ersetzt)
export type Abo = {
  plan: string // Plan-ID, z.B. "familie"
  kinder: number // Anzahl Kinder, die der Vertrag abdeckt
}

const SCHLUESSEL = "traumland_abo"

export function ladeAbo(): Abo | null {
  if (typeof window === "undefined") return null
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    return roh ? JSON.parse(roh) : null
  } catch {
    return null
  }
}

export function hatAbo(): boolean {
  return ladeAbo() !== null
}

export function setzeAbo(plan: string, kinder: number) {
  if (typeof window === "undefined") return
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ plan, kinder }))
}

// Ein weiteres Kind zum laufenden Vertrag hinzufügen (erhöht das Limit)
export function erhoeheKinder(anzahl = 1) {
  const abo = ladeAbo()
  if (!abo) return
  setzeAbo(abo.plan, abo.kinder + anzahl)
}

export function kuendigeAbo() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SCHLUESSEL)
}
