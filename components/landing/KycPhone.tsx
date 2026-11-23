// components/landing/KycPhone.tsx — Le téléphone du client, avec le VRAI formulaire
//
// Affiche /kyc/demo (le formulaire client réel, en mode démonstration : pré-rempli,
// aucun appel réseau) dans un cadre de téléphone. Quand `playing` est vrai, les
// étapes du formulaire défilent seules, au rythme de `interval`.
// Dialogue avec l'iframe : voir app/kyc/demo/page.tsx (ping / ready / step / theme).

"use client";

import { useEffect, useRef, useState } from "react";

export const PHONE_SCREEN_W = 384;
export const PHONE_SCREEN_H = 780;

/* Étapes jouées (numérotation du formulaire, de 1 à 7). */
const PLAY = [1, 2, 3, 4, 5, 6, 7];

export default function KycPhone({
  playing = true,
  interval = 2600,
  className = "",
  title = "Le formulaire reçu par le client (exemple fictif)",
}: {
  playing?: boolean;
  interval?: number;
  className?: string;
  title?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    if (ready) return;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.type === "klaris-demo-ready") setReady(true);
    };
    window.addEventListener("message", onMsg);
    // Si l'iframe était prête avant nous, son signal est passé : on le redemande.
    const ping = window.setInterval(() => {
      ref.current?.contentWindow?.postMessage({ type: "klaris-demo-ping" }, "*");
    }, 400);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearInterval(ping);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const w = ref.current?.contentWindow;
    w?.postMessage({ type: "klaris-demo-theme", theme: "light" }, "*");
    w?.postMessage({ type: "klaris-demo-step", step: PLAY[idx.current] }, "*");
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      idx.current = (idx.current + 1) % PLAY.length;
      ref.current?.contentWindow?.postMessage({ type: "klaris-demo-step", step: PLAY[idx.current] }, "*");
    }, interval);
    return () => window.clearInterval(t);
  }, [ready, playing, interval]);

  return (
    <div className={`kl-phone ${className}`} aria-hidden="true">
      <div className="kl-phone__screen" style={{ width: PHONE_SCREEN_W, height: PHONE_SCREEN_H }}>
        <iframe
          ref={ref}
          src="/kyc/demo"
          title={title}
          tabIndex={-1}
          scrolling="no"
          style={{ width: PHONE_SCREEN_W, height: PHONE_SCREEN_H, border: 0, pointerEvents: "none", opacity: ready ? 1 : 0, transition: "opacity 400ms ease" }}
        />
        <span className="kl-phone__island" />
      </div>
    </div>
  );
}
