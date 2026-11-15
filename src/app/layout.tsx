import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajedrez",
  description: "Entrenador diario de ajedrez con repaso espaciado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
