// components/dashboard/Topbar.tsx — Top header full-width (absorbe la sidebar)
// Structure :
//  Row 1 : Brand · Nav · [Subscription status] · Guide · UserButton
//  Row 2 : Eyebrow + titre + sub-title | Search + "Nouveau dossier"

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Search, Plus, Lock, ShieldCheck, Folder, CreditCard, HelpCircle, Sparkles, UserCog,
} from "lucide-react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";

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
  currentScreen?: "dossiers" | "tarifs";
}

export default function Topbar({
  title, subtitle, query, onQueryChange, newHref, canCreate, subscription, currentScreen = "dossiers",
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
      {/* ─── ROW 1 : Brand · Nav · Status · Actions ──────────────── */}
      <div className="topbar-v2-row1">
        <Link href="/dashboard" className="topbar-v2-brand">
          <KlarisLogo size={32} />
          <span className="topbar-v2-brand-name">Klaris</span>
        </Link>

        <nav className="topbar-v2-nav">
          <Link
            href="/dashboard"
            className={`topbar-v2-nav-link ${currentScreen === "dossiers" ? "active" : ""}`}
          >
            <Folder width={13} height={13} />
            <span>Dossiers</span>
          </Link>
          <Link
            href="/abonnement"
            className="topbar-v2-nav-link"
          >
            <UserCog width={13} height={13} />
            <span>Abonnement</span>
          </Link>
          <Link
            href="/tarifs"
            className={`topbar-v2-nav-link ${currentScreen === "tarifs" ? "active" : ""}`}
          >
            <CreditCard width={13} height={13} />
            <span>Tarifs</span>
          </Link>
        </nav>

        <div className="topbar-v2-actions">
          <SubscriptionBadge subscription={subscription} />
          {/*
            OrganizationSwitcher Clerk : permet de basculer entre "compte perso"
            (= scope.orgId NULL côté serveur) et l'une de ses orgs Agence. Le
            switch déclenche un refresh du token Clerk → tous les SSR repassent
            par getScope() avec le bon orgId. hidePersonal={false} maintient
            l'accès au plan Pro perso même quand l'utilisateur est membre d'orgs.
          */}
          <OrganizationSwitcher
            hidePersonal={false}
            afterSelectOrganizationUrl="/dashboard"
            afterSelectPersonalUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("klaris:open-guide"))}
            className="topbar-v2-icon-btn"
            aria-label="Ouvrir le guide LCB-FT"
            title="Guide LCB-FT"
          >
            <HelpCircle width={15} height={15} />
          </button>
          <UserButton />
        </div>
      </div>

      {/* ─── ROW 2 : Titre + meta | Search + New ─────────────────── */}
      <div className="topbar-v2-row2">
        <div className="topbar-v2-title-block">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-semibold mb-1.5"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.18)",
              color: "#6d28d9",
              width: "fit-content",
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: "#7c3aed" }} />
            Pilotage LCB-FT
          </div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub muted">{subtitle}</p>}
        </div>

        <div className="topbar-v2-tools">
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
          <Link
            href={newHref}
            className={`btn-grad ${canCreate ? "" : "locked"}`}
            title={canCreate ? "Créer un nouveau dossier" : "Souscrivez pour créer de nouveaux dossiers"}
          >
            {canCreate ? <Plus width={14} height={14} /> : <Lock width={14} height={14} />}
            <span>{canCreate ? "Nouveau dossier" : "Souscrire"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Badge subscription compact (ex-Sidebar trial card) ─── */
function SubscriptionBadge({ subscription }: { subscription: SubInfo }) {
  if (subscription.isTrialing && subscription.daysLeft !== null) {
    const urgent = subscription.daysLeft <= 3;
    return (
      <Link
        href="/abonnement"
        className="topbar-v2-sub-badge"
        style={{
          background: urgent ? "rgba(245,158,11,0.08)" : "rgba(124,58,237,0.06)",
          borderColor: urgent ? "rgba(245,158,11,0.30)" : "rgba(124,58,237,0.22)",
          color: urgent ? "#b45309" : "#6d28d9",
        }}
        title="Voir les tarifs"
      >
        <Sparkles width={12} height={12} />
        <span className="font-semibold">
          {subscription.daysLeft > 0
            ? `${subscription.daysLeft}j d'essai`
            : "Essai terminé aujourd'hui"}
        </span>
      </Link>
    );
  }

  if (subscription.state === "expired") {
    return (
      <Link
        href="/abonnement"
        className="topbar-v2-sub-badge"
        style={{
          background: "rgba(220,38,38,0.08)",
          borderColor: "rgba(220,38,38,0.30)",
          color: "#b91c1c",
        }}
      >
        <Lock width={12} height={12} />
        <span className="font-semibold">Souscrire</span>
      </Link>
    );
  }

  if (subscription.state === "active") {
    return (
      <Link
        href="/abonnement"
        className="topbar-v2-sub-badge"
        style={{
          background: "rgba(16,185,129,0.06)",
          borderColor: "rgba(16,185,129,0.30)",
          color: "#047857",
        }}
        title="Gérer mon abonnement"
      >
        <ShieldCheck width={12} height={12} />
        <span className="font-semibold">Abonné</span>
      </Link>
    );
  }

  return null;
}
