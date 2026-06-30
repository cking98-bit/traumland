import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/Navigation"
import AuthProvider from "@/components/AuthProvider"
import LanguageProvider from "@/components/LanguageProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dreamland - AI Bedtime Stories",
  description: "Personalized AI bedtime stories for your child",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-indigo-950 min-h-screen`}>
        <LanguageProvider>
          <AuthProvider>
            <Navigation />
            <main className="max-w-4xl mx-auto px-6 py-10">
              {children}
            </main>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}