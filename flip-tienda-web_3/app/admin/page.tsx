"use client";

import { useEffect, useState } from "react";
import { parseRosterFile } from "@/lib/parseRoster";
import type { ItemCarrito } from "@/lib/types";

type Pedido = {
  id: string;
  creado_en: string;
  estado: string;
  patinador: string;
  grupo?: string;
  contacto?: string;
  items: ItemCarrito[];
  total: number;
};

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [comprobando, setComprobando] = useState(true);
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => {
        if (r.ok) setAutenticado(true);
      })
      .finally(() => setComprobando(false));
  }, []);

  async function login() {
    setErrorLogin(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAutenticado(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorLogin(data.error || "No se pudo iniciar sesión");
    }
  }

  if (comprobando) {
    return <div className="p-8 text-center text-black/50">Cargando…</div>;
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--flip-black)] px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold mb-4">Acceso administración</h1>
          <input
            type="password"
            className="border rounded-lg px-3 py-2 w-full mb-3"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {errorLogin && <p className="text-sm text-red-600 mb-3">{errorLogin}</p>}
          <button
            onClick={login}
            className="w-full bg-[var(--flip-black)] text-white rounded-lg py-2 font-medium"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return <PanelAdmin />;
}

function PanelAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeImport, setMensajeImport] = useState<string | null>(null);

  function cargarPedidos() {
    setCargando(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setPedidos(data.pedidos || []))
      .finally(() => setCargando(false));
  }

  useEffect(cargarPedidos, []);

  async function subirExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setMensajeImport(null);
    try {
      const { filas, columnasDetectadas } = await parseRosterFile(file);
      if (filas.length === 0) {
        setMensajeImport(
          "No se ha detectado ninguna fila con nombre. Revisa que el Excel tenga una columna de nombre del patinador."
        );
        return;
      }
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patinadores: filas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensajeImport(
        `Importados ${data.importados} patinadores. Columnas detectadas: nombre="${columnasDetectadas.nombre}", grupo="${columnasDetectadas.grupo ?? "—"}".`
      );
    } catch (err) {
      setMensajeImport(
        err instanceof Error ? err.message : "Error al importar el Excel"
      );
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  const totalPagado = pedidos
    .filter((p) => p.estado === "pagado")
    .reduce((sum, p) => sum + Number(p.total), 0);

  return (
    <div className="min-h-screen bg-black/[.02] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Pedidos - Club Patinaje Flip</h1>
          <div className="flex gap-3">
            <a
              href="/api/admin/orders?format=csv"
              className="bg-[var(--flip-pink-dark)] text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              Descargar CSV
            </a>
            <label className="bg-[var(--flip-black)] text-white rounded-lg px-4 py-2 text-sm font-medium cursor-pointer">
              {subiendo ? "Importando…" : "Actualizar listado (Excel Klubber)"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={subirExcel}
                disabled={subiendo}
              />
            </label>
          </div>
        </div>

        {mensajeImport && (
          <p className="text-sm bg-white border rounded-lg p-3 mb-6">{mensajeImport}</p>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-xs text-black/50">Pedidos totales</p>
            <p className="text-2xl font-bold">{pedidos.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-xs text-black/50">Pagados</p>
            <p className="text-2xl font-bold">
              {pedidos.filter((p) => p.estado === "pagado").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-xs text-black/50">Total cobrado</p>
            <p className="text-2xl font-bold">{totalPagado.toFixed(2)}€</p>
          </div>
        </div>

        {cargando ? (
          <p className="text-black/50">Cargando pedidos…</p>
        ) : pedidos.length === 0 ? (
          <p className="text-black/50">Todavía no hay pedidos.</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[.03] text-left">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Patinador</th>
                  <th className="p-3">Artículos</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-t align-top">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(p.creado_en).toLocaleString("es-ES")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.estado === "pagado"
                            ? "bg-green-100 text-green-700"
                            : p.estado === "cancelado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.patinador}
                      {p.grupo && <span className="text-black/40"> ({p.grupo})</span>}
                      {p.contacto && (
                        <div className="text-xs text-black/40">{p.contacto}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {p.items.map((item, i) => (
                        <div key={i}>
                          {item.cantidad}x {item.nombre} (talla {item.talla}
                          {item.color ? `, ${item.color}` : ""}
                          {item.personalizacion ? `, bordado: ${item.personalizacion}` : ""}
                          )
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {Number(p.total).toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
