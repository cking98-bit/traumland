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
