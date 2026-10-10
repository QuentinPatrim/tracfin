// components/landing/KycPhonePreview.tsx — Le VRAI formulaire client dans un téléphone
//
// Affiche /kyc/demo (le vrai KycPublicForm en mode démo) dans un iframe mis à
// l'échelle, inséré dans une maquette de smartphone. Les étapes défilent
// automatiquement (postMessage) pour donner vie à l'aperçu. Non-interactif :
// c'est exactement ce que perçoit le client, en lecture seule.

"use client";

import { useEffect, useRef, useState } from "react";

const IFRAME_W = 384;
const IFRAME_H = 760;
const SCALE = 0.72;
const STEP_COUNT = 5;     // on fait défiler les premières étapes (identité → pièces)
const STEP_MS = 3400;

export default function KycPhonePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "klaris-demo-ready") setReady(true);
    };
    window.addEventListener("message", onMsg);
    // Si l'iframe était prête avant nous, son signal est déjà passé : on le redemande.
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-ping" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Pousse l'étape courante à l'iframe.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-step", step }, "*");
  }, [step, ready]);

  // Synchronise le thème de l'iframe avec celui de la landing (au prêt + à chaque
  // bascule clair/sombre via le bouton de thème).
  useEffect(() => {
    if (!ready) return;
    const postTheme = () => {
      const t = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-theme", theme: t }, "*");
    };
    postTheme();
    const obs = new MutationObserver(postTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [ready]);

  // Défilement automatique une fois l'iframe prête.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEP_COUNT), STEP_MS);
    return () => clearInterval(id);
  }, [ready]);

  const visW = Math.round(IFRAME_W * SCALE);
  const visH = Math.round(IFRAME_H * SCALE);

  return (
    <div
      style={{
        width: visW + 16,
        padding: 8,
        borderRadius: 38,
        background: "#0E0B20",
        boxShadow: "0 36px 60px -30px rgba(10,6,40,0.60), 0 14px 26px -16px rgba(10,6,40,0.40)",
        position: "relative",
      }}
    >
      {/* encoche */}
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 74, height: 16, background: "#0E0B20", borderRadius: "0 0 12px 12px", zIndex: 2 }} />
      <div
        style={{
          width: visW,
          height: visH,
          borderRadius: 30,
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
            pointerEvents: "none",
          }}
        />
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#06070D" }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "3px solid rgba(180,168,255,0.25)", borderTopColor: "#B4A8FF",
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
