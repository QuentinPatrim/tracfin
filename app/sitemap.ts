// app/sitemap.ts — Plan du site (pages publiques uniquement)

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://klaris-app.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{ path: string; priority: number }> = [
    { path: "", priority: 1.0 },
    { path: "/tarifs", priority: 0.9 },
    { path: "/confiance", priority: 0.7 },
    { path: "/securite", priority: 0.7 },
    { path: "/legal/mentions-legales", priority: 0.3 },
    { path: "/legal/confidentialite", priority: 0.3 },
    { path: "/legal/cgu", priority: 0.3 },
    { path: "/legal/cgv", priority: 0.3 },
    { path: "/legal/cookies", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
