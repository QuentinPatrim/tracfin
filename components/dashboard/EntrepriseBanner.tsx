// components/dashboard/EntrepriseBanner.tsx — Invitation à configurer le profil d'entreprise
//
// Autonome : vérifie via l'API si un profil de conformité existe pour le scope
// courant. S'il n'existe pas → bannière d'onboarding (jamais bloquante, se
// masque définitivement une fois le profil créé ; « Plus tard » = masqué pour
// la session via sessionStorage).

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "klaris-entreprise-banner-dismissed";

export default function EntrepriseBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch { /* sessionStorage indisponible */ }
    (async () => {
      try {
        const res = await fetch("/api/entreprise/profile");
        if (!res.ok) return; // 401/500 → pas de bannière
        const data = await res.json();
        if (data.profile === null && !data.needsMigration) setShow(true);
      } catch { /* réseau — silencieux */ }
    })();
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
    setShow(false);
  };

  return (
    <div
      style={{
        margin: "16px 28px 0",
        padding: "14px 18px",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.04))",
        border: "1px solid rgba(124,58,237,0.22)",
      }}
    >
      <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(236,72,153,0.10))", border: "1px solid rgba(124,58,237,0.25)", color: "#6d28d9" }}>
        <Building2 size={17} />
      </span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
          Configurez votre profil de conformité
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 1, lineHeight: 1.45 }}>
          Klaris analyse votre entreprise (registre officiel) et vos activités pour vous dire
          quoi surveiller en priorité — 2 minutes.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href="/dashboard/entreprise"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 6px 16px rgba(124,58,237,0.28)" }}
        >
          Configurer <ArrowRight size={13} />
        </Link>
        <button
          onClick={dismiss}
          aria-label="Plus tard"
          title="Plus tard"
          style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: "none", border: "1px solid rgba(15,23,42,0.10)", color: "#94a3b8", cursor: "pointer" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
