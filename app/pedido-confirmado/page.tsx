"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ItemCarrito } from "@/lib/types";

type Pedido = {
  estado: string;
  patinador: string;
  total: number;
  items: ItemCarrito[];
};

function Contenido() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setCargando(false);
      return;
    }
    fetch(`/api/order-status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setPedido(data.pedido))
      .finally(() => setCargando(false));
  }, [sessionId]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-black/5 p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">¡Pedido recibido!</h1>
        {cargando && <p className="text-black/50">Confirmando el pago…</p>}
        {!cargando && pedido && (
          <>
            <p className="text-black/70 mb-4">
              Gracias, hemos registrado el pedido de{" "}
              <strong>{pedido.patinador}</strong> por un total de{" "}
              <strong>{Number(pedido.total).toFixed(2)}€</strong>.
            </p>
            <ul className="text-sm text-left bg-black/[.03] rounded-lg p-4 mb-4">
              {pedido.items.map((item, i) => (
                <li key={i}>
                  {item.cantidad}x {item.nombre} (talla {item.talla})
                </li>
              ))}
            </ul>
          </>
        )}
        {!cargando && !pedido && (
          <p className="text-black/70 mb-4">
            Hemos recibido tu pago. Si tienes cualquier duda, escríbenos a
            pedidos.clubpatinajeflip@gmail.com.
          </p>
        )}
        <Link
          href="/"
          className="inline-block mt-2 text-sm font-medium text-[var(--flip-pink-dark)] hover:underline"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
