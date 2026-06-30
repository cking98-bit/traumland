"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function SchutzRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { nutzer, laden } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!laden && !nutzer) {
      router.push("/login")
    }
  }, [nutzer, laden, router])

  // Ladeanimation während Auth-Status geprüft wird
  if (laden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl animate-bounce">🌙</div>
        <p className="text-indigo-300">Wird geladen...</p>
      </div>
    )
  }

  // Nicht eingeloggt → nichts anzeigen (Weiterleitung läuft)
  if (!nutzer) return null

  return <>{children}</>
}