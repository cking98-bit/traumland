"use client"

import { useState } from "react"
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
  const [menuOffen, setMenuOffen] = useState(false)

  const links = nutzer
    ? [
        { href: "/", label: t("nav.start") },
        { href: "/generator", label: t("nav.neu") },
        { href: "/bibliothek", label: t("nav.bibliothek") },
        { href: "/profile", label: t("nav.profile") },
        { href: "/abo", label: t("nav.abo") },
      ]
    : [
        { href: "/", label: t("nav.start") },
        { href: "/preise", label: t("nav.preise") },
      ]

  async function abmelden() {
    if (auth) await signOut(auth)
    document.cookie = "__session=; path=/; max-age=0"
    router.push("/login")
    setMenuOffen(false)
  }

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          🌙 {t("marke")}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                pathname === link.href
                  ? "text-yellow-400"
                  : "text-indigo-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {nutzer ? (
            <div className="flex items-center gap-3">
              {nutzer.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nutzer.photoURL}
                  alt="Profil"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <button
                onClick={abmelden}
                className="text-indigo-300 hover:text-white text-sm transition"
              >
                {t("nav.abmelden")}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-2 rounded-lg text-sm transition"
            >
              {t("nav.anmelden")}
            </Link>
          )}
          <LanguageSwitcher />
        </div>

        {/* Mobile: Sprache + Hamburger-Button */}
        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOffen(!menuOffen)}
            className="text-indigo-300 hover:text-white transition p-1"
            aria-label="Menü öffnen"
          >
            {menuOffen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown-Menü */}
      {menuOffen && (
        <div className="md:hidden mt-3 border-t border-indigo-700 pt-3 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOffen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                pathname === link.href
                  ? "text-yellow-400 bg-indigo-800"
                  : "text-indigo-300 hover:text-white hover:bg-indigo-800"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 pt-2 border-t border-indigo-800 px-4 pb-1">
            {nutzer ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {nutzer.photoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nutzer.photoURL}
                      alt="Profil"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-indigo-400 text-xs truncate max-w-[160px]">
                    {nutzer.email}
                  </span>
                </div>
                <button
                  onClick={abmelden}
                  className="text-indigo-300 hover:text-white text-sm transition ml-2"
                >
                  {t("nav.abmelden")}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOffen(false)}
                className="block w-full text-center bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-3 rounded-xl text-sm transition"
              >
                {t("nav.anmelden")}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
