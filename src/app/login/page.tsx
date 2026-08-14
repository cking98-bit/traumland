"use client"

import { useState, useEffect } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { useSprache } from "@/components/LanguageProvider"

export default function LoginPage() {
  const router = useRouter()
  const { nutzer, laden, abo, aboLaden } = useAuth()
  const { t } = useSprache()

  const [modus, setModus] = useState<"login" | "registrieren" | "reset">("login")
  const [vorname, setVorname] = useState("")
  const [nachname, setNachname] = useState("")
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [passwortWiederholen, setPasswortWiederholen] = useState("")
  const [fehler, setFehler] = useState("")
  const [erfolg, setErfolg] = useState("")
  const [ladevorgang, setLadevorgang] = useState(false)

  useEffect(() => {
    if (!laden && !aboLaden && nutzer) {
      router.push(abo ? "/" : "/preise")
    }
  }, [nutzer, laden, abo, aboLaden, router])

  async function mitEmailAnmelden() {
    setFehler("")

    if (!email || !passwort) {
      setFehler(t("login.fehler.felder"))
      return
    }

    if (modus === "registrieren") {
      if (!vorname.trim() || !nachname.trim()) {
        setFehler(t("login.fehler.namePflicht"))
        return
      }
      if (passwort.length < 6) {
        setFehler(t("login.fehler.passwortKurz"))
        return
      }
      if (passwort !== passwortWiederholen) {
        setFehler(t("login.fehler.passwortUngleich"))
        return
      }
    }

    if (!auth) {
      setFehler(t("login.fehler.nichtVerfuegbar"))
      return
    }

    setLadevorgang(true)
    try {
      if (modus === "registrieren") {
        const cred = await createUserWithEmailAndPassword(auth, email, passwort)
        // Name im Firebase-Profil hinterlegen – wird für Anrede in Mails
        // und als Vorbelegung beim Checkout genutzt
        await updateProfile(cred.user, {
          displayName: `${vorname.trim()} ${nachname.trim()}`,
        })
      } else {
        await signInWithEmailAndPassword(auth, email, passwort)
      }
      // Weiterleitung übernimmt der useEffect, sobald das Abo geladen ist
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code
      if (code === "auth/email-already-in-use") {
        setFehler(t("login.fehler.emailVergeben"))
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setFehler(t("login.fehler.falsch"))
      } else if (code === "auth/invalid-email") {
        setFehler(t("login.fehler.emailUngueltig"))
      } else {
        setFehler(t("login.fehler.allgemein"))
      }
    } finally {
      setLadevorgang(false)
    }
  }

  async function passwortZuruecksetzen() {
    setFehler("")
    setErfolg("")
    if (!email) {
      setFehler(t("login.fehler.felder"))
      return
    }
    setLadevorgang(true)
    try {
      await fetch("/api/passwort-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setErfolg(t("login.passwortResetGesendet"))
    } catch {
      setFehler(t("login.passwortResetFehler"))
    } finally {
      setLadevorgang(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-indigo-900 rounded-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌙</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {modus === "reset"
              ? t("login.passwortReset")
              : modus === "login"
              ? t("login.willkommen")
              : t("login.kontoErstellen")}
          </h1>
          <p className="text-indigo-300">
            {modus === "reset"
              ? t("login.passwortResetText")
              : modus === "login"
              ? t("login.subLogin")
              : t("login.subRegister")}
          </p>
        </div>

        {/* Passwort-Reset-Modus */}
        {modus === "reset" ? (
          <div className="flex flex-col gap-4">
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                {fehler}
              </div>
            )}
            {erfolg && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 rounded-xl px-4 py-3 text-sm">
                {erfolg}
              </div>
            )}
            <div>
              <label className="text-white text-sm font-medium block mb-2">
                {t("login.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@email.com"
                className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <button
              onClick={passwortZuruecksetzen}
              disabled={ladevorgang}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-3 rounded-xl transition"
            >
              {ladevorgang ? t("login.bitteWarten") : t("login.passwortReset")}
            </button>
            <button
              onClick={() => { setModus("login"); setFehler(""); setErfolg("") }}
              className="text-indigo-400 hover:text-white text-sm text-center transition"
            >
              {t("login.zurueck")}
            </button>
          </div>
        ) : (
          <>
            {/* Fehlermeldung */}
            {fehler && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                {fehler}
              </div>
            )}

            {/* E-Mail Formular */}
            <div className="flex flex-col gap-4">
              {modus === "registrieren" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      {t("login.vorname")}
                    </label>
                    <input
                      type="text"
                      value={vorname}
                      onChange={(e) => setVorname(e.target.value)}
                      autoComplete="given-name"
                      placeholder={t("login.vornamePlaceholder")}
                      className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      {t("login.nachname")}
                    </label>
                    <input
                      type="text"
                      value={nachname}
                      onChange={(e) => setNachname(e.target.value)}
                      autoComplete="family-name"
                      placeholder={t("login.nachnamePlaceholder")}
                      className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  {t("login.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anna@email.com"
                  className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm font-medium">
                    {t("login.passwort")}
                  </label>
                  {modus === "login" && (
                    <button
                      onClick={() => { setModus("reset"); setFehler(""); setErfolg("") }}
                      className="text-indigo-400 hover:text-yellow-400 text-xs transition"
                    >
                      {t("login.passwortVergessen")}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  placeholder={t("login.passwortPlaceholder")}
                  className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {modus === "registrieren" && (
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
              )}

              <button
                onClick={mitEmailAnmelden}
                disabled={ladevorgang}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-indigo-950 font-bold py-3 rounded-xl transition"
              >
                {ladevorgang
                  ? t("login.bitteWarten")
                  : modus === "login"
                  ? t("login.btnLogin")
                  : t("login.btnRegister")}
              </button>
            </div>

            {/* Umschalten Login/Registrieren */}
            <p className="text-indigo-400 text-sm text-center mt-6">
              {modus === "login" ? (
                <>
                  {t("login.keinKonto")}{" "}
                  <button
                    onClick={() => { setModus("registrieren"); setFehler("") }}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    {t("login.jetztRegistrieren")}
                  </button>
                </>
              ) : (
                <>
                  {t("login.bereitsKonto")}{" "}
                  <button
                    onClick={() => { setModus("login"); setFehler("") }}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    {t("login.jetztAnmelden")}
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
