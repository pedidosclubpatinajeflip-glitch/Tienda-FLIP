import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase";
import { buscarProducto } from "@/lib/catalog";
import { getPadreDeSesion } from "@/lib/session";
import type { ItemCarrito } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const padre = await getPadreDeSesion(req);
    if (!padre) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para hacer un pedido." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const nombrePatinador: string = body.patinador;
    const items: ItemCarrito[] = body.items;

    const patinadorDelPadre = padre.patinadores.find(
      (p) => p.nombre === nombrePatinador
    );
    if (!patinadorDelPadre) {
      return NextResponse.json(
        { error: "Ese patinador/a no está vinculado a tu cuenta." },
        { status: 400 }
      );
    }

    const patinador = patinadorDelPadre.nombre;
    const grupo = patinadorDelPadre.grupo || undefined;
    const contacto = padre.email;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    // Revalidamos precios contra el catálogo real del servidor (nunca
    // nos fiamos del precio que venga del navegador).
    let total = 0;
    const itemsValidados: ItemCarrito[] = [];
    for (const item of items) {
      const producto = buscarProducto(item.productoId);
      if (!producto) {
        return NextResponse.json(
          { error: `Producto desconocido: ${item.productoId}` },
          { status: 400 }
        );
      }
      const cantidad = Math.max(1, Math.min(20, Math.floor(item.cantidad || 1)));
      total += producto.precio * cantidad;
      itemsValidados.push({
        productoId: producto.id,
        nombre: producto.nombre,
        talla: item.talla,
        color: item.color,
        personalizacion: item.personalizacion,
        cantidad,
        precioUnitario: producto.precio,
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "La pasarela de pago todavía no está configurada (falta STRIPE_SECRET_KEY).",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let pedidoId: string | null = null;

    if (supabaseConfigured()) {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from("pedidos")
        .insert({
          patinador,
          grupo: grupo || null,
          contacto: contacto || null,
          items: itemsValidados,
          total,
          estado: "pendiente",
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      pedidoId = data.id;
    }

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "es",
      line_items: itemsValidados.map((item) => ({
        quantity: item.cantidad,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.precioUnitario * 100),
          product_data: {
            name: `${item.nombre} - talla ${item.talla}${
              item.color ? ` - ${item.color}` : ""
            }${item.personalizacion ? ` (bordado: ${item.personalizacion})` : ""}`,
          },
        },
      })),
      metadata: {
        pedido_id: pedidoId || "",
        patinador,
        grupo: grupo || "",
      },
      success_url: `${origin}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?pedido=cancelado`,
    });

    if (pedidoId && supabaseConfigured()) {
      const supabase = supabaseAdmin();
      await supabase
        .from("pedidos")
        .update({ stripe_session_id: session.id })
        .eq("id", pedidoId);
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
