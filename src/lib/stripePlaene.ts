// Server-seitige Plan-Daten inkl. Stripe-Produkt-IDs
// (Client-Preise: src/lib/plaene.ts)
export const STRIPE_PLAENE = {
  light: {
    productId: "prod_Uo6s0QhTdjIXI7",
    basisPreis: 10.99,
    proKind: 6.99,
    interval: "month" as const,
    name: "Dreamland Light",
  },
  familie: {
    productId: "prod_Uo6sRk71y68Xyz",
    basisPreis: 13.99,
    proKind: 8.99,
    interval: "month" as const,
    name: "Dreamland Familie",
  },
  "familie-jahr": {
    productId: "prod_Uo6sFeRclIj2oJ",
    basisPreis: 129.99,
    proKind: 79.99,
    interval: "year" as const,
    name: "Dreamland Familie Jahresabo",
  },
}

export type StripePlanId = keyof typeof STRIPE_PLAENE

export function planBetragCents(plan: StripePlanId, kinder: number): number {
  const info = STRIPE_PLAENE[plan]
  const betrag = info.basisPreis + Math.max(0, kinder - 1) * info.proKind
  return Math.round(betrag * 100)
}
