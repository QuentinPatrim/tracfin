// components/landing/ScrollFx.tsx — Effets liés au défilement, hors haut de page
//
// Composant sans rendu. Pour chaque élément marqué data-fx, il écrit une variable
// CSS --fx (0 → 1) qui suit l'entrée de l'élément dans l'écran. Tout le reste est
// en CSS (app/globals.css, bloc « Effets liés au défilement ») : une barre qui se
// déploie, une ligne de tableau qui s'inscrit, un panneau qui s'ouvre.
//
// Sans JavaScript, ou si l'utilisateur demande moins d'animations, --fx n'est pas
// écrit et vaut 1 par défaut : tout est simplement affiché.

"use client";

import { useEffect } from "react";

export default function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-fx]"));
    if (!els.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        // Démarre quand le haut de l'élément arrive à 92 % de l'écran,
        // se termine après une demi-hauteur d'écran de défilement.
        const span = Number(el.dataset.fxSpan || 0.5) * vh;
        const v = Math.min(1, Math.max(0, (vh * 0.92 - top) / span));
        el.style.setProperty("--fx", v.toFixed(3));
      }
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };

    document.documentElement.setAttribute("data-fx-on", "");
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.removeAttribute("data-fx-on");
      els.forEach((el) => el.style.removeProperty("--fx"));
    };
  }, []);

  return null;
}
