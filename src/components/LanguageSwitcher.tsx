"use client"

import { useSprache } from "@/components/LanguageProvider"
import { SPRACHEN } from "@/lib/i18n"

export default function LanguageSwitcher() {
  const { sprache, setSprache } = useSprache()

  return (
    <div className="flex items-center gap-1">
      {SPRACHEN.map((s) => (
        <button
          key={s.code}
          onClick={() => setSprache(s.code)}
          aria-label={s.label}
          title={s.label}
          className={`text-xl leading-none px-1 rounded transition ${
            sprache === s.code
              ? "opacity-100 scale-110"
              : "opacity-40 hover:opacity-80"
          }`}
        >
          {s.flag}
        </button>
      ))}
    </div>
  )
}
