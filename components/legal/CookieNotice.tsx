// components/legal/CookieNotice.tsx — Bandeau d'information cookies (non-bloquant)
// Cookies strictement nécessaires uniquement → pas de consentement à recueillir,
// mais transparence assumée via ce bandeau discret.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "klaris-cookie-notice";
const STORAGE_VERSION = "v1"; // bump = re-affichage du bandeau

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== STORAGE_VERSION) {
        // Petite tempo pour ne pas flasher au chargement initial
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch { /* storage indisponible → on affiche par défaut */ setVisible(true); }
  }, []);

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, STORAGE_VERSION); } catch { /* noop */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Information cookies"
      className="klaris-public"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 620,
          width: "100%",
          background: "var(--lp-card-bg)",
          border: "1px solid var(--lp-border-2)",
          borderRadius: 10,
          padding: "12px 12px 12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 18px 40px -22px rgba(10,6,40,0.55)",
          color: "var(--lp-text-3)",
        }}
      >
        <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
          Klaris utilise uniquement des cookies{" "}
          <strong style={{ color: "var(--lp-text)", fontWeight: 600 }}>strictement nécessaires</strong>{" "}
          au fonctionnement du service (session, paiement). Aucun traceur tiers, aucun outil publicitaire.{" "}
          <Link href="/legal/cookies" className="kl-link">
            En savoir plus
          </Link>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le bandeau d'information cookies"
          className="kl-nav__icon"
          style={{ color: "var(--lp-text-2)", flexShrink: 0 }}
        >
          <X width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
