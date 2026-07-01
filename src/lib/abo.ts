import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Abo-Status – jetzt serverseitig in Firestore (vorerst noch simuliert,
// später schreibt der Stripe-Webhook hier rein)
export type Abo = {
  plan: string
  kinder: number
  status?: string
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  wird_gekuendigt?: boolean
}

export async function ladeAbo(uid: string): Promise<Abo | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, "users", uid))
    const data = snap.data()
    return (data?.abo as Abo) ?? null
  } catch (e) {
    console.error("Abo laden fehlgeschlagen:", e)
    return null
  }
}

export async function setzeAbo(uid: string, plan: string, kinder: number) {
  if (!db) return
  await setDoc(
    doc(db, "users", uid),
    { abo: { plan, kinder, status: "aktiv" } },
    { merge: true }
  )
}

// Ein weiteres Kind zum laufenden Vertrag hinzufügen
export async function erhoeheKinder(uid: string) {
  const abo = await ladeAbo(uid)
  if (!abo) return
  await setzeAbo(uid, abo.plan, abo.kinder + 1)
}

export async function kuendigeAbo(uid: string) {
  if (!db) return
  await setDoc(doc(db, "users", uid), { abo: null }, { merge: true })
}
