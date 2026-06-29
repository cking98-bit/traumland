"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "🏠 Start" },
    { href: "/generator", label: "✨ Neue Geschichte" },
    { href: "/bibliothek", label: "📚 Bibliothek" },
  ]

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-white font-bold text-xl">🌙 Traumland</span>
        <div className="flex gap-6">
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
        </div>
      </div>
    </nav>
  )
}
