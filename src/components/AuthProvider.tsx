"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ladeAbo, type Abo } from "@/lib/abo"

type AuthContextType = {
  nutzer: User | null
  laden: boolean
  abo: Abo | null
  aboLaden: boolean
  aboNeuLaden: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  nutzer: null,
  laden: true,
  abo: null,
  aboLaden: true,
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

  // Abo aus Firestore (neu) laden – z.B. nach Abschluss eines Plans
  const aboNeuLaden = useCallback(async () => {
    if (!auth?.currentUser) {
      setAbo(null)
      setAboLaden(false)
      return
    }
    setAboLaden(true)
    const a = await ladeAbo(auth.currentUser.uid)
    setAbo(a)
    setAboLaden(false)
  }, [])

  useEffect(() => {
    if (!auth) {
      setLaden(false)
      setAboLaden(false)
      return
    }
    const abmelden = onAuthStateChanged(auth, async (user) => {
      setNutzer(user)
      setLaden(false)

      if (user) {
        const token = await user.getIdToken()
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`

        // Abo des Nutzers aus Firestore laden
        setAboLaden(true)
        const a = await ladeAbo(user.uid)
        setAbo(a)
        setAboLaden(false)
      } else {
        document.cookie = "__session=; path=/; max-age=0"
        setAbo(null)
        setAboLaden(false)
      }
    })
    return () => abmelden()
  }, [])

  return (
    <AuthContext.Provider
      value={{ nutzer, laden, abo, aboLaden, aboNeuLaden }}
    >
      {children}
    </AuthContext.Provider>
  )
}
