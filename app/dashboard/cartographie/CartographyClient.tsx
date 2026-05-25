// app/dashboard/cartographie/CartographyClient.tsx — UI de la cartographie risques

"use client";

import Link from "next/link";
import { useState } from "react";
import { FileDown, ShieldAlert, MapPin, AlertTriangle, Users, Building2, Activity, ArrowRight, ArrowLeft } from "lucide-react";
import type { Cartography } from "@/lib/cartography";

interface Props {
  carto: Cartography;
}

function fmtPct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function fmtRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })} → ${e.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
}

export default function CartographyClient({ carto }: Props) {
  const [exporting, setExporting] = useState(false);

  const total = carto.totalActive;
  const nVigilance = carto.niveau.vigilance_renforcee;
  const nExamen = carto.niveau.examen_renforce;
  const nInterdiction = carto.niveau.interdiction;
  const flaggedDossiers = nVigilance + nExamen + nInterdiction;

  const exportPdf = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/cartography/pdf");
      if (!res.ok) throw new Error("Échec de l'export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cartographie-risques-klaris-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px 80px" }}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
        <div>
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
            <ShieldAlert size={11} /> Cartographie L.561-4-1 CMF
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
            Cartographie des risques
          </h1>
          <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 640 }}>
            Synthèse opposable des risques BC/FT du portefeuille — {fmtRange(carto.rangeStart, carto.rangeEnd)}.
            Document à présenter en première intention lors d&apos;un contrôle DGCCRF (art. <strong>L.561-4-1 du CMF</strong>).
          </p>
        </div>

        <button
          type="button"
          onClick={exportPdf}
          disabled={exporting || total === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            background: exporting || total === 0
              ? "rgba(124,58,237,0.20)"
              : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "white",
            fontWeight: 600,
            fontSize: 13,
            border: 0,
            cursor: exporting || total === 0 ? "wait" : "pointer",
            boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <FileDown size={14} />
          {exporting ? "Génération…" : "Export PDF pour contrôle"}
        </button>
      </div>

      {/* ─── KPI principaux ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <KpiCard
          icon={Users}
          label="Dossiers actifs"
          value={total.toString()}
          sub={carto.totalArchived > 0 ? `+ ${carto.totalArchived} archivés` : "Sur la période"}
          tone="info"
        />
        <KpiCard
          icon={Activity}
          label="Vigilance renforcée"
          value={nVigilance.toString()}
          sub={`${fmtPct(nVigilance, total)} du portefeuille`}
          tone="warn"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Examen renforcé"
          value={nExamen.toString()}
          sub={`${fmtPct(nExamen, total)} du portefeuille`}
          tone="danger"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Interdiction"
          value={nInterdiction.toString()}
          sub={`${fmtPct(nInterdiction, total)} du portefeuille`}
          tone="critical"
        />
      </div>

      {/* ─── Risques transverses détectés ───────────────────────────── */}
      <Section title="Risques transverses détectés" sub="Cumul des signaux sur la période">
        {carto.topRiskTypologies.length === 0 ? (
          <EmptyState text="Aucun signal de risque significatif détecté sur la période." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {carto.topRiskTypologies.map((t) => (
              <TypologyCard key={t.key} label={t.key} count={t.count} />
            ))}
          </div>
        )}
      </Section>

      {/* ─── Géographie ─────────────────────────────────────────────── */}
      <Section title="Exposition géographique" sub="Pays en liste grise / noire GAFI flaggés en rouge">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <CountTable
            icon={MapPin}
            heading="Résidence fiscale du client"
            rows={carto.geographieResidence}
          />
          <CountTable
            icon={MapPin}
            heading="Lieu du bien"
            rows={carto.geographieLieuBien}
          />
        </div>
      </Section>

      {/* ─── Origine fonds & opérations ────────────────────────────── */}
      <Section title="Origine des fonds et opérations" sub="Distribution des modalités rencontrées">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <CountTable icon={Activity} heading="Origine des fonds" rows={carto.origineFonds} />
          <CountTable icon={Activity} heading="Mode de paiement" rows={carto.modePaiement} />
          <CountTable icon={Building2} heading="Type de bien" rows={carto.typeBien} />
        </div>
      </Section>

      {/* ─── Tendance mensuelle ─────────────────────────────────────── */}
      <Section title="Tendance mensuelle" sub="Évolution sur 12 mois — utile pour démontrer l'amélioration continue">
        <MonthlyChart monthly={carto.monthly} />
      </Section>

      {/* ─── Dossiers à examiner ────────────────────────────────────── */}
      <Section
        title="Dossiers nécessitant une attention"
        sub="Vigilance examen renforcé ou interdiction (action requise)"
      >
        {carto.dossiersAtRisk.length === 0 ? (
          <EmptyState text="Aucun dossier actif en examen renforcé ou interdiction." />
        ) : (
          <div style={{ border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "rgba(15,23,42,0.03)" }}>
                <tr>
                  <Th>Client</Th>
                  <Th>Type</Th>
                  <Th>Niveau</Th>
                  <Th>Maj.</Th>
                  <Th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {carto.dossiersAtRisk.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid rgba(15,23,42,0.05)" }}>
                    <Td style={{ fontWeight: 500, color: "#0f172a" }}>{d.nom_prenom}</Td>
                    <Td style={{ color: "#64748b" }}>{d.type_client === "morale" ? "Personne morale" : "Personne physique"}</Td>
                    <Td><NiveauBadge n={d.niveau} /></Td>
                    <Td style={{ color: "#64748b" }}>
                      {new Date(d.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </Td>
                    <Td>
                      <Link
                        href={`/dashboard/${d.id}`}
                        style={{ color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: 3 }}
                      >
                        Ouvrir <ArrowRight size={12} />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ─── Stats screening sanctions ──────────────────────────────── */}
      {carto.screening.runsTotal > 0 && (
        <Section
          title="Activité screening sanctions"
          sub="Appels au service de vérification automatique (OpenSanctions)"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <KpiCard icon={Activity} label="Vérifications" value={carto.screening.runsTotal.toString()} sub="Sur la période" tone="info" />
            <KpiCard
              icon={ShieldAlert}
              label="Correspondances"
              value={carto.screening.runsWithMatches.toString()}
              sub={`${fmtPct(carto.screening.runsWithMatches, carto.screening.runsTotal)} des vérifications`}
              tone={carto.screening.runsWithMatches > 0 ? "warn" : "info"}
            />
            {carto.screening.topScore !== null && (
              <KpiCard
                icon={AlertTriangle}
                label="Top score atteint"
                value={`${Math.round(carto.screening.topScore * 100)}%`}
                sub="Sur l'ensemble des vérifications"
                tone={carto.screening.topScore >= 0.85 ? "critical" : carto.screening.topScore >= 0.7 ? "warn" : "info"}
              />
            )}
          </div>
        </Section>
      )}

      {/* ─── Note méthodologique ─────────────────────────────────────── */}
      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: "rgba(124,58,237,0.04)",
          border: "1px dashed rgba(124,58,237,0.20)",
          borderRadius: 10,
          fontSize: 12,
          color: "#475569",
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: "#6d28d9" }}>Méthodologie.</strong>{" "}
        Cette cartographie est générée automatiquement à partir des dossiers KYC ayant été instruits dans Klaris sur la période indiquée.
        Les pays sont rapportés contre la liste grise/noire GAFI maintenue dans l&apos;application.
        Les critères de classification s&apos;appuient sur l&apos;algorithme propriétaire Klaris v2, versionné et déterministe (cf. attestations).
        La révision de la cartographie est recommandée <strong>annuellement</strong> (lignes directrices DGCCRF 2023 - secteur immobilier).
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#6d28d9" }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string; value: string; sub: string;
  tone: "info" | "warn" | "danger" | "critical";
}) {
  const colors = {
    info: { fg: "#6d28d9", bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.20)" },
    warn: { fg: "#b45309", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.25)" },
    danger: { fg: "#b91c1c", bg: "rgba(220,38,38,0.07)", border: "rgba(220,38,38,0.25)" },
    critical: { fg: "#0f172a", bg: "rgba(15,23,42,0.06)", border: "rgba(15,23,42,0.20)" },
  }[tone];

  return (
    <div
      style={{
        padding: 14,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: colors.fg, opacity: 0.85, marginBottom: 6 }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: colors.fg, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function TypologyCard({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        padding: 12,
        background: "white",
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12.5, color: "#0f172a" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          padding: "3px 8px",
          background: "rgba(124,58,237,0.10)",
          color: "#6d28d9",
          borderRadius: 999,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function CountTable({
  icon: Icon, heading, rows,
}: {
  icon: React.ComponentType<{ size?: number }>;
  heading: string;
  rows: Array<{ key: string; count: number; flagged?: boolean }>;
}) {
  return (
    <div style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6d28d9", marginBottom: 10 }}>
        <Icon size={12} /> {heading}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#94a3b8" }}>Aucune donnée sur la période.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.slice(0, 8).map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
              <span style={{ color: r.flagged ? "#b91c1c" : "#0f172a", fontWeight: r.flagged ? 600 : 400 }}>
                {r.flagged && "🚩 "}{r.key}
              </span>
              <span style={{ color: "#64748b", fontWeight: 500 }}>{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthlyChart({ monthly }: { monthly: Cartography["monthly"] }) {
  const maxTotal = Math.max(...monthly.map((m) => m.total), 1);

  return (
    <div style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginBottom: 8 }}>
        {monthly.map((m) => {
          const flagHeight = ((m.renforcee + m.examen + m.interdiction) / maxTotal) * 100;
          const totalHeight = (m.total / maxTotal) * 100;
          return (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}>
              <div
                style={{
                  height: `${totalHeight}%`,
                  background: "rgba(124,58,237,0.18)",
                  borderRadius: 4,
                  position: "relative",
                  minHeight: m.total > 0 ? 2 : 0,
                }}
                title={`${m.month} : ${m.total} dossiers (${m.renforcee + m.examen + m.interdiction} à risque)`}
              >
                {flagHeight > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${(flagHeight / totalHeight) * 100}%`,
                      background: "linear-gradient(180deg, #ef4444, #b91c1c)",
                      borderRadius: 4,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, fontSize: 10, color: "#94a3b8" }}>
        {monthly.map((m) => (
          <div key={m.month} style={{ flex: 1, textAlign: "center" }}>
            {m.month.slice(5)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#64748b" }}>
        <Legend color="rgba(124,58,237,0.30)" label="Total dossiers" />
        <Legend color="#dc2626" label="Dossiers à risque (renforcée+)" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: "inline-block" }} />
      {label}
    </span>
  );
}

function NiveauBadge({ n }: { n: string }) {
  const cfg = {
    vigilance_standard: { color: "#047857", bg: "rgba(16,185,129,0.10)", label: "Standard" },
    vigilance_renforcee: { color: "#b45309", bg: "rgba(245,158,11,0.12)", label: "Renforcée" },
    examen_renforce: { color: "#b91c1c", bg: "rgba(220,38,38,0.10)", label: "Examen" },
    interdiction: { color: "white", bg: "#0f172a", label: "Interdiction" },
  }[n] ?? { color: "#64748b", bg: "rgba(148,163,184,0.10)", label: n };

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 24,
        background: "rgba(16,185,129,0.04)",
        border: "1px dashed rgba(16,185,129,0.30)",
        borderRadius: 12,
        fontSize: 13,
        color: "#047857",
        textAlign: "center",
      }}
    >
      ✓ {text}
    </div>
  );
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 14px",
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "#64748b",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "10px 14px", ...style }}>{children}</td>;
}
