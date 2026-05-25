// components/dashboard/DashboardClient.tsx — Le cœur interactif du dashboard
// Reçoit toute la data depuis le server component (page.tsx) et gère :
// search query, filtres, dossier sélectionné, et le rendu du split list+preview.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, FileDown, Trash2, Mail, FileCheck,
  ChevronRight, AlertTriangle, Send, ExternalLink, Package, Check,
} from "lucide-react";
import Topbar from "./Topbar";
import KpiRow from "./KpiRow";
import DocumentsList from "./DocumentsList";
import OnboardingGuide from "./OnboardingGuide";
import DashboardFooter from "./DashboardFooter";
import { EmptyState } from "./primitives";
import { FolderPlus, BookOpen } from "lucide-react";
import MarcheASuivre, { isMarcheTerminee } from "./MarcheASuivre";
import { NIVEAU_CFG, type Niveau, type StatutKey, V1_TO_NIVEAU } from "@/lib/tracfin";
import type { DossierFile } from "@/lib/dossier-files";

export interface DossierItem {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  partie?: "vendeur" | "acquereur" | null;
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
  showGuide: boolean;
  subscription: {
    isActive: boolean;
    isTrialing: boolean;
    state: string;
    daysLeft: number | null;
  };
}

type FilterKey = "all" | "attente" | "vigilance" | "critique" | "conforme";

// Résout le niveau effectif d'un dossier (rétro-compat v1 → v2)
function resolveNiveau(d: DossierItem): Niveau | null {
  if (d.algo_version === "v2") return d.niveau;
  if (d.statut) return V1_TO_NIVEAU[d.statut];
  return null;
}

