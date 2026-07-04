import type { Metadata } from "next"
import { Inter, Nunito } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/Navigation"
import AuthProvider from "@/components/AuthProvider"
import LanguageProvider from "@/components/LanguageProvider"
import CookieBanner from "@/components/CookieBanner"
import Footer from "@/components/Footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: "Dreamland – KI-Gute-Nacht-Geschichten für dein Kind",
  description:
    "Jeden Abend eine neue, personalisierte Gute-Nacht-Geschichte – mit Illustration und Vorlesestimme. Erste Geschichte gratis testen.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Dreamland – KI-Gute-Nacht-Geschichten",
    description:
      "Personalisierte Gute-Nacht-Geschichten für dein Kind – illustriert und vorgelesen.",
    images: ["/demo-bild.png"],
  },
}

export const viewport = {
  themeColor: "#1e1b4b",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body
        className={`${inter.className} ${inter.variable} ${nunito.variable} bg-indigo-950 min-h-screen flex flex-col`}
      >
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
