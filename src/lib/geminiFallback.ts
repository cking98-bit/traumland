// Versucht mehrere Gemini-Modelle der Reihe nach, bis eines ein
// brauchbares Ergebnis liefert. Modelle werden ab und zu von Google
// abgeschaltet oder ändern ihr Verhalten (z.B. neue Parameter-Anforderungen) –
// ohne Fallback würde das sofort alle Geschichten-/Bild-/Vorlese-Anfragen
// lahmlegen. Erst wenn ALLE Modelle scheitern, wird null zurückgegeben.
export async function mitModellFallback<T>(
  modelle: string[],
  anfrage: (modell: string, signal: AbortSignal) => Promise<T | null>,
  timeoutMsProModell = 20000
): Promise<{ daten: T; modell: string } | null> {
  for (const modell of modelle) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMsProModell)
    try {
      const daten = await anfrage(modell, controller.signal)
      clearTimeout(timeout)
      if (daten !== null && daten !== undefined) {
        return { daten, modell }
      }
      console.error(`Gemini-Modell "${modell}" lieferte kein brauchbares Ergebnis, versuche nächstes Modell.`)
    } catch (err) {
      clearTimeout(timeout)
      console.error(`Gemini-Modell "${modell}" fehlgeschlagen:`, err)
    }
  }
  return null
}

// Schickt die Anfrage an ALLE Modelle gleichzeitig und nimmt das erste
// brauchbare Ergebnis – schneller als Fallback-der-Reihe-nach, weil nicht
// erst gewartet wird, bis ein Modell scheitert, bevor das nächste startet.
// Sinnvoll wenn Antwortzeiten stark schwanken (z.B. TTS), Kosten pro
// Anfrage aber gering sind.
export async function mitModellWettlauf<T>(
  modelle: string[],
  anfrage: (modell: string, signal: AbortSignal) => Promise<T | null>,
  timeoutMs = 20000
): Promise<{ daten: T; modell: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const versuche = modelle.map(async (modell) => {
    try {
      const daten = await anfrage(modell, controller.signal)
      if (daten !== null && daten !== undefined) return { daten, modell }
    } catch (err) {
      console.error(`Gemini-Modell "${modell}" (Wettlauf) fehlgeschlagen:`, err)
    }
    return null
  })

  try {
    return await new Promise<{ daten: T; modell: string } | null>((resolve) => {
      let ausstehend = versuche.length
      let entschieden = false
      for (const versuch of versuche) {
        versuch.then((ergebnis) => {
          ausstehend--
          if (!entschieden && ergebnis) {
            entschieden = true
            resolve(ergebnis)
          } else if (ausstehend === 0 && !entschieden) {
            resolve(null)
          }
        })
      }
    })
  } finally {
    clearTimeout(timeout)
  }
}
