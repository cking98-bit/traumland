import { NextRequest } from "next/server"
import { createRemoteJWKSet, jwtVerify } from "jose"

// Firebase-ID-Tokens sind JWTs, signiert von Google.
// Wir prüfen sie direkt mit jose statt mit firebase-admin/auth,
// weil dessen Abhängigkeit (jwks-rsa, CommonJS) auf Vercel am
// ESM-only jose-Paket scheitert (ERR_REQUIRE_ESM).
const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  ""

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
)

// Prüft das Firebase-ID-Token aus dem Authorization-Header.
// Gibt die uid des Nutzers zurück – oder null wenn ungültig/fehlend.
export async function verifiziereNutzer(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null

  try {
    const { payload } = await jwtVerify(header.slice(7), JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    })
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null
  } catch {
    return null
  }
}
