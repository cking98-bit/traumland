import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let auth: Auth | null = null
let db: Firestore | null = null

// Firebase NUR im Browser starten und Fehler abfangen.
// So lässt eine fehlende/falsche Konfiguration nicht die ganze Seite abstürzen.
if (typeof window !== "undefined") {
  try {
    const app: FirebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (e) {
    console.error("Firebase konnte nicht initialisiert werden:", e)
  }
}

export { auth, db }
export const googleProvider = new GoogleAuthProvider()
