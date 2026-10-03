import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import { hashPassword, generarTokenSesion } from "@/lib/auth";
import { normalizaTelefono } from "@/lib/text";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos todavía no está configurada." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const telefono = normalizaTelefono(body.telefono || "");
  const password: string = body.password || "";

  if (telefono.length < 9) {
    return NextResponse.json(
      { error: "Introduce un número de teléfono válido." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Buscamos a qué patinador/es corresponde este teléfono: el mismo que
  // las familias ya usan para entrar en Cluber. Un mismo teléfono puede
  // tener más de un patinador/a (hermanos en el club).
  const { data: roster, error: rosterError } = await supabase
    .from("patinadores")
    .select("nombre, grupo, telefono");

  if (rosterError) {
    return NextResponse.json({ error: rosterError.message }, { status: 500 });
  }

  const propios = (roster || []).filter(
    (r) => r.telefono && normalizaTelefono(r.telefono) === telefono
  );

  if (propios.length === 0) {
    return NextResponse.json(
      {
        error:
          "No encontramos ese número en el listado del club. Comprueba que sea el mismo que usas en Cluber, o contacta con el club si crees que es un error.",
      },
      { status: 400 }
    );
  }

  const { data: existente } = await supabase
    .from("padres")
    .select("id")
    .eq("telefono", telefono)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese teléfono. Prueba a iniciar sesión." },
      { status: 400 }
    );
  }

  const token = generarTokenSesion();

  const { error: insError } = await supabase.from("padres").insert({
    telefono,
    password_hash: hashPassword(password),
    patinadores: propios.map((p) => ({ nombre: p.nombre, grupo: p.grupo })),
    sesion_token: token,
  });

  if (insError) {
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    patinadores: propios.map((p) => p.nombre),
  });
  res.cookies.set("flip_sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 días
  });
  return res;
}
