import { NextRequest } from "next/server"
import { getAuth } from "firebase-admin/auth"
import "@/lib/firebaseAdmin" // stellt sicher, dass die Admin-App initialisiert ist

// Prüft das Firebase-ID-Token aus dem Authorization-Header.
// Gibt die uid des Nutzers zurück – oder null wenn ungültig/fehlend.
export async function verifiziereNutzer(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  try {
    const token = await getAuth().verifyIdToken(header.slice(7))
    return token.uid
  } catch {
    return null
  }
}
