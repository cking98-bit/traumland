"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import { useSprache } from "@/components/LanguageProvider"

export default function AuthActionPage() {
  const { t } = useSprache()
  const params = useSearchParams()
  const mode = params.get("mode")
  const oobCode = params.get("oobCode")

  const [passwort, setPasswort] = useState("")
  const [passwortWiederholen, setPasswortWiederholen] = useState("")
  const [email, setEmail] = useState("")
  const [laedt, setLaedt] = useState(true)
  const [fehler, setFehler] = useState("")
  const [erfolg, setErfolg] = useState(false)
  const [ungueltig, setUngueltig] = useState(false)

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode || !auth) {
      setUngueltig(true)
      setLaedt(false)
      return
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((mail) => {
        setEmail(mail)
        setLaedt(false)
      })
      .catch(() => {
        setUngueltig(true)
        setLaedt(false)
      })
  }, [mode, oobCode])

  async function zuruecksetzen() {
    setFehler("")
    if (!passwort || passwort.length < 6) {
      setFehler(t("login.fehler.passwortKurz"))
      return
    }
    if (passwort !== passwortWiederholen) {
      setFehler(t("login.fehler.passwortUngleich"))
      return
    }
    if (!auth || !oobCode) return
    setLaedt(true)
    try {
      await confirmPasswordReset(auth, oobCode, passwort)
      setErfolg(true)
    } catch {
      setFehler(t("login.passwortResetFehler"))
    } finally {
      setLaedt(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-indigo-900 rounded-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌙</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("login.passwortReset")}
          </h1>
        </div>

        {ungueltig ? (
          <div className="flex flex-col gap-4">
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
              {t("auth.linkUngueltig")}
            </div>
            <Link
              href="/login"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-xl transition text-center block"
            >
              {t("auth.zumLogin")}
            </Link>
          </div>
        ) : erfolg ? (
          <div className="flex flex-col gap-4">
            <div className="bg-green-500/20 border border-green-500 text-green-300 rounded-xl px-4 py-3 text-sm">
              {t("auth.passwortGeaendert")}
            </div>
            <Link
              href="/login"
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold py-3 rounded-xl transition text-center block"
            >
              {t("auth.jetztAnmelden")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {email && (
              <p className="text-indigo-300 text-sm text-center">
                {t("auth.fuerEmail").replace("{email}", email)}
              </p>
            )}

            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}
              </div>
            )}

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                {t("auth.neuesPasswort")}
              </label>
              <input
                type="password"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                placeholder={t("login.passwortPlaceholder")}
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">
                {t("login.passwortWiederholen")}
              </label>
              <input
                type="password"
                value={passwortWiederholen}
                onChange={(e) => setPasswortWiederholen(e.target.value)}
                placeholder={t("login.passwortWiederholenPlaceholder")}
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <button
              onClick={zuruecksetzen}
              disabled={laedt}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-3 rounded-xl transition"
            >
              {laedt ? "…" : t("auth.passwortSpeichern")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
