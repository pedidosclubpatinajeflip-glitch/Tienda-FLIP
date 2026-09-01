import { NextRequest, NextResponse } from "next/server";

// Protege la tienda: sin sesión de padre, redirige a /login.
// (La comprobación real de la sesión contra la base de datos se hace en
// las rutas de API; esto solo evita que se vea la página sin más.)
export function middleware(req: NextRequest) {
  const tieneSesion = req.cookies.get("flip_sesion")?.value;
  if (!tieneSesion) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/pedido-confirmado"],
};
