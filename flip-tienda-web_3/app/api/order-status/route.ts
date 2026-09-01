import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";

// Consultado por la página de confirmación tras volver de Stripe.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta session_id" }, { status: 400 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ estado: "desconocido" });
  }
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("pedidos")
    .select("estado, patinador, total, items")
    .eq("stripe_session_id", sessionId)
    .single();

  return NextResponse.json({ pedido: data || null });
}
