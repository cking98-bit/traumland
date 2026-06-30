"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function SchutzRoute({
  children,
  abo = false,
}: {
  children: React.ReactNode
  abo?: boolean // true = zusätzlich aktives Abo erforderlich
}) {
  const { nutzer, laden, abo: aboStatus, aboLaden } = useAuth()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    if (laden) return

    // Nicht eingeloggt → zur Anmeldung
    if (!nutzer) {
      router.push("/login")
      return
    }

    // Abo erforderlich: erst warten bis geladen, dann ggf. umleiten
    if (abo) {
      if (aboLaden) return
      if (!aboStatus) {
        router.push("/preise")
        return
      }
    }

    setBereit(true)
  }, [nutzer, laden, abo, aboStatus, aboLaden, router])

  if (laden || (abo && aboLaden) || !bereit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">🌙</div>
        <p className="text-indigo-300">Wird geladen...</p>
      </div>
    )
  }

  return <>{children}</>
}
