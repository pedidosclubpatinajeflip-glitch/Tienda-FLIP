import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tienda Club Patinaje Flip",
  description: "Pide el material del Club Patinaje Flip - Temporada 2026-2027",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
