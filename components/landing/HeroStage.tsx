// components/landing/HeroStage.tsx — La scène du haut de page
//
// Le tableau de bord (reconstitué, components/landing/AppMock) posé en perspective,
// et le téléphone du client avec le vrai formulaire. Au défilement, la fenêtre se
// redresse et vient à plat face au lecteur : on « entre » dans le produit.
//
// Règles : le défilement n'est jamais capté (la page suit le doigt) ; seuls
// transform et opacity bougent ; « réduire les animations » → tout est à plat.

"use client";

import { useEffect, useRef, useState } from "react";
import AppMock, { MOCK_W, MOCK_H } from "./AppMock";
import KycPhone, { PHONE_SCREEN_W, PHONE_SCREEN_H } from "./KycPhone";

export default function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);

  /* La fenêtre est dessinée à taille fixe puis mise à l'échelle de sa colonne. */
  useEffect(() => {
    const el = winRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / MOCK_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --p : 0 tant que la scène est basse dans l'écran, 1 quand elle arrive en haut. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (vh * 0.86 - top) / (vh * 0.62)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={stageRef} className="hs" style={{ "--p": 0 } as React.CSSProperties}>
      <div className="hs-tilt">
        <div className="hs-window">
          <div className="hs-chrome" aria-hidden="true">
            <span /><span /><span />
            <div className="hs-url">klaris-app.fr/dashboard</div>
          </div>
          <div ref={winRef} className="hs-viewport" style={{ height: MOCK_H * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: MOCK_W, height: MOCK_H }}>
              <AppMock />
            </div>
          </div>
        </div>
      </div>

      <div className="hs-phone" style={{ "--pw": PHONE_SCREEN_W, "--ph": PHONE_SCREEN_H } as React.CSSProperties}>
        <KycPhone interval={2800} />
      </div>
    </div>
  );
}
