"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { hatAbo } from "@/lib/abo"

export default function SchutzRoute({
  children,
  abo = false,
}: {
  children: React.ReactNode
  abo?: boolean // true = zusätzlich aktives Abo erforderlich
}) {
  const { nutzer, laden } = useAuth()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    if (laden) return

    // Nicht eingeloggt → zur Anmeldung
    if (!nutzer) {
      router.push("/login")
      return
    }

    // Eingeloggt, aber kein aktives Abo → immer zu den Preisen
    if (abo && !hatAbo()) {
      router.push("/preise")
      return
    }

    setBereit(true)
  }, [nutzer, laden, abo, router])

  // Während geprüft/umgeleitet wird: Ladeanzeige
  if (laden || !bereit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">🌙</div>
        <p className="text-indigo-300">Wird geladen...</p>
      </div>
    )
  }

  return <>{children}</>
}
