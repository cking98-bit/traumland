import Link from "next/link"

export default function GeschichtePage({
  searchParams,
}: {
  searchParams: { name?: string; alter?: string; stichwörter?: string; stil?: string }
}) {
  const { name, alter, stichwörter, stil } = searchParams

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">
        🌙 Geschichte für {name}
      </h1>
      <p className="text-indigo-300 mb-8">
        {alter} Jahre · {stichwörter} · {stil}
      </p>

      {/* Platzhalter - später kommt hier die echte KI-Geschichte */}
      <div className="bg-indigo-900 rounded-2xl p-8">
        <div className="bg-indigo-800 rounded-xl h-48 flex items-center justify-center mb-6">
          <span className="text-indigo-400">🎨 Illustration kommt hier</span>
        </div>
        <p className="text-indigo-200 leading-relaxed text-lg">
          Es war einmal ein Kind namens <strong className="text-white">{name}</strong>,
          das sich nichts sehnlicher wünschte als ein großes Abenteuer.
          Eines Abends, als der Mond hell am Himmel leuchtete, begann
          die Geschichte...
        </p>
        <p className="text-indigo-400 mt-4 text-sm italic">
          ✨ Bald wird hier deine echte KI-Geschichte erscheinen!
        </p>
      </div>

      <div className="flex gap-4 mt-6">
        <Link
          href="/generator"
          className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-center transition"
        >
          Neue Geschichte
        </Link>
        <Link
          href="/bibliothek"
          className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-xl text-center transition"
        >
          Zur Bibliothek
        </Link>
      </div>
    </div>
  )
}