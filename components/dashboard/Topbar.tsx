// components/dashboard/Topbar.tsx — Topbar Klaris : titre + search + new + UserButton

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Search, Bell, Plus, Lock } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface Props {
  title: string;
  subtitle?: string;
  query: string;
  onQueryChange: (q: string) => void;
  newHref: string;
  canCreate: boolean;
}

export default function Topbar({ title, subtitle, query, onQueryChange, newHref, canCreate }: Props) {
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
    <header className="topbar">
      <div className="topbar-l">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub muted">{subtitle}</p>}
      </div>

      <div className="topbar-r">
        <div className="search">
          <span className="search-ico"><Search width={14} height={14} /></span>
          <input
            ref={inputRef}
            placeholder="Rechercher un dossier, un client…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </div>
        <button className="icon-btn" title="Notifications" aria-label="Notifications">
          <Bell width={16} height={16} />
        </button>
        <Link
          href={newHref}
          className={`btn-grad ${canCreate ? "" : "locked"}`}
          title={canCreate ? "Créer un nouveau dossier" : "Souscrivez pour créer de nouveaux dossiers"}
        >
          {canCreate ? <Plus width={14} height={14} /> : <Lock width={14} height={14} />}
          <span>{canCreate ? "Nouveau dossier" : "Souscrire pour créer"}</span>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
