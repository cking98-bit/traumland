// Zentrale Preis-Infos pro Plan (für Add-on "weiteres Kind" usw.)
export type PlanInfo = {
  proKind: number // Aufpreis je weiteres Kind
  periode: "Monat" | "Jahr"
}

export const PLAN_INFO: Record<string, PlanInfo> = {
  light: { proKind: 6.99, periode: "Monat" },
  familie: { proKind: 8.99, periode: "Monat" },
  "familie-jahr": { proKind: 79.99, periode: "Jahr" },
}
