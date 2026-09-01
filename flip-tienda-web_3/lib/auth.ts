import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Hashea una contraseña con scrypt (sin dependencias externas).
// Formato guardado: "salt:hash" (ambos en hexadecimal).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  if (candidate.length !== hashBuffer.length) return false;
  return timingSafeEqual(candidate, hashBuffer);
}

export function generarTokenSesion(): string {
  return randomBytes(32).toString("hex");
}
