import type { MetadataRoute } from "next";

// Minimal installable app: no service worker, so nothing is cached offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeOne",
    short_name: "we1",
    description: "Odamlarni toping. Birga yarating. Birga o'sing.",
    lang: "uz",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#08070D",
    theme_color: "#08070D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
