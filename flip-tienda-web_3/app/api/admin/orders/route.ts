import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import type { ItemCarrito } from "@/lib/types";

function noAutorizado(req: NextRequest) {
  const cookie = req.cookies.get("flip_admin")?.value;
  return !cookie || cookie !== process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (noAutorizado(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ pedidos: [] });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formato = req.nextUrl.searchParams.get("format");

  if (formato === "csv") {
    const filas = [
      [
        "Fecha",
        "Estado",
        "Patinador",
        "Grupo",
        "Contacto",
        "Artículo",
        "Talla",
        "Color",
        "Personalización",
        "Cantidad",
        "Precio unidad",
        "Total pedido",
      ],
    ];
    for (const pedido of data) {
      const items = (pedido.items as ItemCarrito[]) || [];
      for (const item of items) {
        filas.push([
          new Date(pedido.creado_en).toLocaleString("es-ES"),
          pedido.estado,
          pedido.patinador,
          pedido.grupo || "",
          pedido.contacto || "",
          item.nombre,
          item.talla,
          item.color || "",
          item.personalizacion || "",
          String(item.cantidad),
          item.precioUnitario.toFixed(2),
          Number(pedido.total).toFixed(2),
        ]);
      }
    }
    const csv = filas
      .map((fila) =>
        fila.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pedidos-flip-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ pedidos: data });
}