function niveauBadge(d: DossierItem): { tone: "success" | "warn" | "danger" | "critical" | "pending"; label: string } {
  if (d.kyc_status !== "received") return { tone: "pending", label: "En attente du KYC" };
  const n = resolveNiveau(d);
  if (!n) return { tone: "pending", label: "À analyser" };
  if (n === "vigilance_standard") return { tone: "success", label: "Conforme" };
  if (n === "vigilance_renforcee") return { tone: "warn", label: "Vigilance renforcée" };
  if (n === "examen_renforce") return { tone: "danger", label: "Examen renforcé" };
  return { tone: "critical", label: "Interdiction" };
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

export default function DashboardClient({ dossiers, counts, canCreate, filesByDossier, showGuide, subscription }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // ─── Guide pédagogique LCB-FT ────────────────────────────────────────
  const [guideOpen, setGuideOpen] = useState(showGuide);
  useEffect(() => {
    const onOpen = () => setGuideOpen(true);
    window.addEventListener("klaris:open-guide", onOpen);
    return () => window.removeEventListener("klaris:open-guide", onOpen);
  }, []);

  // ─── Marches à suivre terminées (synchronisation localStorage) ───────
  const [marcheCompletedIds, setMarcheCompletedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const recompute = () => {
      const s = new Set<string>();
      for (const d of dossiers) {
        const n = resolveNiveau(d);
        if (n && isMarcheTerminee(d.id, n)) s.add(d.id);
      }
      setMarcheCompletedIds(s);
    };
    recompute();
    window.addEventListener("klaris:marche-updated", recompute);
    window.addEventListener("storage", recompute);
    return () => {
      window.removeEventListener("klaris:marche-updated", recompute);
      window.removeEventListener("storage", recompute);
    };
  }, [dossiers]);

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

  // Dossiers en alerte (examen_renforce / interdiction) — sauf si la marche
  // à suivre a été menée à son terme par l'agent (toutes les étapes cochées).
  const alerts = useMemo(
    () => dossiers.filter((d) => {
      const n = resolveNiveau(d);
      if (n !== "examen_renforce" && n !== "interdiction") return false;
      return !marcheCompletedIds.has(d.id);
    }),
    [dossiers, marcheCompletedIds]
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
        subscription={subscription}
        currentScreen="dossiers"
      />

      <div className="screen dossiers-screen">
        {counts.total === 0 ? (
          <div style={{ paddingTop: 24, paddingBottom: 24 }}>
            <EmptyState
              icon={FolderPlus}
              eyebrow="Premier pas"
              title="Créez votre premier dossier KYC"
              description={
                <>
                  Klaris vous accompagne pas à pas dans la conformité LCB-FT. Créez un dossier
                  pour un client, envoyez-lui le lien sécurisé, recevez son KYC et obtenez votre
                  attestation signée — en moins de 10 minutes.
                </>
              }
              primaryAction={
                <Link href={newHref} className="btn-grad small">
                  <FolderPlus width={14} height={14} />
                  {canCreate ? "Créer un dossier" : "Voir les tarifs"}
                </Link>
              }
              secondaryAction={
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("klaris:open-guide"))}
                  className="ghost-btn small"
                  style={{ justifyContent: "center" }}
                >
                  <BookOpen width={13} height={13} />
                  Ouvrir le guide LCB-FT
                </button>
              }
            />
          </div>
        ) : (
        <>
        <KpiRow {...counts} />

        {alerts.length > 0 && (
          <div className="alerts">
            <div className="alerts-h">
              <span className="alerts-pulse" />
              <strong>{alerts.length} dossier{alerts.length > 1 ? "s" : ""} demande{alerts.length > 1 ? "nt" : ""} une action immédiate</strong>
              <span className="muted small">— examen renforcé ou interdiction TRACFIN</span>
            </div>
            <div className="alerts-list">
              {alerts.map((d) => {
                const ab = niveauBadge(d);
                return (
                  <Link key={d.id} href={`/dashboard/${d.id}`} className="alert-pill">
                    <span className="risk-dot" style={{ background: ab.tone === "critical" ? "#0f172a" : "#ef4444" }} />
                    <span className="alert-name">{d.nom_prenom}</span>
                    <span className="muted small">{ab.label}</span>
                    <ChevronRight width={12} height={12} style={{ opacity: 0.6 }} />
                  </Link>
                );
              })}
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
                        <div className="row-sub muted small flex items-center gap-2">
                          <span>{d.type_client === "morale" ? "Personne morale" : "Personne physique"}</span>
                          {d.partie && (
                            <>
                              <span className="dot-sep">•</span>
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] uppercase tracking-widest font-bold"
                                style={{
                                  background: d.partie === "vendeur" ? "rgba(124,58,237,0.08)" : "rgba(236,72,153,0.08)",
                                  border: `1px solid ${d.partie === "vendeur" ? "rgba(124,58,237,0.25)" : "rgba(236,72,153,0.25)"}`,
                                  color: d.partie === "vendeur" ? "#6d28d9" : "#be185d",
                                }}
                              >
                                {d.partie === "vendeur" ? "Vendeur" : "Acquéreur"}
                              </span>
                            </>
                          )}
                          <span className="dot-sep">•</span>
                          <span>Maj. {formatDate(d.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="row-r">
                      {marcheCompletedIds.has(d.id) && (b.tone === "danger" || b.tone === "warn" || b.tone === "critical") && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                          style={{
                            background: "rgba(16,185,129,0.10)",
                            border: "1px solid rgba(16,185,129,0.30)",
                            color: "#047857",
                          }}
                          title="Marche à suivre terminée"
                        >
                          <Check width={9} height={9} strokeWidth={3} />
                          Traité
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
        </>
        )}
      </div>

      {/* Footer cohérent (light) */}
      <DashboardFooter />

      {/* ─── Confirmation suppression ─── */}
      {confirmDelete && (
        <ConfirmDeleteModal
          dossier={confirmDelete}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}

      {/* ─── Guide pédagogique LCB-FT (1ère visite ou bouton "?" sidebar) ─── */}
      <OnboardingGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onComplete={() => setGuideOpen(false)}
      />
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
            <div className="muted small flex items-center gap-2 flex-wrap">
              <span>{d.type_client === "morale" ? "Personne morale" : "Personne physique"}</span>
              {d.partie && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] uppercase tracking-widest font-bold"
                  style={{
                    background: d.partie === "vendeur" ? "rgba(124,58,237,0.08)" : "rgba(236,72,153,0.08)",
                    border: `1px solid ${d.partie === "vendeur" ? "rgba(124,58,237,0.25)" : "rgba(236,72,153,0.25)"}`,
                    color: d.partie === "vendeur" ? "#6d28d9" : "#be185d",
                  }}
                >
                  {d.partie === "vendeur" ? "Vendeur" : "Acquéreur"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Niveau de vigilance (verdict qualitatif) */}
      {d.kyc_status === "received" && cfg && niveau && (
        <div>
          <div
            className="preview-risk-label"
            style={{
              color:
                b.tone === "success" ? "#059669"
                : b.tone === "warn" ? "#d97706"
                : b.tone === "critical" ? "#0f172a"
                : "#dc2626",
            }}
          >
            {cfg.label}
          </div>
          <div className="muted small" style={{ marginBottom: 14 }}>{cfg.ref}</div>

          {/* Disque coloré plein (vert/orange/rouge selon niveau) + action recommandée */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <NiveauDisc tone={b.tone} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--k-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Verdict
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--k-fg-2)", lineHeight: 1.5 }}>{cfg.action}</p>
            </div>
          </div>

          {/* Guide d'actions concret par niveau (compact dans le preview) */}
          <MarcheASuivre
            niveau={niveau}
            dossierId={d.id}
            clientName={d.nom_prenom}
            partie={d.partie === "vendeur" ? "vendeur" : "acquereur"}
            mode="compact"
          />
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
          <span>Le client n'a pas encore complété sa fiche KYC. L'analyse sera disponible dès réception.</span>
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

        {/* Déclaration TRACFIN / ERMES si niveau critique */}
        {d.kyc_status === "received" && isCritical && (
          <a
            href="https://tracfin.finances.gouv.fr/"
            target="_blank"
            rel="noreferrer noopener"
            className="btn-grad small block"
            style={{
              background: "linear-gradient(135deg, #dc2626, #ef4444, #f43f5e)",
              boxShadow: "0 4px 14px rgba(220,38,38,0.35), 0 1px 0 rgba(255,255,255,0.25) inset",
            }}
          >
            <AlertTriangle width={12} height={12} />
            Déclarer à TRACFIN (ERMES)
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

/* Disque coloré plein qui matérialise visuellement le NIVEAU de vigilance.
   Pas de pourcentage, pas de score — juste la couleur du verdict. */
function NiveauDisc({ tone }: { tone: "success" | "warn" | "danger" | "critical" | "pending" }) {
  const cfg =
    tone === "success"  ? { from: "#10b981", to: "#34d399", glow: "rgba(16,185,129,0.40)" }
    : tone === "warn"   ? { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.40)" }
    : tone === "danger" ? { from: "#dc2626", to: "#f43f5e", glow: "rgba(220,38,38,0.40)" }
    : tone === "critical" ? { from: "#0f172a", to: "#1e293b", glow: "rgba(220,38,38,0.45)" }
    : { from: "#7c3aed", to: "#ec4899", glow: "rgba(124,58,237,0.40)" };

  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
        boxShadow: `0 0 0 4px ${cfg.glow}, 0 6px 18px ${cfg.glow}, 0 1px 0 rgba(255,255,255,0.40) inset`,
        flexShrink: 0,
        position: "relative",
      }}
      aria-hidden="true"
    >
      {/* Highlight haut pour donner du relief */}
      <div
        style={{
          position: "absolute",
          top: 6, left: 8, right: 8, height: 18,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.45), transparent)",
          opacity: 0.7,
        }}
      />
      {/* Accent rouge pulsé pour le mode critical (interdiction) */}
      {tone === "critical" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: "0 0 0 1.5px rgba(220,38,38,0.55) inset",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
