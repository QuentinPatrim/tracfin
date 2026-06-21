// app/global-error.tsx — Filet de sécurité ultime (remplace le layout racine si celui-ci
// plante). Doit rendre son propre <html>/<body> et être autonome (pas de tokens de thème).

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#0A0712",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              fontWeight: 800,
              fontSize: 26,
            }}
          >
            K
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 12px" }}>Erreur inattendue</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: "0 0 28px" }}>
            Une erreur critique est survenue. Réessayez ; si le problème persiste, contactez le support Klaris.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              cursor: "pointer",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 10px 28px rgba(124,58,237,0.35)",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
