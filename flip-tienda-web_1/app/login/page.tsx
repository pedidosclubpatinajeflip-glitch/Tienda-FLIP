"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--flip-black)] px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
        <p className="uppercase tracking-[0.3em] text-xs text-[var(--flip-pink-dark)] mb-1">
          Club Patinaje Flip
        </p>
        <h1 className="text-xl font-bold mb-5">Entrar a la tienda</h1>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Tu email"
            className="border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
          />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button
          onClick={entrar}
          disabled={enviando}
          className="w-full bg-[var(--flip-black)] text-white rounded-lg py-2.5 font-medium mt-4 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm text-center text-black/60 mt-4">
          ¿Todavía no tienes cuenta?{" "}
          <Link href="/registro" className="text-[var(--flip-pink-dark)] font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
