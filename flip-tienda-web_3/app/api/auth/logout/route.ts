import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("flip_sesion")?.value;
  if (token && supabaseConfigured()) {
    const supabase = supabaseAdmin();
    await supabase.from("padres").update({ sesion_token: null }).eq("sesion_token", token);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("flip_sesion");
  return res;
}
