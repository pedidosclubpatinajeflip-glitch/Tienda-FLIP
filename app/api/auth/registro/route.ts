import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import { hashPassword, generarTokenSesion } from "@/lib/auth";
import { normaliza } from "@/lib/text";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos todavía no está configurada." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const email: string = (body.email || "").trim().toLowerCase();
  const password: string = body.password || "";
  const nombresPatinadores: string[] = (body.patinadores || [])
    .map((n: string) => (n || "").trim())
    .filter(Boolean);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Introduce un email válido." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }
  if (nombresPatinadores.length === 0) {
    return NextResponse.json(
      { error: "Indica el nombre de al menos un patinador/a." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // No exigimos que el nombre esté en el listado de Klubber: cualquiera
  // puede registrarse con el nombre que escriba. Si ese nombre coincide
  // con el listado subido desde /admin, aprovechamos para guardar también
  // su grupo (útil de cara al futuro); si no coincide o no se ha subido
  // ningún listado todavía, no pasa nada, se guarda tal cual lo escribió.
  const { data: roster } = await supabase.from("patinadores").select("nombre, grupo");

  const patinadoresValidados: { nombre: string; grupo: string | null }[] =
    nombresPatinadores.map((nombreEscrito) => {
      const match = roster?.find((r) => normaliza(r.nombre) === normaliza(nombreEscrito));
      return match
        ? { nombre: match.nombre, grupo: match.grupo }
        : { nombre: nombreEscrito, grupo: null };
    });

  const { data: existente } = await supabase
    .from("padres")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email. Prueba a iniciar sesión." },
      { status: 400 }
    );
  }

  const token = generarTokenSesion();

  const { error: insError } = await supabase.from("padres").insert({
    email,
    password_hash: hashPassword(password),
    patinadores: patinadoresValidados,
    sesion_token: token,
  });

  if (insError) {
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("flip_sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 días
  });
  return res;
}
