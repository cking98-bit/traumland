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
    const abmelden = onAuthStateChanged(auth, (user) => {
      setNutzer(user)
      setLaden(false)
    })
    return () => abmelden()
  }, [])

  return (
    <AuthContext.Provider value={{ nutzer, laden }}>
      {children}
    </AuthContext.Provider>
  )
}