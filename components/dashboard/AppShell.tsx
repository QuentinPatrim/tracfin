// components/dashboard/AppShell.tsx — Cadre commun des écrans connectés
//
// Une barre latérale fixe (marque, organisation, navigation, essai, compte) et la
// page à droite. Sur téléphone, la barre devient un bandeau avec un menu.
// L'écran d'attente du client (/dashboard/[id]/wait) garde son plein écran sombre.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Folder, ShieldAlert, UserCheck, Plug, Archive, CreditCard, Tag, Menu, X, ArrowUpRight } from "lucide-react";
import { UserButton, OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";

interface Sub {
  state: string;
  isActive: boolean;
  isTrialing: boolean;
  daysLeft: number | null;
}

const TRIAL_DAYS = 14;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { orgId } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [open, setOpen] = useState(false);

  const bare = /^\/dashboard\/[^/]+\/wait/.test(pathname);

  useEffect(() => {
    if (bare) return;
    let alive = true;
    fetch("/api/subscription/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setSub(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bare]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (bare) return <>{children}</>;

  const is = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

  const nav = [
    { href: "/dashboard", label: "Dossiers", icon: Folder, tip: "Vos clients et le suivi de leurs dossiers" },
    { href: "/dashboard/cartographie", label: "Cartographie", icon: ShieldAlert, tip: "Cartographie des risques (L.561-4-1)" },
    ...(orgId ? [{ href: "/dashboard/validations", label: "Validations", icon: UserCheck, tip: "Validation par le correspondant LCB-FT (L.561-32)" }] : []),
    { href: "/dashboard/integrations", label: "Intégrations", icon: Plug, tip: "Connectez votre CRM" },
    { href: "/dashboard/archives", label: "Archives", icon: Archive, tip: "Dossiers archivés, conservés cinq ans" },
  ];
  const account = [
    { href: "/abonnement", label: "Abonnement", icon: CreditCard },
    { href: "/tarifs", label: "Tarifs", icon: Tag },
  ];

  const side = (
    <>
      <Link href="/dashboard" className="k-side-brand" aria-label="Klaris, tableau de bord">
        <KlarisLogo size={26} />
        <span className="k-side-word">Klaris</span>
      </Link>

      <div className="k-side-org">
        <OrganizationSwitcher
          hidePersonal={false}
          afterSelectOrganizationUrl="/dashboard"
          afterSelectPersonalUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
        />
      </div>

      <nav className="k-side-nav" aria-label="Navigation de l'application">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} title={n.tip} className={`k-side-link ${is(n.href) ? "is-on" : ""}`}>
            <n.icon width={16} height={16} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>

      <div className="k-side-label">Compte</div>
      <nav className="k-side-nav" aria-label="Compte">
        {account.map((n) => (
          <Link key={n.href} href={n.href} className="k-side-link">
            <n.icon width={16} height={16} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>

      <div className="k-side-foot">
        <SubCard sub={sub} />
        <div className="k-side-user">
          <UserButton />
          <Link href="/" className="k-side-site">Site Klaris <ArrowUpRight width={12} height={12} /></Link>
        </div>
      </div>
    </>
  );

  return (
    <div className="k-shell">
      <aside className="k-side">{side}</aside>

      {/* Téléphone : bandeau + menu */}
      <div className="k-mbar">
        <Link href="/dashboard" className="k-side-brand" aria-label="Klaris, tableau de bord">
          <KlarisLogo size={24} />
          <span className="k-side-word">Klaris</span>
        </Link>
        <div className="k-mbar-r">
          <UserButton />
          <button type="button" className="k-mbar-btn" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu width={20} height={20} />
          </button>
        </div>
      </div>
      {open && (
        <div className="k-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="k-drawer-veil" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <aside className="k-side k-side--drawer">
            <button type="button" className="k-mbar-btn k-drawer-x" onClick={() => setOpen(false)} aria-label="Fermer le menu">
              <X width={18} height={18} />
            </button>
            {side}
          </aside>
        </div>
      )}

      <div className="k-shell-main">{children}</div>
    </div>
  );
}

/* L'état de l'abonnement, sobrement : jours d'essai restants et une jauge. */
function SubCard({ sub }: { sub: Sub | null }) {
  if (!sub) return null;
  if (sub.isTrialing && sub.daysLeft !== null) {
    const left = Math.max(0, sub.daysLeft);
    const pct = Math.min(100, Math.max(4, ((TRIAL_DAYS - left) / TRIAL_DAYS) * 100));
    return (
      <Link href="/abonnement" className="k-sub" data-urgent={left <= 3 ? "" : undefined}>
        <span className="k-sub-k">Période d&apos;essai</span>
        <span className="k-sub-v">{left > 0 ? `${left} jour${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}` : "Se termine aujourd'hui"}</span>
        <span className="k-sub-bar"><span style={{ width: `${pct}%` }} /></span>
      </Link>
    );
  }
  if (sub.state === "expired") {
    return (
      <Link href="/abonnement" className="k-sub" data-urgent="">
        <span className="k-sub-k">Essai terminé</span>
        <span className="k-sub-v">Choisir une formule</span>
      </Link>
    );
  }
  return null;
}
