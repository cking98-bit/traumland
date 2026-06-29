import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/app/components/Navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Traumland  KI-Gute-Nacht-Geschichten",
  description: "Personalisierte Gute-Nacht-Geschichten für dein Kind",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-indigo-950 min-h-screen`}>
        <Navigation />
        <main className="max-w-4xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  )
}