// components/dashboard/DashboardClient.tsx — Le cœur interactif du dashboard
// Reçoit toute la data depuis le server component (page.tsx) et gère :
// search query, filtres, dossier sélectionné, et le rendu du split list+preview.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, FileDown, Trash2, Mail, FileCheck,
  ChevronRight, AlertTriangle, Send, ExternalLink, Package,
} from "lucide-react";
import Topbar from "./Topbar";
import KpiRow from "./KpiRow";
import DocumentsList from "./DocumentsList";
import { NIVEAU_CFG, type Niveau, type StatutKey, V1_TO_NIVEAU } from "@/lib/tracfin";
import type { DossierFile } from "@/lib/dossier-files";

export interface DossierItem {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  algo_version: "v1" | "v2";
  niveau: Niveau | null;
  statut: StatutKey | null;
  score_pct: number;
  created_at: string;
  updated_at: string;
  kyc_status: string;
}

interface Props {
  dossiers: DossierItem[];
  counts: { total: number; conformes: number; vigilance: number; critique: number };
  canCreate: boolean;
  filesByDossier: Record<string, DossierFile[]>;
}

type FilterKey = "all" | "attente" | "vigilance" | "critique" | "conforme";

// Résout le niveau effectif d'un dossier (rétro-compat v1 → v2)
function resolveNiveau(d: DossierItem): Niveau | null {
  if (d.algo_version === "v2") return d.niveau;
  if (d.statut) return V1_TO_NIVEAU[d.statut];
  return null;
}

function niveauBadge(d: DossierItem): { tone: "success" | "warn" | "danger" | "pending"; label: string } {
  if (d.kyc_status !== "received") return { tone: "pending", label: "En attente du KYC" };
  const n = resolveNiveau(d);
  if (!n) return { tone: "pending", label: "À analyser" };
  if (n === "vigilance_standard") return { tone: "success", label: "Conforme" };
  if (n === "vigilance_renforcee") return { tone: "warn", label: "Vigilance renforcée" };
  return { tone: "danger", label: n === "interdiction" ? "Interdiction" : "Examen renforcé" };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch { return ""; }
}

