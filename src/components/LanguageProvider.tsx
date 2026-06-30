"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { type Sprache, texte } from "@/lib/i18n"

type Ctx = {
  sprache: Sprache
  setSprache: (s: Sprache) => void
  t: (key: string) => string
}

const LanguageContext = createContext<Ctx>({
  sprache: "de",
  setSprache: () => {},
  t: (k) => k,
})

export function useSprache() {
  return useContext(LanguageContext)
}

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sprache, setSpracheState] = useState<Sprache>("de")

  // Gespeicherte Sprache laden
  useEffect(() => {
    const gespeichert = localStorage.getItem("traumland_sprache")
    if (gespeichert === "de" || gespeichert === "en") {
      setSpracheState(gespeichert)
    }
  }, [])

  function setSprache(s: Sprache) {
    setSpracheState(s)
    localStorage.setItem("traumland_sprache", s)
  }

  // Übersetzungs-Funktion: holt den Text, fällt auf Deutsch bzw. den Schlüssel zurück
  function t(key: string): string {
    return texte[sprache][key] ?? texte.de[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ sprache, setSprache, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
