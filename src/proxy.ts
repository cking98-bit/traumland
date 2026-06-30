import { NextRequest, NextResponse } from "next/server"

// Seiten die OHNE Login erreichbar sind
const öffentlicheSeiten = ["/", "/login", "/preise"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Öffentliche Seiten durchlassen
  if (öffentlicheSeiten.includes(pathname)) {
    return NextResponse.next()
  }

  // API-Routen durchlassen
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Firebase setzt ein Cookie "__session" wenn eingeloggt
  const session = request.cookies.get("__session")?.value

  // Kein Cookie → zur Login-Seite
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
