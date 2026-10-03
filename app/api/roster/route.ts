import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";

// GET: devuelve el listado completo de patinadores. Solo para uso interno
// del panel de administración (nunca se expone en la tienda pública, para
// no enseñar los nombres de todos los patinadores a cualquiera).
export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get("flip_admin")?.value;
  if (!adminCookie || adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ configurado: false, patinadores: [] });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("patinadores")
    .select("id, nombre, grupo, telefono")
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configurado: true, patinadores: data });
}

// POST: reemplaza el listado de patinadores (usado desde /admin al subir
// el Excel exportado de Cluber). Protegido con la contraseña de admin.
export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("flip_admin")?.value;
  if (!adminCookie || adminCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "La base de datos todavía no está configurada (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 500 }
    );
  }

  const body = await req.json();
  const filas: { nombre: string; grupo?: string; tutor?: string; telefono?: string; email?: string }[] =
    body.patinadores || [];

  if (!Array.isArray(filas) || filas.length === 0) {
    return NextResponse.json({ error: "No se recibieron filas" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Sustituimos el listado completo por el nuevo Excel (Cluber es la
  // fuente de la verdad): borramos y volvemos a insertar.
  const { error: delError } = await supabase
    .from("patinadores")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const { error: insError, count } = await supabase.from("patinadores").insert(
    filas.map((f) => ({
      nombre: f.nombre,
      grupo: f.grupo || null,
      tutor: f.tutor || null,
      telefono: f.telefono || null,
      email: f.email || null,
    })),
    { count: "exact" }
  );

  if (insError) {
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, importados: count ?? filas.length });
}
