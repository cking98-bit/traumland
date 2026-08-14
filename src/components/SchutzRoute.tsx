"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function SchutzRoute({
  children,
  abo = false,
}: {
  children: React.ReactNode
  abo?: boolean // true = Abo ODER Schnupper-Guthaben erforderlich
}) {
  const { nutzer, laden, abo: aboStatus, aboLaden, schnupperGuthaben } = useAuth()
  const router = useRouter()
  const [bereit, setBereit] = useState(false)

  useEffect(() => {
    if (laden) return

    // Nicht eingeloggt → zur Anmeldung
    if (!nutzer) {
      router.push("/login")
      return
    }

    // Zugang erforderlich: erst warten bis geladen, dann ggf. umleiten.
    // Schnupper-Guthaben zählt genauso wie ein Abo – sonst landen Käufer
    // des Schnupper-Pakets in einer Endlosschleife zur Preisseite.
    if (abo) {
      if (aboLaden) return
      const hatZugang = !!aboStatus || schnupperGuthaben > 0
      if (!hatZugang) {
        router.push("/preise")
        return
      }
    }

    setBereit(true)
  }, [nutzer, laden, abo, aboStatus, aboLaden, schnupperGuthaben, router])

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
