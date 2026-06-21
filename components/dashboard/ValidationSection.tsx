// components/dashboard/ValidationSection.tsx — Validation 4-yeux par le correspondant LCB-FT

"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCheck, ShieldCheck, Clock, XCircle, Loader2, Send } from "lucide-react";

interface Validation {
  id: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  requested_by_name: string;
  decided_by: string | null;
  decided_by_name: string | null;
  decision_comment: string | null;
  niveau_at_request: string | null;
  requested_at: string;
  decided_at: string | null;
}

interface Props {
  dossierId: string;
  niveau: string | null;
  isArchived?: boolean;
}

const AT_RISK = new Set(["examen_renforce", "interdiction"]);

export default function ValidationSection({ dossierId, niveau, isArchived }: Props) {
  const [loading, setLoading] = useState(true);
  const [isOrg, setIsOrg] = useState(false);
  const [canValidate, setCanValidate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const concerned = niveau ? AT_RISK.has(niveau) : false;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/dossiers/${dossierId}/validation`);
    if (!res.ok) return;
    const data = await res.json();
    setIsOrg(data.isOrgContext);
    setCanValidate(data.canValidate);
    setCurrentUserId(data.currentUserId);
    setValidations(data.validations ?? []);
  }, [dossierId]);

  useEffect(() => {
    if (!concerned) { setLoading(false); return; }
    (async () => { await refresh(); setLoading(false); })();
  }, [concerned, refresh]);

  if (!concerned || loading) return null;

  const latest = validations[0] ?? null;

  const requestValidation = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/validation`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? `HTTP ${res.status}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision: "approved" | "rejected") => {
    if (!latest) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/validation/${latest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setComment("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  // ─── Solo (hors org) : pas de validation 4-yeux → section masquée ───────
  // Un agent seul est son propre correspondant (accepté pour les petites
  // structures). La section n'apparaît qu'en contexte organisation.
  if (!isOrg) return null;

  const isPending = latest?.status === "pending";
  const isApproved = latest?.status === "approved";
  const isRejected = latest?.status === "rejected";
  const iAmRequester = latest?.requested_by === currentUserId;
  const canDecideThis = isPending && canValidate && !iAmRequester;
  const canRequest = !isArchived && (!latest || isRejected);

  const tone = isApproved ? "green" : isRejected ? "red" : "violet";
  const bg = isApproved ? "rgba(16,185,129,0.04)" : isRejected ? "rgba(220,38,38,0.04)" : "rgba(124,58,237,0.04)";
  const border = isApproved ? "rgba(16,185,129,0.30)" : isRejected ? "rgba(220,38,38,0.25)" : "rgba(124,58,237,0.22)";

  return (
    <section style={panelStyle(bg, border)}>
      <Header
        icon={isApproved ? <ShieldCheck size={20} /> : isPending ? <Clock size={20} /> : isRejected ? <XCircle size={20} /> : <UserCheck size={20} />}
        tone={tone}
        eyebrow="Validation correspondant · L.561-32"
        title={
          isApproved ? "Dossier validé par le correspondant LCB-FT"
          : isPending ? "En attente de validation"
          : isRejected ? "Validation refusée — révision requise"
          : "Validation à quatre yeux"
        }
        desc={
          isApproved ? `Validé par ${latest?.decided_by_name}${latest?.decided_at ? ` le ${new Date(latest.decided_at).toLocaleDateString("fr-FR")}` : ""}.`
          : isPending ? `Demandée par ${latest?.requested_by_name} le ${new Date(latest!.requested_at).toLocaleDateString("fr-FR")}.`
          : isRejected ? `Refusée par ${latest?.decided_by_name}. Corrigez le dossier puis redemandez une validation.`
          : "Ce dossier à risque doit être validé par un correspondant LCB-FT distinct de l'agent instructeur."
        }
      />

      {error && (
        <div style={{ marginTop: 10, padding: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 6, color: "#b91c1c", fontSize: 12 }}>⚠️ {error}</div>
      )}

      {isRejected && latest?.decision_comment && (
        <div style={{ marginTop: 12, padding: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)", borderRadius: 8, fontSize: 12.5, color: "#7f1d1d" }}>
          <strong>Motif du refus :</strong> {latest.decision_comment}
        </div>
      )}
      {isApproved && latest?.decision_comment && (
        <div style={{ marginTop: 12, padding: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)", borderRadius: 8, fontSize: 12.5, color: "#065f46" }}>
          <strong>Commentaire :</strong> {latest.decision_comment}
        </div>
      )}

      {/* Demande de validation (agent) */}
      {canRequest && (
        <div style={{ marginTop: 14 }}>
          <button type="button" onClick={requestValidation} disabled={busy}
            style={btnStyle("linear-gradient(135deg, #7c3aed, #a855f7)", busy)}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isRejected ? "Redemander une validation" : "Demander la validation du correspondant"}
          </button>
        </div>
      )}

      {/* En attente, et je ne peux pas décider (je suis le demandeur, ou pas correspondant) */}
      {isPending && !canDecideThis && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: "#6d28d9" }}>
          {iAmRequester
            ? "Vous avez soumis ce dossier. Un correspondant distinct doit le valider (principe des quatre yeux)."
            : "En attente de la décision d'un correspondant LCB-FT habilité."}
        </div>
      )}

      {/* Décision (correspondant ≠ demandeur) */}
      {canDecideThis && (
        <div style={{ marginTop: 14, padding: 12, background: "white", border: "1px solid rgba(124,58,237,0.20)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6d28d9", marginBottom: 8 }}>
            Votre décision (correspondant LCB-FT)
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (motivé en cas de refus, recommandé en cas d'approbation)…"
            rows={3}
            style={{ width: "100%", padding: 10, border: "1px solid rgba(15,23,42,0.15)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", background: "#FAF8FE", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => decide("rejected")} disabled={busy}
              style={btnStyle("linear-gradient(135deg, #ef4444, #dc2626)", busy)}>
              <XCircle size={14} /> Refuser
            </button>
            <button type="button" onClick={() => decide("approved")} disabled={busy}
              style={btnStyle("linear-gradient(135deg, #10b981, #059669)", busy)}>
              <ShieldCheck size={14} /> Valider le dossier
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Primitives ───────────────────────────────────────────────────────── */
function panelStyle(bg: string, border: string): React.CSSProperties {
  return { marginTop: 24, padding: 18, background: bg, border: `1px solid ${border}`, borderRadius: 12 };
}

function Header({ icon, tone, eyebrow, title, desc }: {
  icon: React.ReactNode; tone: "violet" | "green" | "red"; eyebrow: string; title: string; desc: string;
}) {
  const c = tone === "green" ? { fg: "#047857", bg: "rgba(16,185,129,0.10)", bd: "rgba(16,185,129,0.25)" }
    : tone === "red" ? { fg: "#b91c1c", bg: "rgba(220,38,38,0.10)", bd: "rgba(220,38,38,0.25)" }
    : { fg: "#6d28d9", bg: "rgba(124,58,237,0.10)", bd: "rgba(124,58,237,0.25)" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "grid", placeItems: "center", color: c.fg, border: `1px solid ${c.bd}`, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: c.fg, marginBottom: 4 }}>{eyebrow}</div>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>{title}</h2>
        <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function btnStyle(bg: string, busy: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9,
    background: busy ? "rgba(124,58,237,0.40)" : bg, color: "white", fontWeight: 600, fontSize: 13,
    border: 0, cursor: busy ? "wait" : "pointer",
  };
}
