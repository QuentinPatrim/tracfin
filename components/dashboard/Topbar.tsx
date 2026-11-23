// components/dashboard/Topbar.tsx — En-tête de l'écran « Dossiers »
//
// La marque, la navigation et l'état de l'abonnement vivent désormais dans la barre
// latérale commune (components/dashboard/AppShell). Ici : le titre de la page, la
// recherche (⌘K), la visite guidée, le guide LCB-FT et « Nouveau dossier ».

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Search, Plus, Lock, HelpCircle, Compass } from "lucide-react";

interface SubInfo {
  isActive: boolean;
  isTrialing: boolean;
  state: string;
  daysLeft: number | null;
}

interface Props {
  title: string;
  subtitle?: string;
  query: string;
  onQueryChange: (q: string) => void;
  newHref: string;
  canCreate: boolean;
  subscription: SubInfo;
  currentScreen?: "dossiers" | "tarifs" | "cartographie" | "integrations" | "validations";
}

export default function Topbar({
  title, subtitle, query, onQueryChange, newHref, canCreate,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K → focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="topbar-v2">
      <div className="topbar-v2-row2">
        <div className="topbar-v2-title-block">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>

        <div className="topbar-v2-tools">
          <div className="search" data-tour="search">
            <span className="search-ico"><Search width={14} height={14} /></span>
            <input
              ref={inputRef}
              placeholder="Rechercher un client…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            <kbd>⌘K</kbd>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("klaris:start-tour"))}
            className="icon-btn"
            aria-label="Revoir la visite guidée de l'interface"
            title="Revoir la visite guidée"
          >
            <Compass width={15} height={15} />
          </button>
          <button
            type="button"
            data-tour="help"
            onClick={() => window.dispatchEvent(new CustomEvent("klaris:open-guide"))}
            className="icon-btn"
            aria-label="Ouvrir le guide LCB-FT"
            title="Guide LCB-FT"
          >
            <HelpCircle width={15} height={15} />
          </button>
          <Link
            href={newHref}
            data-tour="new-dossier"
            className={`btn-grad ${canCreate ? "" : "locked"}`}
            title={canCreate ? "Créer un nouveau dossier" : "Souscrivez pour créer de nouveaux dossiers"}
          >
            {canCreate ? <Plus width={15} height={15} /> : <Lock width={14} height={14} />}
            <span>{canCreate ? "Nouveau dossier" : "Souscrire"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
