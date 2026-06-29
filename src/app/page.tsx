export default function Home() {
  return (
    <main className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-white mb-4">
        🌙 Traumland
      </h1>
      <p className="text-indigo-300 text-xl">
        KI-Gute-Nacht-Geschichten für dein Kind
      </p>
      <button className="mt-8 bg-yellow-400 text-indigo-950 font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-300 transition">
        Neue Geschichte erstellen ✨
      </button>
    </main>
  )
}