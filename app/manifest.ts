// app/manifest.ts — Klaris installable sur l'écran d'accueil (application web)
//
// L'application s'ouvre sur /app : la connexion s'y fait sans quitter Klaris, puis on
// arrive sur les dossiers. Icônes générées depuis le monogramme : public/pwa/.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Klaris — dossiers LCB-FT",
    short_name: "Klaris",
    description: "Créez et suivez vos dossiers LCB-FT depuis votre téléphone.",
    lang: "fr",
    dir: "ltr",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F7FF",
    theme_color: "#F5F7FF",
    categories: ["business", "productivity"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Nouveau dossier",
        short_name: "Nouveau",
        url: "/dashboard/nouveau",
        icons: [{ src: "/pwa/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Mes dossiers",
        short_name: "Dossiers",
        url: "/dashboard",
        icons: [{ src: "/pwa/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
