// components/landing/PdfPreviewFrame.tsx — Aperçu fidèle des PDF Klaris
//
// Affiche le VRAI document (attestation ou fiche KYC) rendu par les routes
// /pdf-render/*/demo, posé comme une feuille sur le champ d'encre du hero.
// Les deux documents se choisissent par des onglets de dossier. Iframe
// same-origin, non interactive, mise à l'échelle sur la largeur disponible.

"use client";

import { useEffect, useRef, useState } from "react";

const A4_W = 794;   // largeur d'une page A4 en px CSS (210 mm @ 96 dpi)
const A4_H = 1123;  // hauteur d'une page A4 en px CSS (297 mm @ 96 dpi)

type Doc = "attestation" | "kyc";

const DOCS: { key: Doc; label: string; src: string }[] = [
  { key: "attestation", label: "Attestation", src: "/pdf-render/attestation/demo" },
  { key: "kyc", label: "Fiche client", src: "/pdf-render/kyc/demo" },
];

export default function PdfPreviewFrame({
  maxVisible = 640,
  children,
}: {
  /** Hauteur visible maximale de la feuille (le reste est coupé par le bas). */
  maxVisible?: number;
  /** Élément posé par-dessus la feuille (ex. la vignette de vigilance). */
  children?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<Doc>("attestation");
  const [scale, setScale] = useState(0.62);

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
  const visibleH = Math.min(pageH, maxVisible);
  const current = DOCS.find((d) => d.key === doc)!;

  return (
    <div className="relative w-full">
      <div className="kl-tabs" role="tablist" aria-label="Documents générés par Klaris">
        {DOCS.map((d) => (
          <button
            key={d.key}
            type="button"
            role="tab"
            aria-selected={doc === d.key}
            className="kl-tab"
            onClick={() => setDoc(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className="kl-sheet"
        role="tabpanel"
        style={{ height: visibleH, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <iframe
          key={doc}
          src={current.src}
          title={`Aperçu : ${current.label} générée par Klaris (exemple fictif)`}
          tabIndex={-1}
          scrolling="no"
          style={{
            width: A4_W,
            height: A4_H,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
      </div>

      {children}
    </div>
  );
}
