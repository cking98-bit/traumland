import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/Navigation"
import AuthProvider from "@/components/AuthProvider"
import LanguageProvider from "@/components/LanguageProvider"
import CookieBanner from "@/components/CookieBanner"
import Footer from "@/components/Footer"

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
      <body className={`${inter.className} bg-indigo-950 min-h-screen flex flex-col`}>
        <LanguageProvider>
          <AuthProvider>
            <Navigation />
            <main className="max-w-4xl mx-auto w-full px-4 py-6 md:px-6 md:py-10 flex-1">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
