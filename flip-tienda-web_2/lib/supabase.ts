import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para uso SOLO en el servidor (API routes).
// Usa la Service Role Key, que tiene permisos totales: nunca debe
// exponerse al navegador ni usarse en un componente "use client".
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
