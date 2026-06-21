// components/dashboard/DeclarationSection.tsx — Section déclaration de soupçon TRACFIN
//
// Visible uniquement sur les dossiers en examen_renforce ou interdiction.
// Workflow :
//   1. Bouton "Préparer une déclaration de soupçon"
//   2. Brouillon (POST /api/.../declaration) → l'agent voit les faits pré-remplis
//   3. PATCH avec faits édités → toujours en draft
//   4. Bouton "Télécharger PDF + soumettre à ERMES" → passe en `submitted`
//      (l'agent va sur ERMES, upload le PDF, récupère un n° d'AR)
//   5. Saisie du n° ERMES → PATCH statut=acknowledged

"use client";

import { useEffect, useState } from "react";
import { FileWarning, FileDown, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";

interface Declaration {
  id: string;
  dossier_id: string;
  statut: "draft" | "submitted" | "acknowledged" | "closed";
  faits: string;
  ermes_ref: string | null;
  ermes_note: string | null;
  content_hash: string | null;
  submitted_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  dossierId: string;
  niveau: string | null;
  /** Désactive complètement la section si le dossier ne justifie pas une DS. */
  isArchived?: boolean;
}

const STATUT_CFG: Record<Declaration["statut"], { label: string; color: string; bg: string; border: string }> = {
  draft:        { label: "Brouillon",         color: "#475569", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)" },
  submitted:    { label: "Soumise à TRACFIN", color: "#b45309", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.30)" },
  acknowledged: { label: "Accusée par TRACFIN", color: "#047857", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.30)" },
  closed:       { label: "Clôturée",          color: "#0f172a", bg: "rgba(15,23,42,0.08)",    border: "rgba(15,23,42,0.20)" },
};

export default function DeclarationSection({ dossierId, niveau, isArchived }: Props) {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const concerned = niveau === "examen_renforce" || niveau === "interdiction";

  useEffect(() => {
    if (!concerned) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dossiers/${dossierId}/declaration`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setDeclarations(data.declarations ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dossierId, concerned]);

  const createDraft = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/declaration`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      // Recharge la liste pour avoir la row complète
      const list = await fetch(`/api/dossiers/${dossierId}/declaration`).then((r) => r.json());
      setDeclarations(list.declarations ?? []);
      setEditingId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  if (!concerned) return null;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 18,
        background: niveau === "interdiction" ? "rgba(220,38,38,0.04)" : "rgba(245,158,11,0.04)",
        border: `2px solid ${niveau === "interdiction" ? "rgba(220,38,38,0.30)" : "rgba(245,158,11,0.30)"}`,
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: niveau === "interdiction" ? "rgba(220,38,38,0.10)" : "rgba(245,158,11,0.10)",
            display: "grid", placeItems: "center",
            color: niveau === "interdiction" ? "#b91c1c" : "#b45309",
            border: `1px solid ${niveau === "interdiction" ? "rgba(220,38,38,0.25)" : "rgba(245,158,11,0.25)"}`,
            flexShrink: 0,
          }}
        >
          <FileWarning size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: niveau === "interdiction" ? "#b91c1c" : "#b45309", marginBottom: 4 }}>
            Déclaration de soupçon · L.561-15 CMF
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            {niveau === "interdiction"
              ? "Une déclaration TRACFIN est obligatoire pour ce dossier"
              : "Le niveau de vigilance recommande une déclaration TRACFIN"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>
            {niveau === "interdiction"
              ? "Délai légal : 48 heures à compter de la détection. Klaris pré-remplit le dossier ERMES avec toutes les données déjà saisies."
              : "Si vos vérifications complémentaires n'ont pas levé le soupçon, vous devez déclarer à TRACFIN. Klaris prépare le dossier pour vous."}
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ padding: 12, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          <Loader2 className="animate-spin inline" size={14} /> Chargement…
        </div>
      )}

      {error && (
        <div style={{ padding: 10, background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.30)", borderRadius: 8, color: "#b91c1c", fontSize: 12.5 }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && declarations.length === 0 && !isArchived && (
        <button
          type="button"
          onClick={createDraft}
          disabled={creating}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            background: creating
              ? "rgba(220,38,38,0.40)"
              : "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            border: 0,
            cursor: creating ? "wait" : "pointer",
            boxShadow: "0 4px 14px rgba(220,38,38,0.30)",
          }}
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <FileWarning size={14} />}
          {creating ? "Préparation…" : "Préparer une déclaration de soupçon"}
        </button>
      )}

      {!loading && declarations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {declarations.map((d) => (
            <DeclarationCard
              key={d.id}
              declaration={d}
              dossierId={dossierId}
              isEditing={editingId === d.id}
              onEdit={() => setEditingId(d.id)}
              onClose={() => setEditingId(null)}
              onUpdate={(updated) => {
                setDeclarations((prev) => prev.map((x) => x.id === updated.id ? updated : x));
              }}
              isArchived={!!isArchived}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function DeclarationCard({
  declaration, dossierId, isEditing, onEdit, onClose, onUpdate, isArchived,
}: {
  declaration: Declaration;
  dossierId: string;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (d: Declaration) => void;
  isArchived: boolean;
}) {
  const cfg = STATUT_CFG[declaration.statut];
  const [faits, setFaits] = useState(declaration.faits);
  const [ermesRef, setErmesRef] = useState(declaration.ermes_ref ?? "");
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Si l'agent modifie la déclaration et que statut=draft → save les faits.
  const saveFaits = async () => {
    setSaving(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/declaration/${declaration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faits }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onUpdate({ ...declaration, faits, updated_at: new Date().toISOString() });
      onClose();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    setDownloadingPdf(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/declaration/${declaration.id}/pdf`);
      if (!res.ok) throw new Error("Échec de l'export PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `declaration-soupcon-${dossierId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Si la DS était en draft, on la marque "submitted"
      if (declaration.statut === "draft") {
        await fetch(`/api/dossiers/${dossierId}/declaration/${declaration.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "submitted" }),
        });
        onUpdate({ ...declaration, statut: "submitted", submitted_at: new Date().toISOString() });
      }
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erreur d'export");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const setAcknowledged = async () => {
    if (!ermesRef.trim()) {
      setLocalError("Saisissez le numéro d'AR ERMES");
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/declaration/${declaration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "acknowledged", ermesRef: ermesRef.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onUpdate({
        ...declaration,
        statut: "acknowledged",
        ermes_ref: ermesRef.trim(),
        acknowledged_at: new Date().toISOString(),
      });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: 14,
        background: "white",
        border: `1px solid ${cfg.border}`,
        borderRadius: 10,
        boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              padding: "3px 9px",
              borderRadius: 999,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            Créée le {new Date(declaration.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: "monospace" }}>
          {declaration.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {localError && (
        <div style={{ padding: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 6, color: "#b91c1c", fontSize: 12, marginBottom: 10 }}>
          ⚠️ {localError}
        </div>
      )}

      {/* Champ faits — éditable si draft, lecture seule sinon */}
      {isEditing ? (
        <>
          <textarea
            value={faits}
            onChange={(e) => setFaits(e.target.value)}
            disabled={saving}
            rows={10}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid rgba(15,23,42,0.15)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "inherit",
              lineHeight: 1.55,
              resize: "vertical",
              background: "#FAF8FE",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ padding: "7px 14px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontSize: 12.5, cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={saveFaits}
              disabled={saving}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white",
                border: 0,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Sauvegarde…" : "Enregistrer les faits"}
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: 10,
            background: "#FAF8FE",
            border: "1px dashed #c4b5fd",
            borderRadius: 6,
            fontSize: 12.5,
            color: "#0f172a",
            whiteSpace: "pre-wrap",
            lineHeight: 1.55,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {declaration.faits.slice(0, 600)}{declaration.faits.length > 600 && "…"}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {!isEditing && declaration.statut === "draft" && !isArchived && (
          <button
            type="button"
            onClick={onEdit}
            style={{ padding: "7px 12px", borderRadius: 8, background: "white", border: "1px solid #cbd5e1", color: "#475569", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
          >
            Modifier les faits
          </button>
        )}

        {(declaration.statut === "draft" || declaration.statut === "submitted") && (
          <button
            type="button"
            onClick={exportPdf}
            disabled={downloadingPdf}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "white",
              border: 0,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: downloadingPdf ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {downloadingPdf ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            {declaration.statut === "draft" ? "Télécharger PDF + marquer soumise" : "Re-télécharger le PDF"}
          </button>
        )}
      </div>

      {/* Saisie n° ERMES après soumission */}
      {declaration.statut === "submitted" && !isArchived && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#b45309", marginBottom: 6 }}>
            Étape suivante — Confirmation TRACFIN
          </div>
          <p style={{ fontSize: 12, color: "#92400e", margin: "0 0 10px", lineHeight: 1.5 }}>
            Connectez-vous au portail ERMES (<a href="https://tracfin.minefi.gouv.fr/ermes/" target="_blank" rel="noreferrer noopener" style={{ color: "#b45309", textDecoration: "underline" }}>tracfin.minefi.gouv.fr/ermes</a>), créez la déclaration en y joignant le PDF Klaris, et reportez ci-dessous le numéro d&apos;AR reçu :
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              type="text"
              value={ermesRef}
              onChange={(e) => setErmesRef(e.target.value)}
              placeholder="Ex : DS-2026-XXXXX"
              disabled={saving}
              style={{
                flex: 1,
                padding: "7px 10px",
                border: "1px solid #f59e0b",
                borderRadius: 6,
                fontSize: 12.5,
                background: "white",
              }}
            />
            <button
              type="button"
              onClick={setAcknowledged}
              disabled={saving || !ermesRef.trim()}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                background: ermesRef.trim() ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(16,185,129,0.30)",
                color: "white",
                border: 0,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: saving || !ermesRef.trim() ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Confirmer l&apos;AR
            </button>
          </div>
        </div>
      )}

      {declaration.statut === "acknowledged" && declaration.ermes_ref && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.30)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} style={{ color: "#047857", flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12.5 }}>
            <div style={{ fontWeight: 600, color: "#047857" }}>
              Déclaration acceptée par TRACFIN
            </div>
            <div style={{ color: "#065f46", marginTop: 2, fontFamily: "monospace", fontSize: 11.5 }}>
              N° ERMES : <strong>{declaration.ermes_ref}</strong>
              {declaration.acknowledged_at && ` · ${new Date(declaration.acknowledged_at).toLocaleDateString("fr-FR")}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
