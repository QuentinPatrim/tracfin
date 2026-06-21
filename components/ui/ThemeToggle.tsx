// components/ui/ThemeToggle.tsx — Bascule clair/sombre pour les pages publiques.
//
// Le thème est stocké sur <html data-theme="light|dark"> (script anti-FOUC dans
// app/layout.tsx). Ce bouton lit l'attribut courant, le bascule, et mémorise le
// choix dans localStorage("klaris-theme"). Sans choix mémorisé, le défaut suit la
// préférence système (géré par le script de layout).

"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // On lit le thème réel appliqué par le script anti-FOUC après le montage,
  // pour éviter tout décalage d'hydratation.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("klaris-theme", next);
    } catch {
      /* localStorage indisponible (mode privé strict) — bascule visuelle quand même */
    }
    setTheme(next);
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
      title={isLight ? "Mode sombre" : "Mode clair"}
      className={`grid place-items-center w-9 h-9 rounded-full transition ${className}`}
      style={{
        background: "var(--lp-surface)",
        border: "1px solid var(--lp-border-2)",
        color: "var(--lp-text-3)",
      }}
    >
      {/* Avant montage (theme === null) : icône neutre pour éviter le flash */}
      {theme === null ? (
        <Moon width={15} height={15} />
      ) : isLight ? (
        <Moon width={15} height={15} />
      ) : (
        <Sun width={15} height={15} />
      )}
    </button>
  );
}
