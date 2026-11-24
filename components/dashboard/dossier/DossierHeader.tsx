// components/dashboard/dossier/DossierHeader.tsx — En-tête de la fiche dossier
//
// Qui (nom, type, rôle), où en est le dossier (niveau de vigilance) et les deux
// exports qu'on demande en contrôle : l'archive complète et l'attestation PDF.
// Le sommaire en dessous mène aux sections ; chaque puce porte la barre du K de
// l'obligation concernée (voir DESIGN.md).

import Link from "next/link";
import { ArrowLeft, Building2, User, Inbox, Archive, FileDown, Package } from "lucide-react";
import type { Niveau } from "@/lib/tracfin";

const LEVEL: Record<Niveau, { label: string; fg: string; bg: string; dot: string }> = {
  vigilance_standard: { label: "Vigilance standard", fg: "#0F7A4F", bg: "#E6F6EF", dot: "#16A06A" },
  vigilance_renforcee: { label: "Vigilance renforcée", fg: "#8F5A00", bg: "#FFF3D6", dot: "#E3A008" },
  examen_renforce: { label: "Examen renforcé", fg: "#B3361C", bg: "#FFE9E2", dot: "#E5502F" },
  interdiction: { label: "Interdiction", fg: "#fff", bg: "#C5302C", dot: "#fff" },
};

export const K = { identifier: "#2F5BFF", evaluer: "#5468FF", conserver: "#9A6BEB", declarer: "#EC6A93", justifier: "#FF6A4D" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  id: string;
  name: string;
  morale: boolean;
  vendeur: boolean;
  niveau: Niveau | null;
  receivedAt: string | null;
  archived: boolean;
  filesCount: number;
}

export default function DossierHeader({ id, name, morale, vendeur, niveau, receivedAt, archived, filesCount }: Props) {
  const lv = niveau ? LEVEL[niveau] : null;
  const received = fmtDate(receivedAt);
  const declare = niveau === "examen_renforce" || niveau === "interdiction";

  return (
    <header>
      <Link href={archived ? "/dashboard/archives" : "/dashboard"} className="kd-back">
        <ArrowLeft width={15} height={15} /> {archived ? "Archives" : "Dossiers"}
      </Link>

      <div className="kd-head">
        <span className="kd-av" aria-hidden>{initials(name)}</span>
        <div className="kd-id">
          <h1 className="kd-name">{name}</h1>
          <div className="kd-meta">
            <span className="kd-chip">{morale ? <Building2 width={13} height={13} /> : <User width={13} height={13} />}{morale ? "Personne morale" : "Personne physique"}</span>
            <span className="kd-chip">{vendeur ? "Vendeur" : "Acquéreur"}</span>
            {received && <span className="kd-chip"><Inbox width={13} height={13} />Fiche reçue le {received}</span>}
            {archived && <span className="kd-chip kd-chip--arch"><Archive width={13} height={13} />Archivé</span>}
          </div>
        </div>
        <div className="kd-side">
          {!lv && <span className="kd-level kd-level--todo"><i aria-hidden />Niveau à calculer</span>}
          {lv && (
            <span className="kd-level" style={{ ["--lv-fg" as string]: lv.fg, ["--lv-bg" as string]: lv.bg, ["--lv-dot" as string]: lv.dot }}>
              <i aria-hidden />{lv.label}
            </span>
          )}
          <a href={`/api/dossiers/${id}/zip`} className="kd-btn"><Package width={16} height={16} />Dossier .zip</a>
          {niveau && <a href={`/api/dossiers/${id}/pdf`} download className="kd-btn kd-btn--pri"><FileDown width={16} height={16} />Attestation PDF</a>}
        </div>
      </div>

      <nav className="kd-nav" aria-label="Sections du dossier">
        {niveau && <a href="#suite"><i style={{ background: lv?.dot }} />Suite à donner</a>}
        {declare && <a href="#declaration"><i style={{ background: K.declarer }} />Déclaration</a>}
        <a href="#analyse"><i style={{ background: K.evaluer }} />Analyse de risque</a>
        <a href="#pieces"><i style={{ background: K.conserver }} />Pièces · {filesCount}</a>
        <a href="#client"><i style={{ background: K.identifier }} />Données du client</a>
      </nav>
    </header>
  );
}
