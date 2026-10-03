import { NextRequest, NextResponse } from "next/server";
import { getPadreDeSesion } from "@/lib/session";

export async function GET(req: NextRequest) {
  const padre = await getPadreDeSesion(req);
  if (!padre) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }
  return NextResponse.json({
    telefono: padre.telefono,
    patinadores: padre.patinadores,
  });
}
