"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"

type AuthContextType = {
  nutzer: User | null
  laden: boolean
}

const AuthContext = createContext<AuthContextType>({
  nutzer: null,
  laden: true,
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

  useEffect(() => {
    const abmelden = onAuthStateChanged(auth, async (user) => {
      setNutzer(user)
      setLaden(false)

      if (user) {
        // Token als Cookie setzen damit Middleware es lesen kann
        const token = await user.getIdToken()
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`
      } else {
        // Cookie löschen beim Abmelden
        document.cookie = "__session=; path=/; max-age=0"
      }
    })
    return () => abmelden()
  }, [])

  return (
    <AuthContext.Provider value={{ nutzer, laden }}>
      {children}
    </AuthContext.Provider>
  )
}