"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/AuthProvider"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { nutzer } = useAuth()

  const links = [
    { href: "/", label: "🏠 Start" },
    { href: "/generator", label: "✨ Neue Geschichte" },
    { href: "/bibliothek", label: "📚 Bibliothek" },
  ]

  async function abmelden() {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-white font-bold text-xl">🌙 Traumland</span>

        <div className="flex items-center gap-6">
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
                  alt="Profilbild"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <button
                onClick={abmelden}
                className="text-indigo-300 hover:text-white text-sm transition"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-4 py-2 rounded-lg text-sm transition"
            >
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}