import { SignJWT, importPKCS8 } from "jose"

// Google Identity Toolkit direkt per REST – aus demselben Grund wie in
// serverAuth.ts: firebase-admin/auth laesst sich auf Vercel nicht laden.
// Das Service-Account-JWT signieren wir mit jose und tauschen es gegen
// ein OAuth-Token.

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  ""

const SCOPE = "https://www.googleapis.com/auth/identitytoolkit"

let cache: { token: string; gueltigBis: number } | null = null

async function zugriffsToken(): Promise<string> {
  if (cache && Date.now() < cache.gueltigBis) return cache.token

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!clientEmail || !privateKey) {
    throw new Error("Service-Account-Zugangsdaten fehlen")
  }

  const key = await importPKCS8(privateKey, "RS256")
  const jetzt = Math.floor(Date.now() / 1000)

  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(jetzt)
    .setExpirationTime(jetzt + 3600)
    .sign(key)

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })

  if (!res.ok) {
    throw new Error(`Token-Abruf fehlgeschlagen: ${res.status} ${await res.text()}`)
  }

  const daten = (await res.json()) as { access_token: string; expires_in: number }
  cache = {
    token: daten.access_token,
    // 60 s Puffer, damit ein Token nicht mitten im Request ablaeuft
    gueltigBis: Date.now() + (daten.expires_in - 60) * 1000,
  }
  return daten.access_token
}

async function api(pfad: string, body: unknown) {
  const token = await zugriffsToken()
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/${pfad}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    throw new Error(`${pfad} fehlgeschlagen: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

// Gibt den Anzeigenamen zurueck – oder null, wenn es kein Konto gibt.
export async function findeNutzer(
  email: string
): Promise<{ displayName: string } | null> {
  const daten = (await api("accounts:lookup", { email: [email] })) as {
    users?: { displayName?: string }[]
  }
  const nutzer = daten.users?.[0]
  if (!nutzer) return null
  return { displayName: nutzer.displayName ?? "" }
}

// Erzeugt den Reset-Code, OHNE dass Firebase selbst eine Mail verschickt,
// und baut daraus einen Link auf unsere eigene Seite. Dadurch ist die
// Action-URL in der Firebase-Konsole irrelevant.
export async function erzeugeResetLink(email: string): Promise<string> {
  const daten = (await api("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
    returnOobLink: true,
  })) as { oobLink?: string }

  if (!daten.oobLink) throw new Error("Kein oobLink erhalten")

  const code = new URL(daten.oobLink).searchParams.get("oobCode")
  if (!code) throw new Error("Kein oobCode im Link")

  const basis = process.env.NEXT_PUBLIC_BASE_URL ?? "https://nachtfunke.de"
  return `${basis}/auth/action?mode=resetPassword&oobCode=${encodeURIComponent(code)}`
}
