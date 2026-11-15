import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ajedrez",
    short_name: "Ajedrez",
    description: "Entrenador diario de ajedrez con repaso espaciado.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#2e5d34",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
