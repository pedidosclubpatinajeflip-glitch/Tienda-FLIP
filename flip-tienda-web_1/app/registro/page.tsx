"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const router = useRouter();
  const [nombres, setNombres] = useState<string[]>([""]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarNombre(i: number, valor: string) {
    setNombres((prev) => prev.map((n, idx) => (idx === i ? valor : n)));
  }

  function anadirPatinador() {
    setNombres((prev) => [...prev, ""]);
  }

  function quitarPatinador(i: number) {
    setNombres((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function registrar() {
    setError(null);

    const nombresLimpios = nombres.map((n) => n.trim()).filter(Boolean);
    if (nombresLimpios.length === 0) {
      setError("Indica el nombre de al menos un patinador/a.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, patinadores: nombresLimpios }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo completar el registro");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--flip-black)] px-4 py-10">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
        <p className="uppercase tracking-[0.3em] text-xs text-[var(--flip-pink-dark)] mb-1">
          Club Patinaje Flip
        </p>
        <h1 className="text-xl font-bold mb-1">Crear cuenta</h1>
        <p className="text-sm text-black/50 mb-5">
          Escribe el nombre de tu hijo/a tal y como aparece en Klubber. Si
          tienes más de un hijo/a en el club, añade uno por cada uno.
        </p>

        <div className="flex flex-col gap-2 mb-2">
          {nombres.map((nombre, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 flex-1"
                placeholder="Nombre y apellido del patinador/a"
                value={nombre}
                onChange={(e) => actualizarNombre(i, e.target.value)}
              />
              {nombres.length > 1 && (
                <button
                  onClick={() => quitarPatinador(i)}
                  className="text-red-500 text-sm px-2"
                  type="button"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={anadirPatinador}
          type="button"
          className="text-sm text-[var(--flip-pink-dark)] font-medium mb-4"
        >
          + Añadir otro hijo/a
        </button>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Tu email (será tu usuario)"
            className="border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            className="border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Repite la contraseña"
            className="border rounded-lg px-3 py-2"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registrar()}
          />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button
          onClick={registrar}
          disabled={enviando}
          className="w-full bg-[var(--flip-black)] text-white rounded-lg py-2.5 font-medium mt-4 disabled:opacity-50"
        >
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-sm text-center text-black/60 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--flip-pink-dark)] font-medium">
            Entra aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
