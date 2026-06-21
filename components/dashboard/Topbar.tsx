// components/dashboard/Topbar.tsx — Top header full-width (absorbe la sidebar)
// Structure :
//  Row 1 : Brand · Nav · [Subscription status] · Guide · UserButton
//  Row 2 : Eyebrow + titre + sub-title | Search + "Nouveau dossier"

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Search, Plus, Lock, ShieldCheck, Folder, CreditCard, HelpCircle, Sparkles, UserCog, ShieldAlert, Plug, UserCheck, Compass,
} from "lucide-react";
import { UserButton, OrganizationSwitcher, useAuth } from "@clerk/nextjs";
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
  currentScreen?: "dossiers" | "tarifs" | "cartographie" | "integrations" | "validations";
}

export default function Topbar({
  title, subtitle, query, onQueryChange, newHref, canCreate, subscription, currentScreen = "dossiers",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Contexte org : la validation 4-yeux (correspondant LCB-FT) n'a de sens
  // qu'en organisation. En compte perso, on masque l'onglet.
  const { orgId } = useAuth();

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
            title="Vos clients et le suivi de leurs dossiers KYC (création, analyse, attestation)"
          >
            <Folder width={13} height={13} />
            <span>Dossiers</span>
          </Link>
          <Link
            href="/dashboard/cartographie"
            data-tour="nav-cartographie"
            className={`topbar-v2-nav-link ${currentScreen === "cartographie" ? "active" : ""}`}
            title="Cartographie des risques L.561-4-1 — document à présenter en contrôle DGCCRF"
          >
            <ShieldAlert width={13} height={13} />
            <span>Cartographie</span>
          </Link>
          {orgId && (
            <Link
              href="/dashboard/validations"
              className={`topbar-v2-nav-link ${currentScreen === "validations" ? "active" : ""}`}
              title="Validation des dossiers à risque par le correspondant LCB-FT (L.561-32)"
            >
              <UserCheck width={13} height={13} />
              <span>Validations</span>
            </Link>
          )}
          <Link
            href="/dashboard/integrations"
            className={`topbar-v2-nav-link ${currentScreen === "integrations" ? "active" : ""}`}
            title="Connectez votre CRM (Hektor, Apimo…) pour automatiser la création des dossiers KYC"
          >
            <Plug width={13} height={13} />
            <span>Intégrations</span>
          </Link>
          <Link
            href="/abonnement"
            className="topbar-v2-nav-link"
            title="Votre formule, vos factures et la gestion de l'abonnement"
          >
            <UserCog width={13} height={13} />
            <span>Abonnement</span>
          </Link>
          <Link
            href="/tarifs"
            className={`topbar-v2-nav-link ${currentScreen === "tarifs" ? "active" : ""}`}
            title="Comparer les formules Pro et Agence"
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
            onClick={() => window.dispatchEvent(new CustomEvent("klaris:start-tour"))}
            className="topbar-v2-icon-btn"
            aria-label="Revoir la visite guidée de l'interface"
            title="Revoir la visite guidée"
          >
            <Compass width={15} height={15} />
          </button>
          <button
            type="button"
            data-tour="help"
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
          <div className="search" data-tour="search">
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
            data-tour="new-dossier"
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
