// components/landing/PdfPreviewFrame.tsx — Aperçu fidèle des PDF Klaris
//
// Affiche le VRAI document (attestation ou fiche KYC) rendu par les routes
// /pdf-render/*/demo, dans un cadre « papier ». Iframe same-origin, non
// interactive, mise à l'échelle responsive. Le document est blanc → s'intègre
// aussi bien en thème clair que sombre (comme un vrai PDF posé sur la page).

"use client";

import { useEffect, useRef, useState } from "react";

const A4_W = 794;   // largeur d'une page A4 en px CSS (210mm @96dpi)
const A4_H = 1123;  // hauteur d'une page A4 en px CSS (297mm @96dpi)

type Doc = "attestation" | "kyc";

export default function PdfPreviewFrame({ compact = false }: { compact?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<Doc>("attestation");
  const [scale, setScale] = useState(0.42);

  // Échelle responsive : la page A4 remplit la largeur du cadre (jamais agrandie
  // au-delà de 1). Le cadre lui-même est plafonné (cf. MAX_W) → le document reste
  // un portrait lisible, jamais étiré sur toute la largeur.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / A4_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageH = Math.round(A4_H * scale);
  // En mode compact (hero), on plafonne la hauteur visible : on montre le haut du
  // document (en-tête + titre + verdict — l'essentiel), le reste est suggéré par le fondu.
  const visibleH = compact ? Math.min(pageH, 540) : pageH;
  const src = doc === "attestation" ? "/pdf-render/attestation/demo" : "/pdf-render/kyc/demo";

  const tab = (key: Doc, label: string) => {
    const active = doc === key;
    return (
      <button
        type="button"
        onClick={() => setDoc(key)}
        aria-pressed={active}
        className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition"
        style={
          active
            ? { background: "var(--lp-cta-grad)", color: "#fff", boxShadow: "var(--lp-cta-shadow)" }
            : { background: "var(--lp-surface)", color: "var(--lp-text-3)", border: "1px solid var(--lp-border-2)" }
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 460, marginInline: "auto", width: "100%" }}>
      <div className="flex items-center gap-2 mb-4">
        {tab("attestation", "Attestation de conformité")}
        {tab("kyc", "Fiche KYC")}
      </div>

      {/* Cadre « papier » */}
      <div
        ref={wrapRef}
        style={{
          position: "relative",
          width: "100%",
          height: visibleH,
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
          border: "1px solid var(--lp-border-2)",
          boxShadow: "0 30px 80px -28px rgba(20,22,43,0.55), 0 10px 28px -10px rgba(20,22,43,0.30)",
        }}
      >
        <iframe
          key={doc}
          src={src}
          title="Aperçu du document Klaris"
          tabIndex={-1}
          scrolling="no"
          loading="lazy"
          style={{
            width: A4_W,
            height: A4_H,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
        {/* Dégradé bas : suggère que le document continue (4 pages au total) */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 64,
            background: "linear-gradient(to bottom, rgba(255,255,255,0), #fff)",
            pointerEvents: "none",
          }}
        />
        {/* Pastille « page 1 » */}
        <div
          style={{
            position: "absolute", right: 12, bottom: 10,
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#7A7592", background: "rgba(255,255,255,0.85)",
            border: "1px solid #EDE9F4", borderRadius: 999, padding: "3px 9px",
          }}
        >
          Aperçu · page 1
        </div>
      </div>

      <div className="mt-3 text-[12px]" style={{ color: "var(--lp-text-4)" }}>
        Document réel généré par Klaris — exemple fictif « Camille Rousseau ». Horodaté, signé SHA-256, opposable.
      </div>
    </div>
  );
}
