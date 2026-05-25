// app/dashboard/archives/page.tsx — Dossiers archivés (lecture seule)
//
// Les dossiers KYC archivés ne peuvent pas être modifiés (CMF L.561-12-1 :
// preuve à conserver 5 ans). Cette page liste ces dossiers en lecture seule.
// La consultation détaillée d'un dossier archivé reste possible — le serveur
// refuse les mutations (PATCH renvoie 409).

import { redirect } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import { Archive, ArrowLeft, ArrowRight, FileCheck } from "lucide-react";
import { getScope } from "@/lib/scope";
import { V1_TO_NIVEAU, type Niveau, NIVEAU_CFG } from "@/lib/tracfin";
import "../dashboard.css";

interface ArchivedRow {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  algo_version: "v1" | "v2";
  niveau: Niveau | null;
  statut: string | null;
  archived_at: string;
  created_at: string;
  kyc_status: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function resolveNiveau(d: ArchivedRow): Niveau | null {
  if (d.algo_version === "v2" && d.niveau) return d.niveau;
  if (d.statut) return V1_TO_NIVEAU[d.statut as keyof typeof V1_TO_NIVEAU] ?? null;
  return null;
}

export const dynamic = "force-dynamic";

export default async function ArchivesPage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  const rows = scope.isOrgContext
    ? (await sql`
        SELECT id, nom_prenom, type_client, algo_version, niveau, statut,
               archived_at, created_at, kyc_status
        FROM dossiers
        WHERE org_id = ${scope.orgId} AND archived_at IS NOT NULL
        ORDER BY archived_at DESC
        LIMIT 500
      `) as unknown as ArchivedRow[]
    : (await sql`
        SELECT id, nom_prenom, type_client, algo_version, niveau, statut,
               archived_at, created_at, kyc_status
        FROM dossiers
        WHERE user_id = ${scope.userId} AND org_id IS NULL AND archived_at IS NOT NULL
        ORDER BY archived_at DESC
        LIMIT 500
      `) as unknown as ArchivedRow[];

  return (
    <div className="dashboard-root">
      <div className="app">
        <main className="main">
          <div style={{ padding: "24px 28px 80px" }}>
            <Link
              href="/dashboard"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 10 }}
            >
              <ArrowLeft size={14} /> Retour au dashboard
            </Link>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 9px",
                borderRadius: 6,
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.18)",
                color: "#6d28d9",
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: 10,
              }}
            >
              <Archive size={11} /> Archives · conservation 5 ans
            </div>

            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: 0,
                background: "linear-gradient(135deg, #0F172A, #6d28d9)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Dossiers archivés
            </h1>
            <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 720 }}>
              {rows.length === 0 ? (
                <>Aucun dossier archivé. Les dossiers que vous archiverez apparaîtront ici en lecture seule, conservés <strong>5 ans</strong> conformément à l&apos;art. <strong>L.561-12-1 du CMF</strong>.</>
              ) : (
                <>{rows.length} dossier{rows.length > 1 ? "s" : ""} archivé{rows.length > 1 ? "s" : ""}. Lecture seule — les pièces, attestations et journal d&apos;audit sont conservés <strong>5 ans</strong> à compter de l&apos;archivage et restent consultables en cas de contrôle DGCCRF.</>
              )}
            </p>

            {rows.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  border: "1px solid rgba(15,23,42,0.08)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "white",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ background: "rgba(15,23,42,0.03)" }}>
                    <tr>
                      <th style={th}>Client</th>
                      <th style={th}>Type</th>
                      <th style={th}>Verdict final</th>
                      <th style={th}>Archivé le</th>
                      <th style={th}>Conservation jusqu&apos;au</th>
                      <th style={{ ...th, width: 60 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((d) => {
                      const niv = resolveNiveau(d);
                      const archivedAt = new Date(d.archived_at);
                      const retentionUntil = new Date(archivedAt);
                      retentionUntil.setFullYear(retentionUntil.getFullYear() + 5);
                      return (
                        <tr key={d.id} style={{ borderTop: "1px solid rgba(15,23,42,0.05)" }}>
                          <td style={td}>
                            <div style={{ fontWeight: 500, color: "#0f172a" }}>{d.nom_prenom}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                              Créé le {formatDate(d.created_at)}
                            </div>
                          </td>
                          <td style={{ ...td, color: "#64748b" }}>
                            {d.type_client === "morale" ? "Personne morale" : "Personne physique"}
                          </td>
                          <td style={td}>
                            {niv ? <NiveauBadge n={niv} /> : <span style={{ color: "#94a3b8" }}>—</span>}
                          </td>
                          <td style={{ ...td, color: "#64748b" }}>{formatDate(d.archived_at)}</td>
                          <td style={{ ...td, color: "#64748b", fontWeight: 500 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <FileCheck size={12} style={{ color: "#10b981" }} />
                              {formatDate(retentionUntil.toISOString())}
                            </span>
                          </td>
                          <td style={td}>
                            {d.kyc_status === "received" ? (
                              <Link
                                href={`/dashboard/${d.id}`}
                                style={{ color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5 }}
                                title="Consulter le dossier en lecture seule"
                              >
                                Consulter <ArrowRight size={12} />
                              </Link>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontSize: 12 }}>KYC incomplet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div
              style={{
                marginTop: 24,
                padding: 14,
                background: "rgba(124,58,237,0.04)",
                border: "1px dashed rgba(124,58,237,0.20)",
                borderRadius: 10,
                fontSize: 12,
                color: "#475569",
                lineHeight: 1.55,
              }}
            >
              <strong style={{ color: "#6d28d9" }}>Ce que dit la loi.</strong>{" "}
              L&apos;art. <strong>L.561-12-1 du CMF</strong> impose la conservation des pièces et données du KYC pendant <strong>5 ans</strong> à compter de la fin de la relation d&apos;affaires. Klaris bloque toute modification et conserve l&apos;intégralité du dossier (pièces, attestations, journal d&apos;audit) jusqu&apos;à expiration du délai légal. Aucune action n&apos;est requise de votre côté.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "#64748b",
};

const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "top" };

function NiveauBadge({ n }: { n: Niveau }) {
  const cfg = NIVEAU_CFG[n];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label.replace(/ — .*$/, "")}
    </span>
  );
}
