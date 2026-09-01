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

  // Comprobamos cada nombre contra el listado real del club (Klubber),
  // sin exponer el listado completo al navegador.
  const { data: roster, error: rosterError } = await supabase
    .from("patinadores")
    .select("nombre, grupo");

  if (rosterError) {
    return NextResponse.json({ error: rosterError.message }, { status: 500 });
  }

  if (!roster || roster.length === 0) {
    return NextResponse.json(
      {
        error:
          "Todavía no se ha cargado el listado de patinadores del club. Contacta con el club para que lo suban desde /admin.",
      },
      { status: 400 }
    );
  }

  const patinadoresValidados: { nombre: string; grupo: string | null }[] = [];
  for (const nombreEscrito of nombresPatinadores) {
    const match = roster.find((r) => normaliza(r.nombre) === normaliza(nombreEscrito));
    if (!match) {
      return NextResponse.json(
        {
          error: `No encontramos a "${nombreEscrito}" en el listado del club. Revisa que esté escrito igual que en Klubber (nombre y apellido), o contacta con el club si crees que es un error.`,
        },
        { status: 400 }
      );
    }
    patinadoresValidados.push({ nombre: match.nombre, grupo: match.grupo });
  }

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
