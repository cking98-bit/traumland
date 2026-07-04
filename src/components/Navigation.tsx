"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/AuthProvider"
import { useSprache } from "@/components/LanguageProvider"
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { nutzer } = useAuth()
  const { t } = useSprache()
  const [offen, setOffen] = useState(false)

  // Drawer bei Seitenwechsel schließen
  useEffect(() => {
    setOffen(false)
  }, [pathname])

  const links = nutzer
    ? [
        { href: "/", label: t("nav.start") },
        { href: "/bibliothek", label: t("nav.bibliothek") },
        { href: "/profile", label: t("nav.profile") },
        { href: "/abo", label: t("nav.abo") },
        { href: "/preise", label: t("nav.preise") },
      ]
    : [
        { href: "/", label: t("nav.start") },
        { href: "/preise", label: t("nav.preise") },
      ]

  async function abmelden() {
    if (auth) await signOut(auth)
    document.cookie = "__session=; path=/; max-age=0"
    setOffen(false)
    router.push("/login")
  }

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          🌙 {t("marke")}
        </Link>

        <div className="flex items-center gap-3">
          {/* Haupt-CTA bleibt immer sichtbar */}
          {nutzer ? (
            <Link
              href="/generator"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-2 rounded-full text-sm transition"
            >
              ✨ {t("nav.neu")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-2 rounded-full text-sm transition"
            >
              {t("nav.anmelden")}
            </Link>
          )}

          {/* Menü-Knopf */}
          <button
            onClick={() => setOffen(true)}
            className="text-indigo-300 hover:text-white transition p-1"
            aria-label="Menü öffnen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Abdunkelnder Hintergrund */}
      <div
        onClick={() => setOffen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          offen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Rechte Seitenspalte */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-indigo-900 border-l border-indigo-700 z-50 flex flex-col transition-transform duration-200 ${
          offen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setOffen(false)}
            className="text-indigo-300 hover:text-white transition p-1"
            aria-label="Menü schließen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === link.href
                  ? "text-yellow-400 bg-indigo-950"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t border-indigo-800 p-4 flex flex-col gap-3">
          {nutzer && (
            <div className="flex items-center gap-2 px-1">
              {nutzer.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nutzer.photoURL}
                  alt="Profil"
                  className="w-7 h-7 rounded-full"
                />
              )}
              <span className="text-indigo-400 text-xs truncate">
                {nutzer.email}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            {nutzer ? (
              <button
                onClick={abmelden}
                className="text-red-300 hover:text-red-200 text-sm transition"
              >
                {t("nav.abmelden")}
              </button>
            ) : (
              <Link
                href="/login"
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition"
              >
                {t("nav.anmelden")}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </nav>
  )
}
