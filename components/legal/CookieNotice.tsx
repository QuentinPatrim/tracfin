// components/legal/CookieNotice.tsx — Bandeau d'information cookies (non-bloquant)
// Cookies strictement nécessaires uniquement → pas de consentement à recueillir,
// mais transparence assumée via ce bandeau discret.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

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
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 640,
          width: "100%",
          background: "rgba(11, 11, 26, 0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(124,58,237,0.30)",
          borderRadius: 14,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset",
          color: "white",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.18))",
            border: "1px solid rgba(124,58,237,0.40)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Cookie width={15} height={15} style={{ color: "#c4b5fd" }} />
        </div>
        <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
          Klaris utilise uniquement des cookies <strong style={{ color: "white", fontWeight: 600 }}>strictement nécessaires</strong> au fonctionnement du service (session, paiement). Aucun tracker tiers, aucun outil publicitaire.{" "}
          <Link
            href="/legal/cookies"
            style={{ color: "#c4b5fd", textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            En savoir plus
          </Link>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le bandeau d'information cookies"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.70)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            transition: "background .15s, border-color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
          }}
        >
          <X width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
