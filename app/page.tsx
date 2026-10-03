"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { catalogo, type Producto } from "@/lib/catalog";
import type { ItemCarrito } from "@/lib/types";

type PatinadorPropio = { nombre: string; grupo: string | null };

export default function TiendaPage() {
  const router = useRouter();
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [telefono, setTelefono] = useState("");
  const [patinadores, setPatinadores] = useState<PatinadorPropio[]>([]);
  const [patinadorNombre, setPatinadorNombre] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(async (r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setTelefono(data.telefono);
        setPatinadores(data.patinadores || []);
        if (data.patinadores?.length === 1) {
          setPatinadorNombre(data.patinadores[0].nombre);
        }
      })
      .finally(() => setCargandoSesion(false));
  }, [router]);

  function agregarAlCarrito(item: ItemCarrito) {
    setCarrito((prev) => [...prev, item]);
  }

  function quitarDelCarrito(index: number) {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const total = carrito.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);

  async function irAPagar() {
    setError(null);
    if (!patinadorNombre) {
      setError("Por favor, selecciona el patinador/a antes de continuar.");
      return;
    }
    if (carrito.length === 0) {
      setError("El carrito está vacío.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patinador: patinadorNombre,
          items: carrito,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar el pago");
      setEnviando(false);
    }
  }

  if (cargandoSesion) {
    return <div className="p-8 text-center text-black/50">Cargando…</div>;
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-[var(--flip-black)] text-white py-8 px-4 text-center relative">
        <button
          onClick={cerrarSesion}
          className="absolute top-4 right-4 text-xs text-white/60 hover:text-white underline"
        >
          Cerrar sesión ({telefono})
        </button>
        <p className="uppercase tracking-[0.3em] text-xs text-[var(--flip-pink)] mb-2">
          Temporada 2026-2027
        </p>
        <h1 className="text-3xl font-bold">Club Patinaje Flip</h1>
        <p className="text-white/70 mt-1">Tienda de equipación</p>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 mb-8">
            <h2 className="font-semibold text-lg mb-3">1. ¿Para quién es el pedido?</h2>
            <select
              className="border rounded-lg px-3 py-2 w-full sm:w-auto"
              value={patinadorNombre}
              onChange={(e) => setPatinadorNombre(e.target.value)}
            >
              <option value="">Selecciona el patinador/a</option>
              {patinadores.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.nombre}
                  {p.grupo ? ` (${p.grupo})` : ""}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-3">2. Elige el material</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {catalogo.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onAdd={agregarAlCarrito}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 h-fit bg-white rounded-2xl shadow-sm border border-black/5 p-5">
          <h2 className="font-semibold text-lg mb-3">Tu pedido</h2>
          {carrito.length === 0 && (
            <p className="text-sm text-black/50">Todavía no has añadido nada.</p>
          )}
          <ul className="flex flex-col gap-3 mb-4">
            {carrito.map((item, i) => (
              <li key={i} className="text-sm border-b pb-2 flex justify-between gap-2">
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-black/60">
                    Talla {item.talla}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.personalizacion ? ` · Bordado: ${item.personalizacion}` : ""}
                    {" · "}x{item.cantidad}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span>{(item.precioUnitario * item.cantidad).toFixed(2)}€</span>
                  <button
                    onClick={() => quitarDelCarrito(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold mb-4">
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
              {error}
            </p>
          )}
          <button
            onClick={irAPagar}
            disabled={enviando}
            className="w-full bg-[var(--flip-pink-dark)] hover:bg-[var(--flip-black)] transition-colors text-white font-medium rounded-lg py-3 disabled:opacity-50"
          >
            {enviando ? "Redirigiendo al pago..." : "Ir a pagar"}
          </button>
          <p className="text-xs text-black/40 mt-2">
            Pago seguro con tarjeta a través de Stripe.
          </p>
        </aside>
      </main>

      <footer className="text-center text-xs text-black/40 py-6">
        Club Patinaje Flip · pedidos.clubpatinajeflip@gmail.com · +34 642 24 68 50
      </footer>
    </div>
  );
}

function ProductoCard({
  producto,
  onAdd,
}: {
  producto: Producto;
  onAdd: (item: ItemCarrito) => void;
}) {
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState(producto.colores?.[0] ?? "");
  const [personalizacion, setPersonalizacion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);

  function handleAdd() {
    if (!talla) {
      setAviso("Elige una talla");
      return;
    }
    setAviso(null);
    onAdd({
      productoId: producto.id,
      nombre: producto.nombre,
      talla,
      color: producto.colores ? color : undefined,
      personalizacion:
        producto.personalizable && personalizacion ? personalizacion : undefined,
      cantidad,
      precioUnitario: producto.precio,
    });
    setTalla("");
    setPersonalizacion("");
    setCantidad(1);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden flex flex-col">
      <div className="relative w-full aspect-square bg-[var(--flip-pink)]">
        <Image
          src={producto.imagen}
          alt={producto.nombre}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover"
          loading="eager"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{producto.nombre}</h3>
          <span className="font-semibold whitespace-nowrap">{producto.precio}€</span>
        </div>
        <p className="text-xs text-black/60">{producto.descripcion}</p>

        <select
          className="border rounded-lg px-2 py-1.5 text-sm mt-1"
          value={talla}
          onChange={(e) => setTalla(e.target.value)}
        >
          <option value="">Talla</option>
          {producto.tallas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {producto.colores && (
          <select
            className="border rounded-lg px-2 py-1.5 text-sm"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {producto.colores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {producto.personalizable && (
          <input
            className="border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Nombre a bordar (opcional)"
            value={personalizacion}
            onChange={(e) => setPersonalizacion(e.target.value)}
            maxLength={20}
          />
        )}

        <div className="flex items-center gap-2 mt-1">
          <label className="text-sm text-black/60">Cantidad</label>
          <input
            type="number"
            min={1}
            max={10}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            className="border rounded-lg px-2 py-1 w-16 text-sm"
          />
        </div>

        {aviso && <p className="text-xs text-red-600">{aviso}</p>}

        <button
          onClick={handleAdd}
          className="mt-auto bg-[var(--flip-black)] text-white rounded-lg py-2 text-sm font-medium hover:bg-[var(--flip-pink-dark)] transition-colors"
        >
          Añadir al pedido
        </button>
      </div>
    </div>
  );
}
