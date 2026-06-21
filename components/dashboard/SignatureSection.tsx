// components/dashboard/SignatureSection.tsx — Signature électronique eIDAS de l'attestation

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PenLine, ShieldCheck, FileDown, Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface LatestSignature {
  id: string;
  status: "draft" | "pending" | "signed" | "declined" | "expired" | "error";
  signer_name: string;
  signer_email: string;
  signing_url: string | null;
  signed_storage_key: string | null;
  signedDownloadUrl: string | null;
  signed_at: string | null;
  created_at: string;
}

interface Props {
  dossierId: string;
  isArchived?: boolean;
  /** Signature eIDAS activée (clé Yousign présente côté serveur). Si false,
   *  la section est entièrement masquée et AUCUN appel API n'est fait. */
  enabled?: boolean;
}

export default function SignatureSection({ dossierId, isArchived, enabled = false }: Props) {
  const [latest, setLatest] = useState<LatestSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/sign`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLatest(data.latest);
      return data.latest as LatestSignature | null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      return null;
    }
  }, [dossierId]);

  useEffect(() => {
    // Feature désactivée (pas de clé Yousign) → aucun appel, section masquée.
    if (!enabled) { setLoading(false); return; }
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [enabled, refresh]);

  // Polling tant que la signature est "pending" (le signataire est en train de signer)
  useEffect(() => {
    if (latest?.status === "pending") {
      pollRef.current = setInterval(async () => {
        const l = await refresh();
        if (l && l.status !== "pending" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [latest?.status, refresh]);

  const initiate = async () => {
    setInitiating(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/sign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? `HTTP ${res.status}`);
      // Ouvre la page de signature Yousign dans un nouvel onglet
      if (data.signingUrl) window.open(data.signingUrl, "_blank", "noopener");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setInitiating(false);
    }
  };

  // Feature désactivée (standby) → rien, jamais d'appel API. C'est le garde-fou
  // principal : tant que la clé Yousign n'est pas posée, la section n'existe pas.
  if (!enabled) return null;

  if (loading) return null;

  const isSigned = latest?.status === "signed";
  const isPending = latest?.status === "pending";
  const canInitiate = !isArchived && (!latest || latest.status === "declined" || latest.status === "expired" || latest.status === "error");

  return (
    <section
      style={{
        marginTop: 24,
        padding: 18,
        background: isSigned ? "rgba(16,185,129,0.04)" : "rgba(124,58,237,0.04)",
        border: `1px solid ${isSigned ? "rgba(16,185,129,0.30)" : "rgba(124,58,237,0.22)"}`,
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: isSigned ? "rgba(16,185,129,0.10)" : "rgba(124,58,237,0.10)",
            display: "grid", placeItems: "center",
            color: isSigned ? "#047857" : "#6d28d9",
            border: `1px solid ${isSigned ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.25)"}`,
            flexShrink: 0,
          }}
        >
          {isSigned ? <ShieldCheck size={20} /> : <PenLine size={20} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: isSigned ? "#047857" : "#6d28d9", marginBottom: 4 }}>
            Signature électronique · eIDAS
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            {isSigned
              ? "Attestation signée électroniquement"
              : isPending
                ? "Signature en cours…"
                : "Renforcer la force probante de l'attestation"}
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>
            {isSigned
              ? `Signée par ${latest?.signer_name}${latest?.signed_at ? ` le ${new Date(latest.signed_at).toLocaleDateString("fr-FR")}` : ""}. Document opposable au sens du règlement eIDAS (UE 910/2014).`
              : isPending
                ? "Le signataire a reçu le document. Cette section se met à jour automatiquement une fois la signature apposée."
                : "Faites signer l'attestation par le responsable LCB-FT via Yousign (prestataire de confiance qualifié eIDAS). Le PDF signé est conservé avec le dossier."}
          </p>

          {error && (
            <div style={{ marginTop: 10, padding: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 6, color: "#b91c1c", fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {canInitiate && (
              <button
                type="button"
                onClick={initiate}
                disabled={initiating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 9,
                  background: initiating ? "rgba(124,58,237,0.40)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "white", fontWeight: 600, fontSize: 13, border: 0,
                  cursor: initiating ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
                }}
              >
                {initiating ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
                {initiating ? "Préparation…" : latest ? "Relancer une signature" : "Faire signer l'attestation"}
              </button>
            )}

            {isPending && latest?.signing_url && (
              <a
                href={latest.signing_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 9,
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "white", fontWeight: 600, fontSize: 13, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
                }}
              >
                <ExternalLink size={14} /> Ouvrir la page de signature
              </a>
            )}

            {isPending && (
              <button
                type="button"
                onClick={() => refresh()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, background: "white", border: "1px solid #cbd5e1", color: "#475569", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}
              >
                <RefreshCw size={13} /> Actualiser
              </button>
            )}

            {isSigned && latest?.signedDownloadUrl && (
              <a
                href={latest.signedDownloadUrl}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 9,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white", fontWeight: 600, fontSize: 13, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
                }}
              >
                <FileDown size={14} /> Télécharger l'attestation signée
              </a>
            )}
          </div>

          {latest?.status === "declined" && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#b45309" }}>
              La signature précédente a été refusée. Vous pouvez en relancer une nouvelle.
            </div>
          )}
          {latest?.status === "expired" && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#b45309" }}>
              La demande de signature a expiré. Relancez-en une nouvelle.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
