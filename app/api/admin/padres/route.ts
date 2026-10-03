import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

function esAdmin(req: NextRequest) {
  const adminCookie = req.cookies.get("flip_admin")?.value;
  return !!adminCookie && adminCookie === process.env.ADMIN_PASSWORD;
}

// GET: lista todas las cuentas de padres/tutores registradas, con los
// patinadores asociados a cada una. Solo para el panel de administración.
export async function GET(req: NextRequest) {
  if (!esAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ configurado: false, cuentas: [] });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("padres")
    .select("id, telefono, patinadores, creado_en")
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configurado: true, cuentas: data });
}

// POST: restablece la contraseña de una cuenta de padre/tutor (lo hace la
// administradora del club cuando un padre dice que no se acuerda). También
// cierra la sesión que tuviera abierta, por seguridad.
export async function POST(req: NextRequest) {
  if (!esAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos todavía no está configurada." },
      { status: 500 }
    );
  }

  const { id, nuevaPassword } = await req.json();
  if (!id || !nuevaPassword || String(nuevaPassword).length < 6) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("padres")
    .update({ password_hash: hashPassword(nuevaPassword), sesion_token: null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
