"use client"

import Link from "next/link"
import { useSprache } from "@/components/LanguageProvider"

export default function Footer() {
  const { t } = useSprache()

  return (
    <footer className="border-t border-indigo-800 py-6 px-4 mt-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-indigo-500 text-xs">
        <span>© {new Date().getFullYear()} 🌙 {t("marke")} · Colin King</span>
        <div className="flex gap-4">
          <Link href="/impressum" className="hover:text-indigo-300 transition">
            {t("footer.impressum")}
          </Link>
          <Link href="/datenschutz" className="hover:text-indigo-300 transition">
            {t("footer.datenschutz")}
          </Link>
        </div>
      </div>
    </footer>
  )
}
