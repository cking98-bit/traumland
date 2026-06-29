import Link from "next/link"

export default function Home() {
  return (
    <div className="text-center py-12">
      {/* Hero */}
      <div className="text-8xl mb-6">🌙</div>
      <h1 className="text-5xl font-bold text-white mb-4">
        Traumland
      </h1>
      <p className="text-indigo-300 text-xl mb-10 max-w-lg mx-auto">
        Personalisierte KI-Gute-Nacht-Geschichten – einzigartig für dein Kind
      </p>

      <Link
        href="/generator"
        className="bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-10 py-4 rounded-full text-lg transition inline-block"
      >
        Neue Geschichte erstellen ✨
      </Link>

      {/* Features */}
      <div className="grid grid-cols-3 gap-6 mt-16 text-left">
        {[
          { icon: "🤖", title: "KI-generiert", text: "Einzigartige Geschichten, jedes Mal neu" },
          { icon: "🎨", title: "Mit Illustrationen", text: "Passende Bilder zur Geschichte" },
          { icon: "🔊", title: "Vorlese-Funktion", text: "Lass die Geschichte vorlesen" },
        ].map((feature) => (
          <div key={feature.title} className="bg-indigo-900 rounded-2xl p-6">
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-white font-bold mb-1">{feature.title}</h3>
            <p className="text-indigo-300 text-sm">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}