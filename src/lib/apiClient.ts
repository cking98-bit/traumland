import { auth } from "@/lib/firebase"

// fetch mit Firebase-ID-Token im Authorization-Header –
// für alle geschützten API-Routen
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token: string | undefined
  try {
    token = await auth?.currentUser?.getIdToken()
  } catch {
    // ohne Token weiterschicken – Server lehnt dann ab
  }
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
