import Link from "next/link"
import VorleseButton from "@/app/components/VorleseButton"

export default async function GeschichtePage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string
    alter?: string
    stichwörter?: string
    stil?: string
    dauer?: string
    geschichte?: string
  }>
}) {
  const { name, alter, stichwörter, stil, dauer, geschichte } = await searchParams

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-1">
        🌙 Geschichte für {name}
      </h1>
      <p className="text-indigo-400 text-sm mb-8">
        {alter} Jahre · {stichwörter} · {stil}
        {dauer ? ` · ~${dauer} Min` : ""}
      </p>

      <div className="bg-indigo-900 rounded-2xl p-8">
        {/* Illustration Platzhalter */}
        <div className="bg-indigo-800 rounded-xl h-48 flex items-center justify-center mb-6">
          <span className="text-indigo-400">🎨 Illustration kommt bald</span>
        </div>

        {/* Vorlese-Funktion */}
        {geschichte && <VorleseButton text={geschichte} />}

        {/* Geschichte */}
        <div className="text-indigo-100 leading-relaxed text-lg whitespace-pre-line">
          {geschichte}
        </div>
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