// components/dashboard/ClientJourneyFrame.tsx — Le VRAI formulaire client dans un téléphone
//
// Affiche /kyc/demo (le vrai KycPublicForm en mode démo) dans un iframe mis à
// l'échelle, inséré dans une maquette de smartphone élégante. Le tutoriel pilote
// l'étape visible via postMessage. L'iframe est non-interactif (pointer-events
// none) : c'est un aperçu fidèle, le film avance tout seul.

"use client";

import { useEffect, useRef, useState } from "react";

const IFRAME_W = 384;   // largeur "mobile" réelle rendue dans l'iframe
const IFRAME_H = 720;
const SCALE = 0.58;     // mise à l'échelle pour tenir dans la carte du film

export default function ClientJourneyFrame({ step }: { step: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // L'iframe signale qu'elle est prête (page /kyc/demo montée).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "klaris-demo-ready") setReady(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Pousse l'étape courante à l'iframe (au prêt, et à chaque changement d'étape).
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-step", step }, "*");
  }, [step, ready]);

  const visW = Math.round(IFRAME_W * SCALE);
  const visH = Math.round(IFRAME_H * SCALE);

  return (
    <div
      style={{
        width: visW + 16,
        margin: "0 auto",
        padding: 8,
        borderRadius: 34,
        background: "#0b0712",
        boxShadow: "0 26px 60px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(124,58,237,0.22)",
        position: "relative",
      }}
    >
      {/* encoche */}
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 74, height: 16, background: "#0b0712", borderRadius: "0 0 12px 12px", zIndex: 2 }} />
      <div
        style={{
          width: visW,
          height: visH,
          borderRadius: 26,
          overflow: "hidden",
          position: "relative",
          background: "#06070D",
        }}
      >
        <iframe
          ref={iframeRef}
          src="/kyc/demo"
          title="Aperçu du parcours client"
          tabIndex={-1}
          scrolling="no"
          style={{
            width: IFRAME_W,
            height: IFRAME_H,
            border: 0,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            pointerEvents: "none", // non-interactif : le film pilote
          }}
        />
        {/* voile de chargement tant que l'iframe n'a pas signalé "prêt" */}
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#06070D" }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "3px solid rgba(167,139,250,0.25)", borderTopColor: "#a78bfa",
                animation: "klaris-spin 0.7s linear infinite",
              }}
            />
            <style>{`@keyframes klaris-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
