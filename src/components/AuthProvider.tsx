"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { onIdTokenChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ladeNutzerDaten, type Abo } from "@/lib/abo"

type AuthContextType = {
  nutzer: User | null
  laden: boolean
  abo: Abo | null
  aboLaden: boolean
  gratisGenutzt: boolean
  aboNeuLaden: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  nutzer: null,
  laden: true,
  abo: null,
  aboLaden: true,
  gratisGenutzt: false,
  aboNeuLaden: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [nutzer, setNutzer] = useState<User | null>(null)
  const [laden, setLaden] = useState(true)
  const [abo, setAbo] = useState<Abo | null>(null)
  const [aboLaden, setAboLaden] = useState(true)
  const [gratisGenutzt, setGratisGenutzt] = useState(false)

  // Abo + Gratis-Status aus Firestore (neu) laden
  const aboNeuLaden = useCallback(async () => {
    if (!auth?.currentUser) {
      setAbo(null)
      setGratisGenutzt(false)
      setAboLaden(false)
      return
    }
    setAboLaden(true)
    const daten = await ladeNutzerDaten(auth.currentUser.uid)
    setAbo(daten.abo)
    setGratisGenutzt(daten.gratisGenutzt)
    setAboLaden(false)
  }, [])

  useEffect(() => {
    if (!auth) {
      setLaden(false)
      setAboLaden(false)
      return
    }
    // onIdTokenChanged feuert bei Login/Logout UND bei jeder Token-Erneuerung
    // (stündlich) – so bleibt das Session-Cookie immer frisch und die
    // Navigation zu geschützten Seiten funktioniert auch nach längerer Zeit.
    let vorherigeUid: string | null = null
    const abmelden = onIdTokenChanged(auth, async (user) => {
      setNutzer(user)
      setLaden(false)

      if (user) {
        const token = await user.getIdToken()
        document.cookie = `__session=${token}; path=/; max-age=1209600; SameSite=Strict`

        // Abo nur neu laden, wenn sich der Nutzer geändert hat
        // (nicht bei jeder Token-Erneuerung)
        if (vorherigeUid !== user.uid) {
          vorherigeUid = user.uid
          setAboLaden(true)
          const daten = await ladeNutzerDaten(user.uid)
          setAbo(daten.abo)
          setGratisGenutzt(daten.gratisGenutzt)
          setAboLaden(false)
        }
      } else {
        vorherigeUid = null
        document.cookie = "__session=; path=/; max-age=0"
        setAbo(null)
        setGratisGenutzt(false)
        setAboLaden(false)
      }
    })
    return () => abmelden()
  }, [])

  return (
    <AuthContext.Provider
      value={{ nutzer, laden, abo, aboLaden, gratisGenutzt, aboNeuLaden }}
    >
      {children}
    </AuthContext.Provider>
  )
}
