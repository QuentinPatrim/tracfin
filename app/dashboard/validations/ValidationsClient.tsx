// app/dashboard/validations/ValidationsClient.tsx — Queue de validation + correspondants

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, UserCheck, ShieldCheck, Clock, Users, Loader2, Check, X } from "lucide-react";

interface PendingValidation {
  id: string;
  dossier_id: string;
  requested_by: string;
  requested_by_name: string;
  niveau_at_request: string | null;
  niveau: string | null;
  nom_prenom: string;
  type_client: string;
  requested_at: string;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isCorrespondant: boolean;
}

export default function ValidationsClient({ isOrgContext }: { isOrgContext: boolean }) {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingValidation[]>([]);
  const [canValidate, setCanValidate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    const [q, c] = await Promise.all([
      fetch("/api/organisation/validations").then((r) => r.ok ? r.json() : null),
      fetch("/api/organisation/correspondants").then((r) => r.ok ? r.json() : null),
    ]);
    if (q) {
      setPending(q.pending ?? []);
      setCanValidate(q.canValidate);
      setCurrentUserId(q.currentUserId);
    }
    if (c?.members) {
      setMembers(c.members);
      setCanManage(c.canManage);
    }
  }, []);

  useEffect(() => {
    if (!isOrgContext) { setLoading(false); return; }
    (async () => { await load(); setLoading(false); })();
  }, [isOrgContext, load]);

  return (
    <div style={{ padding: "24px 28px 80px" }}>
      <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6F6A8A", fontSize: 13, textDecoration: "none", marginBottom: 10 }}>
        <ArrowLeft size={14} /> Retour au dashboard
      </Link>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: "rgba(109,94,246,0.08)", border: "1px solid rgba(109,94,246,0.18)", color: "#5B46E0", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
        <UserCheck size={11} /> Correspondant LCB-FT · L.561-32
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "#17123A", }}>
        Validations à quatre yeux
      </h1>
      <p style={{ color: "#6F6A8A", fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 720 }}>
        Les dossiers en examen renforcé ou interdiction sont soumis à la validation d&apos;un correspondant LCB-FT distinct de l&apos;agent instructeur (principe des quatre yeux, art. L.561-32 du CMF).
      </p>

      {!isOrgContext && (
        <div style={{ marginTop: 24, padding: 24, background: "rgba(109,94,246,0.04)", border: "1px dashed rgba(109,94,246,0.30)", borderRadius: 12, fontSize: 13.5, color: "#55506F", lineHeight: 1.6 }}>
          La validation à quatre yeux est une fonctionnalité <strong>organisation</strong> (plan Agence). En compte personnel, vous êtes votre propre correspondant LCB-FT — accepté pour les structures individuelles. Pour activer le workflow de validation, créez une organisation depuis le sélecteur en haut à droite.
        </div>
      )}

      {loading && isOrgContext && (
        <div style={{ padding: 24, textAlign: "center", color: "#9792B4" }}><Loader2 size={16} className="animate-spin inline" /> Chargement…</div>
      )}

      {isOrgContext && !loading && (
        <>
          {/* File d'attente */}
          <section style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#5B46E0", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} /> En attente de validation ({pending.length})
            </div>

            {pending.length === 0 ? (
              <div style={{ padding: 24, background: "rgba(30,158,106,0.04)", border: "1px dashed rgba(30,158,106,0.30)", borderRadius: 12, textAlign: "center", fontSize: 13.5, color: "#177A52" }}>
                ✓ Aucun dossier en attente de validation.
              </div>
            ) : (
              <div style={{ background: "white", border: "1px solid rgba(23,18,58,0.08)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ background: "rgba(23,18,58,0.03)" }}>
                    <tr>
                      <Th>Client</Th><Th>Niveau</Th><Th>Demandé par</Th><Th>Le</Th><Th style={{ width: 90 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => {
                      const mine = p.requested_by === currentUserId;
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid rgba(23,18,58,0.05)" }}>
                          <Td style={{ fontWeight: 500, color: "#17123A" }}>{p.nom_prenom}
                            <div style={{ fontSize: 11, color: "#9792B4" }}>{p.type_client === "morale" ? "Personne morale" : "Personne physique"}</div>
                          </Td>
                          <Td><NiveauBadge n={p.niveau ?? p.niveau_at_request} /></Td>
                          <Td style={{ color: "#6F6A8A" }}>{p.requested_by_name}{mine && <span style={{ color: "#8F5A00" }}> (vous)</span>}</Td>
                          <Td style={{ color: "#6F6A8A" }}>{new Date(p.requested_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</Td>
                          <Td>
                            <Link href={`/dashboard/${p.dossier_id}`} style={{ color: "#6D5EF6", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5 }}>
                              {canValidate && !mine ? "Examiner" : "Voir"} <ArrowRight size={12} />
                            </Link>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!canValidate && pending.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#9792B4" }}>
                Vous n&apos;êtes pas désigné correspondant LCB-FT : vous pouvez consulter mais pas statuer.
              </div>
            )}
          </section>

          {/* Gestion des correspondants */}
          <section style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#5B46E0", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={12} /> Correspondants LCB-FT désignés
            </div>
            {!canManage && (
              <div style={{ marginBottom: 10, fontSize: 12, color: "#9792B4" }}>
                Seul un administrateur de l&apos;organisation peut modifier les désignations.
              </div>
            )}
            <div style={{ background: "white", border: "1px solid rgba(23,18,58,0.08)", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "rgba(23,18,58,0.03)" }}>
                  <tr><Th>Membre</Th><Th>Rôle</Th><Th>Correspondant LCB-FT</Th></tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <MemberRow key={m.userId} member={m} canManage={canManage} onChanged={load} />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#6F6A8A", lineHeight: 1.5 }}>
              Un correspondant peut valider les dossiers à risque des autres agents, mais jamais ceux qu&apos;il a lui-même instruits (principe des quatre yeux). Les administrateurs disposent également du droit de validation.
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MemberRow({ member, canManage, onChanged }: { member: Member; canManage: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      if (member.isCorrespondant) {
        await fetch(`/api/organisation/correspondants?userId=${encodeURIComponent(member.userId)}`, { method: "DELETE" });
      } else {
        await fetch("/api/organisation/correspondants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: member.userId }),
        });
      }
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr style={{ borderTop: "1px solid rgba(23,18,58,0.05)" }}>
      <Td style={{ fontWeight: 500, color: "#17123A" }}>{member.name}
        <div style={{ fontSize: 11, color: "#9792B4" }}>{member.email}</div>
      </Td>
      <Td>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: member.isAdmin ? "rgba(109,94,246,0.10)" : "rgba(151,146,180,0.12)", color: member.isAdmin ? "#5B46E0" : "#6F6A8A" }}>
          {member.isAdmin ? "Admin" : "Membre"}
        </span>
      </Td>
      <Td>
        {canManage ? (
          <button type="button" onClick={toggle} disabled={busy}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 8,
              border: `1px solid ${member.isCorrespondant ? "rgba(30,158,106,0.40)" : "rgba(23,18,58,0.15)"}`,
              background: member.isCorrespondant ? "rgba(30,158,106,0.10)" : "white",
              color: member.isCorrespondant ? "#177A52" : "#55506F",
              fontSize: 12, fontWeight: 600, cursor: busy ? "wait" : "pointer",
            }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : member.isCorrespondant ? <Check size={12} /> : <X size={12} />}
            {member.isCorrespondant ? "Désigné" : "Non désigné"}
          </button>
        ) : (
          <span style={{ fontSize: 12, color: member.isCorrespondant ? "#177A52" : "#9792B4", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {member.isCorrespondant ? <><ShieldCheck size={13} /> Désigné</> : "—"}
          </span>
        )}
      </Td>
    </tr>
  );
}

function NiveauBadge({ n }: { n: string | null }) {
  const cfg = {
    examen_renforce: { color: "#A3241F", bg: "rgba(197,48,44,0.10)", label: "Examen renforcé" },
    interdiction: { color: "white", bg: "#17123A", label: "Interdiction" },
  }[n ?? ""] ?? { color: "#6F6A8A", bg: "rgba(151,146,180,0.12)", label: n ?? "—" };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6F6A8A", ...style }}>{children}</th>;
}
function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 14px", verticalAlign: "top", ...style }}>{children}</td>;
}
