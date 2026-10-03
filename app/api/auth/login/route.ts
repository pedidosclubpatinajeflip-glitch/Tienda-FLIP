import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import { verifyPassword, generarTokenSesion } from "@/lib/auth";
import { normalizaTelefono } from "@/lib/text";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos todavía no está configurada." },
      { status: 500 }
    );
  }

  const { telefono: telefonoRaw, password } = await req.json();
  const telefono = normalizaTelefono(telefonoRaw || "");
  if (!telefono || !password) {
    return NextResponse.json(
      { error: "Introduce tu número de teléfono y tu contraseña." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { data: padre } = await supabase
    .from("padres")
    .select("id, password_hash")
    .eq("telefono", telefono)
    .maybeSingle();

  if (!padre || !verifyPassword(password, padre.password_hash)) {
    return NextResponse.json(
      { error: "Teléfono o contraseña incorrectos." },
      { status: 401 }
    );
  }

  const token = generarTokenSesion();
  await supabase.from("padres").update({ sesion_token: token }).eq("id", padre.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("flip_sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
