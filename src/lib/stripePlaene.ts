// Server-seitige Plan-Daten inkl. Stripe-Produkt-IDs
// (Client-Preise: src/lib/plaene.ts)
export const STRIPE_PLAENE = {
  familie: {
    productId: "prod_V3n6ZpYxD9Ql6O",
    basisPreis: 13.99,
    proKind: 8.99,
    interval: "month" as const,
    name: "Nachtfunke",
  },
  "familie-jahr": {
    productId: "prod_V3n68bZ90bnzFm",
    basisPreis: 129.99,
    proKind: 79.99,
    interval: "year" as const,
    name: "Nachtfunke Jahr",
  },
}

export type StripePlanId = keyof typeof STRIPE_PLAENE

export function planBetragCents(plan: StripePlanId, kinder: number): number {
  const info = STRIPE_PLAENE[plan]
  const betrag = info.basisPreis + Math.max(0, kinder - 1) * info.proKind
  return Math.round(betrag * 100)
}

// Einmalkauf ohne Abo: fester Vorrat an Geschichten, kein Abrechnungszeitraum
export const SCHNUPPER_PAKET = {
  productId: "prod_V3oLTqaRE4K3DU",
  preis: 4.99,
  geschichten: 10,
  name: "Nachtfunke Schnupper-Paket",
}

export function schnupperPreisCents(): number {
  return Math.round(SCHNUPPER_PAKET.preis * 100)
}
