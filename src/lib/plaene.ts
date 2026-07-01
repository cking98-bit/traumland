export type PlanInfo = {
  basisPreis: number   // Grundpreis (1 Kind inklusive)
  proKind: number      // Aufpreis je weiteres Kind
  periode: "Monat" | "Jahr"
}

export const PLAN_INFO: Record<string, PlanInfo> = {
  light:        { basisPreis: 10.99, proKind: 6.99,  periode: "Monat" },
  familie:      { basisPreis: 13.99, proKind: 8.99,  periode: "Monat" },
  "familie-jahr": { basisPreis: 129.99, proKind: 79.99, periode: "Jahr"  },
}

export function berechnePreis(plan: string, kinder: number): number {
  const info = PLAN_INFO[plan]
  if (!info) return 0
  return info.basisPreis + Math.max(0, kinder - 1) * info.proKind
}
