import { NextRequest } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "./supabase";

export type Padre = {
  id: string;
  telefono: string;
  patinadores: { nombre: string; grupo: string | null }[];
};

// Recupera al padre/tutor autenticado a partir de la cookie de sesión.
// Devuelve null si no hay sesión válida.
export async function getPadreDeSesion(req: NextRequest): Promise<Padre | null> {
  const token = req.cookies.get("flip_sesion")?.value;
  if (!token || !supabaseConfigured()) return null;

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("padres")
    .select("id, telefono, patinadores")
    .eq("sesion_token", token)
    .maybeSingle();

  if (!data) return null;
  return data as Padre;
}
