import Link from "next/link"
import Features from "@/components/Features"

export default function Home() {
  return (
    <div className="text-center py-12">
      {/* Hero */}
      <div className="text-8xl mb-6">🌙</div>
      <h1 className="text-5xl font-bold text-white mb-4">Traumland</h1>
      <p className="text-indigo-300 text-xl mb-10 max-w-lg mx-auto">
        Personalisierte KI-Gute-Nacht-Geschichten – einzigartig für dein Kind
      </p>

      <Link
        href="/generator"
        className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-10 py-4 rounded-full text-lg transition inline-block"
      >
        Neue Geschichte erstellen ✨
      </Link>

      {/* Features – informativ, mit Info-Icons (keine Buttons) */}
      <Features />
    </div>
  )
}
