// components/dashboard/Sidebar.tsx — Sidebar Klaris (server-rendered)

import Link from "next/link";
import { ShieldCheck, Folder, CreditCard, Sparkles, Lock } from "lucide-react";

interface Counts {
  conformes: number;
  vigilance: number;
  critique: number;
  total: number;
}

interface SubInfo {
  isActive: boolean;
  isTrialing: boolean;
  state: string;
  daysLeft: number | null;
}

interface Props {
  counts: Counts;
  subscription: SubInfo;
  currentScreen: "dossiers" | "tarifs";
}

export default function Sidebar({ counts, subscription, currentScreen }: Props) {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <div className="brand-mark">
          <ShieldCheck width={18} height={18} />
        </div>
        <div className="brand-name">Klaris</div>
      </Link>

      <div className="side-section-label">Pilotage</div>
      <nav className="side-nav">
        <Link href="/dashboard" className={`side-link ${currentScreen === "dossiers" ? "active" : ""}`}>
          <span className="side-ico"><Folder width={16} height={16} /></span>
          <span className="side-lbl">Dossiers</span>
          <span className="side-count">{counts.total}</span>
        </Link>
        <Link href="/tarifs" className={`side-link ${currentScreen === "tarifs" ? "active" : ""}`}>
          <span className="side-ico"><CreditCard width={16} height={16} /></span>
          <span className="side-lbl">Tarifs</span>
        </Link>
      </nav>

      <div className="side-section-label" style={{ marginTop: 24 }}>Conformité</div>
      <div className="side-stat">
        <div className="side-stat-row">
          <span className="risk-dot" style={{ background: "#10b981" }} />
          <span className="side-stat-label">Conformes</span>
          <span className="side-stat-val">{counts.conformes}</span>
        </div>
        <div className="side-stat-row">
          <span className="risk-dot" style={{ background: "#f59e0b" }} />
          <span className="side-stat-label">Vigilance</span>
          <span className="side-stat-val">{counts.vigilance}</span>
        </div>
        <div className="side-stat-row">
          <span className="risk-dot" style={{ background: "#ef4444" }} />
          <span className="side-stat-label">Critique</span>
          <span className="side-stat-val">{counts.critique}</span>
        </div>
      </div>

      {/* Carte essai / expiré */}
      {subscription.isTrialing && subscription.daysLeft !== null && (
        <div className="trial">
          <div className="trial-h">
            <span className="trial-ico"><Sparkles width={14} height={14} /></span>
            <span>Essai gratuit</span>
          </div>
          <div className="trial-text">
            {subscription.daysLeft > 0
              ? <>{subscription.daysLeft} jour{subscription.daysLeft > 1 ? "s" : ""} restant{subscription.daysLeft > 1 ? "s" : ""} d'accès illimité.</>
              : <>Votre essai se termine aujourd'hui.</>}
          </div>
          <Link href="/tarifs" className="btn-grad small block">Choisir un plan</Link>
        </div>
      )}

      {subscription.state === "expired" && (
        <div className="trial expired">
          <div className="trial-h">
            <span className="trial-ico"><Lock width={14} height={14} /></span>
            <span>Essai expiré</span>
          </div>
          <div className="trial-text">
            Souscrivez à un abonnement pour reprendre la création de dossiers.
          </div>
          <Link href="/tarifs" className="btn-grad small block">Voir les tarifs</Link>
        </div>
      )}

      {subscription.state === "active" && (
        <div className="trial">
          <div className="trial-h">
            <span className="trial-ico"><Sparkles width={14} height={14} /></span>
            <span>Abonné</span>
          </div>
          <div className="trial-text">Accès complet à toutes les fonctionnalités.</div>
          <Link href="/tarifs" className="ghost-btn small block" style={{ justifyContent: "center" }}>Gérer mon abonnement</Link>
        </div>
      )}
    </aside>
  );
}
