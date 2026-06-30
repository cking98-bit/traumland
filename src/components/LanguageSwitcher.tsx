"use client"

import { useSprache } from "@/components/LanguageProvider"
import { SPRACHEN } from "@/lib/i18n"

// Echte Flaggen als SVG (Emoji-Flaggen werden auf Windows nur als "DE"/"GB" angezeigt)
function Flagge({ code }: { code: string }) {
  if (code === "de") {
    return (
      <svg viewBox="0 0 5 3" width="26" height="16" className="rounded-sm">
        <rect width="5" height="3" fill="#000" />
        <rect width="5" height="2" y="1" fill="#DD0000" />
        <rect width="5" height="1" y="2" fill="#FFCE00" />
      </svg>
    )
  }
  // Großbritannien (Union Jack)
  return (
    <svg viewBox="0 0 60 30" width="26" height="16" className="rounded-sm">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

export default function LanguageSwitcher() {
  const { sprache, setSprache } = useSprache()

  return (
    <div className="flex items-center gap-2">
      {SPRACHEN.map((s) => (
        <button
          key={s.code}
          onClick={() => setSprache(s.code)}
          aria-label={s.label}
          title={s.label}
          className={`rounded-sm overflow-hidden border transition ${
            sprache === s.code
              ? "border-yellow-400 opacity-100 scale-110"
              : "border-transparent opacity-50 hover:opacity-90"
          }`}
        >
          <Flagge code={s.code} />
        </button>
      ))}
    </div>
  )
}