function initials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardClient({ dossiers, counts, canCreate, filesByDossier }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // Sélection initiale : 1er dossier (priorité aux KYC reçus, puis critiques)
  const defaultSelected = useMemo(() => {
    const received = dossiers.find((d) => d.kyc_status === "received");
    return received?.id ?? dossiers[0]?.id ?? null;
  }, [dossiers]);
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);

  // État de suppression
  const [confirmDelete, setConfirmDelete] = useState<DossierItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dossiers/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec de la suppression");
      setConfirmDelete(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  // Dossiers en alerte (examen_renforce / interdiction OU statut critical legacy)
  const alerts = useMemo(
    () => dossiers.filter((d) => {
      const n = resolveNiveau(d);
      return n === "examen_renforce" || n === "interdiction";
    }),
    [dossiers]
  );

  // Filtrage de la liste
  const filtered = useMemo(() => {
    return dossiers.filter((d) => {
      if (query && !d.nom_prenom.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "all") return true;
      if (filter === "attente") return d.kyc_status !== "received";
      const n = resolveNiveau(d);
      if (filter === "vigilance") return n === "vigilance_renforcee";
      if (filter === "critique") return n === "examen_renforce" || n === "interdiction";
      if (filter === "conforme") return n === "vigilance_standard";
      return true;
    });
  }, [dossiers, filter, query]);

  const selected = useMemo(
    () => dossiers.find((d) => d.id === selectedId) ?? filtered[0] ?? null,
    [dossiers, selectedId, filtered]
  );

  const filters: Array<{ id: FilterKey; label: string; count: number }> = [
    { id: "all",       label: "Tous",       count: counts.total },
    { id: "attente",   label: "En attente", count: dossiers.filter((d) => d.kyc_status !== "received").length },
    { id: "vigilance", label: "Vigilance",  count: counts.vigilance },
    { id: "critique",  label: "Critique",   count: counts.critique },
    { id: "conforme",  label: "Conformes",  count: counts.conformes },
  ];

  const newHref = canCreate ? "/dashboard/nouveau" : "/tarifs";

  return (
    <>
      <Topbar
        title="Tableau de bord"
        subtitle={`${counts.total} dossier${counts.total > 1 ? "s" : ""} KYC · mise à jour à l'instant`}
        query={query}
        onQueryChange={setQuery}
        newHref={newHref}
        canCreate={canCreate}
      />

      <div className="screen dossiers-screen">
        <KpiRow {...counts} />

        {alerts.length > 0 && (
          <div className="alerts">
            <div className="alerts-h">
              <span className="alerts-pulse" />
              <strong>{alerts.length} dossier{alerts.length > 1 ? "s" : ""} demande{alerts.length > 1 ? "nt" : ""} une action immédiate</strong>
              <span className="muted small">— examen renforcé ou interdiction TRACFIN</span>
            </div>
            <div className="alerts-list">
              {alerts.map((d) => (
                <Link key={d.id} href={`/dashboard/${d.id}`} className="alert-pill">
                  <span className="risk-dot" style={{ background: "#ef4444" }} />
                  <span className="alert-name">{d.nom_prenom}</span>
                  <span className="muted small">{niveauBadge(d).label}</span>
                  <ChevronRight width={12} height={12} style={{ opacity: 0.6 }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="split">
          {/* ─── LIST ─── */}
          <section className="card list-card">
            <header className="card-h list-h">
              <div className="seg flex-wrap">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    className={`seg-btn ${filter === f.id ? "active" : ""}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}<span className="seg-count">{f.count}</span>
                  </button>
                ))}
              </div>
            </header>

            <div className="rows">
              {filtered.length === 0 && (
                <div className="empty muted">Aucun dossier ne correspond.</div>
              )}
              {filtered.map((d) => {
                const b = niveauBadge(d);
                const isSelected = d.id === selected?.id;
                return (
                  <button
                    key={d.id}
                    className={`row card-row ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <div className="row-l">
                      <span className="row-avatar">{initials(d.nom_prenom)}</span>
                      <div>
                        <div className="row-title">{d.nom_prenom}</div>
                        <div className="row-sub muted small">
                          <span>{d.type_client === "morale" ? "Personne morale" : "Personne physique"}</span>
                          <span className="dot-sep">•</span>
                          <span>Maj. {formatDate(d.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="row-r">
                      {d.kyc_status === "received" && d.score_pct > 0 && (
                        <span className="risk-meter">
                          <span className="risk-dot" style={{
                            background: b.tone === "success" ? "#10b981"
                              : b.tone === "warn" ? "#f59e0b"
                              : b.tone === "danger" ? "#ef4444" : "#7c3aed"
                          }} />
                          <span style={{
                            color: b.tone === "success" ? "#059669"
                              : b.tone === "warn" ? "#d97706"
                              : b.tone === "danger" ? "#dc2626" : "#7c3aed",
                            fontWeight: 600,
                          }}>{d.score_pct}</span>
                          <span className="muted small">/100</span>
                        </span>
                      )}
                      <span className={`badge tone-${b.tone}`}>{b.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── PREVIEW PANE ─── */}
          <aside className="card preview">
            {selected ? (
              <SelectedPreview
                dossier={selected}
                files={filesByDossier[selected.id] ?? []}
                onAskDelete={() => setConfirmDelete(selected)}
              />
            ) : (
              <div className="empty-preview">
                <div>
                  <div className="muted small" style={{ marginBottom: 8 }}>Aucun dossier sélectionné</div>
                  <Link href={newHref} className="btn-grad small">
                    <Send width={12} height={12} />
                    Créer le premier dossier
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ─── Confirmation suppression ─── */}
      {confirmDelete && (
        <ConfirmDeleteModal
          dossier={confirmDelete}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

/* ─── Modale de confirmation de suppression ─────────────────────────── */
function ConfirmDeleteModal({
  dossier, onConfirm, onCancel, loading,
}: {
  dossier: DossierItem;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          background: "#ffffff",
          border: "1px solid rgba(220,38,38,0.22)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 30px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(220,38,38,0.10)",
              display: "grid", placeItems: "center",
              color: "#dc2626",
              border: "1px solid rgba(220,38,38,0.22)",
            }}
          >
            <AlertTriangle width={20} height={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Supprimer ce dossier ?</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              Dossier de <strong>{dossier.nom_prenom}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.30)",
            borderRadius: 10,
            fontSize: 12.5,
            color: "#334155",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#d97706" }}>⚠️ Action irréversible et non conforme</strong> à l'art. <strong>L.561-12-1 du CMF</strong> qui impose la conservation des données 5 ans après la fin de la relation d'affaires. Toutes les pièces seront également supprimées. Confirmez seulement si vous savez ce que vous faites.
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: "1px solid #ebebf2",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: 0,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 14px rgba(220,38,38,0.30), 0 1px 0 rgba(255,255,255,0.20) inset",
              opacity: loading ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 width={13} height={13} />
            {loading ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview d'un dossier sélectionné ─────────────────────────────── */

function SelectedPreview({ dossier: d, files, onAskDelete }: { dossier: DossierItem; files: DossierFile[]; onAskDelete: () => void }) {
  const b = niveauBadge(d);
  const niveau = resolveNiveau(d);
  const cfg = niveau ? NIVEAU_CFG[niveau] : null;
  const score = d.score_pct;
  const isCritical = niveau === "examen_renforce" || niveau === "interdiction";

  return (
    <>
      <div className="preview-h">
        <div className="preview-id">
          <span className="row-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>
            {initials(d.nom_prenom)}
          </span>
          <div>
            <div className="preview-name">{d.nom_prenom}</div>
            <div className="muted small">{d.type_client === "morale" ? "Personne morale" : "Personne physique"}</div>
          </div>
        </div>
      </div>

      {/* Score / niveau */}
      {d.kyc_status === "received" && cfg && (
        <div>
          <div className="preview-risk-label" style={{ color: b.tone === "success" ? "#059669" : b.tone === "warn" ? "#d97706" : "#dc2626" }}>
            {cfg.label}
          </div>
          <div className="muted small" style={{ marginBottom: 12 }}>{cfg.ref}</div>
          <div className="preview-score">
            <ScoreRing score={score} tone={b.tone} />
            <div>
              <div style={{ fontSize: 11, color: "var(--k-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Score de conformité</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--k-fg)" }}>{score}<span className="muted small" style={{ fontWeight: 400 }}>/100</span></div>
            </div>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--k-fg-2)", lineHeight: 1.5 }}>{cfg.action}</p>
        </div>
      )}

      {d.kyc_status !== "received" && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          background: "#faf6ff",
          border: "1px solid #ebe1ff",
          color: "#5b21b6",
          borderRadius: 10,
          fontSize: 12.5,
          lineHeight: 1.5,
        }}>
          <Mail width={14} height={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>Le client n'a pas encore complété sa fiche KYC. Le score sera disponible dès réception.</span>
        </div>
      )}

      {/* Métadonnées */}
      <div className="preview-section">
        <div className="preview-label">Détails</div>
        <div className="preview-tx">
          <span className="preview-tx-kind muted small">Créé le</span>
          <span className="preview-tx-amt small">{formatDate(d.created_at)}</span>
        </div>
        <div className="preview-tx">
          <span className="preview-tx-kind muted small">Mis à jour</span>
          <span className="preview-tx-amt small">{formatDate(d.updated_at)}</span>
        </div>
        <div className="preview-tx">
          <span className="preview-tx-kind muted small">Algorithme</span>
          <span className="preview-tx-amt small">Klaris {d.algo_version.toUpperCase()}</span>
        </div>
      </div>

      {/* Pièces justificatives */}
      {d.kyc_status === "received" && (
        <div className="preview-section">
          <div className="preview-label">Pièces justificatives <span style={{ marginLeft: 4, color: "#94a3b8", fontWeight: 500 }}>({files.length})</span></div>
          <DocumentsList files={files} mode="compact" />
        </div>
      )}

      {/* Actions */}
      <div className="preview-actions">
        <Link href={d.kyc_status === "received" ? `/dashboard/${d.id}` : `/dashboard/${d.id}/wait`} className="btn-grad small block">
          {d.kyc_status === "received" ? "Ouvrir le dossier" : "Voir le lien KYC"}
          <ArrowRight width={12} height={12} />
        </Link>

        {/* Déclaration TRACFIN/ERMES si niveau critique */}
        {d.kyc_status === "received" && isCritical && (
          <a
            href="https://www.tracfin.gouv.fr/professionnels-assujettis-tracfin/declarer-tracfin"
            target="_blank"
            rel="noreferrer noopener"
            className="btn-grad small block"
            style={{
              background: "linear-gradient(135deg, #dc2626, #ef4444, #f43f5e)",
              boxShadow: "0 4px 14px rgba(220,38,38,0.35), 0 1px 0 rgba(255,255,255,0.25) inset",
            }}
          >
            <AlertTriangle width={12} height={12} />
            Déclarer à TRACFIN
            <ExternalLink width={11} height={11} style={{ opacity: 0.85 }} />
          </a>
        )}

        {d.kyc_status === "received" && (
          <a
            href={`/api/dossiers/${d.id}/zip`}
            className="ghost-btn small block"
            style={{ justifyContent: "center" }}
          >
            <Package width={12} height={12} />
            Télécharger le dossier complet (ZIP)
          </a>
        )}
        {d.kyc_status === "received" && (
          <a
            href={`/api/dossiers/${d.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="ghost-btn small block"
            style={{ justifyContent: "center" }}
          >
            <FileDown width={12} height={12} />
            Attestation PDF
          </a>
        )}
        {d.kyc_status === "received" && (
          <a
            href={`/api/dossiers/${d.id}/kyc-pdf`}
            target="_blank"
            rel="noreferrer"
            className="ghost-btn small block"
            style={{ justifyContent: "center" }}
          >
            <FileCheck width={12} height={12} />
            Fiche KYC PDF
          </a>
        )}

        <button
          onClick={onAskDelete}
          className="ghost-btn small block"
          style={{ justifyContent: "center", color: "#dc2626", borderColor: "rgba(220,38,38,0.20)" }}
        >
          <Trash2 width={12} height={12} />
          Supprimer le dossier
        </button>
      </div>
    </>
  );
}

function ScoreRing({ score, tone }: { score: number; tone: "success" | "warn" | "danger" | "pending" }) {
  const grad =
    tone === "success" ? { from: "#10b981", to: "#34d399", glow: "rgba(16,185,129,0.45)" }
    : tone === "warn"  ? { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.45)" }
    : tone === "danger"? { from: "#dc2626", to: "#f43f5e", glow: "rgba(220,38,38,0.45)" }
    : { from: "#7c3aed", to: "#ec4899", glow: "rgba(124,58,237,0.45)" };
  const R = 26;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);
  const gradId = `ring-grad-${tone}`;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="score-ring" style={{ filter: `drop-shadow(0 0 12px ${grad.glow})` }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={grad.from} />
          <stop offset="100%" stopColor={grad.to} />
        </linearGradient>
      </defs>
      <circle cx={32} cy={32} r={R} fill="none" stroke="#ebebf2" strokeWidth={5} />
      <circle
        cx={32}
        cy={32}
        r={R}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "32px 32px", transition: "stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}
