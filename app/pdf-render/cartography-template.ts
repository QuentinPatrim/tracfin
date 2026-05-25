// app/pdf-render/cartography-template.ts — HTML pour le PDF cartographie DGCCRF
//
// Document orienté contrôleur : sobre, dense, tableaux structurés. Imprimable A4,
// auto-suffisant (CSS inline, pas de dépendance externe).

import { klarisLogoSvg, formatDateLong, shortHash } from "@/lib/pdf-helpers";
import type { Cartography } from "@/lib/cartography";

interface BuildParams {
  carto: Cartography;
  generatedAt: string;
  hash: string;
  emetteur: string;
  /** Org name si dispo (sinon "Espace personnel"). */
  scopeLabel: string;
}

function fmtRange(start: string, end: string): string {
  return `${formatDateLong(start)} → ${formatDateLong(end)}`;
}

function fmtPct(n: number, total: number): string {
  if (total === 0) return "0 %";
  return `${Math.round((n / total) * 100)} %`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c] as string);
}

export function buildCartographyHtml(params: BuildParams): string {
  const { carto, generatedAt, hash, emetteur, scopeLabel } = params;
  const total = carto.totalActive;

  const niveauRow = (label: string, n: number, cls: string) => `
    <tr>
      <td><span class="badge ${cls}">${escapeHtml(label)}</span></td>
      <td class="num">${n}</td>
      <td class="num muted">${fmtPct(n, total)}</td>
    </tr>
  `;

  const countRows = (rows: Array<{ key: string; count: number; flagged?: boolean }>) =>
    rows.length === 0
      ? `<tr><td colspan="2" class="muted">— aucune occurrence —</td></tr>`
      : rows.slice(0, 10).map((r) => `
        <tr>
          <td>${r.flagged ? "🚩 " : ""}${escapeHtml(r.key)}</td>
          <td class="num">${r.count}</td>
        </tr>
      `).join("");

  const atRiskRows = carto.dossiersAtRisk.length === 0
    ? `<tr><td colspan="4" class="muted">— aucun dossier actif en examen renforcé ou interdiction —</td></tr>`
    : carto.dossiersAtRisk.map((d) => `
      <tr>
        <td>${escapeHtml(d.nom_prenom)}</td>
        <td>${d.type_client === "morale" ? "Personne morale" : "Personne physique"}</td>
        <td>${escapeHtml(d.niveau.replace(/_/g, " "))}</td>
        <td class="muted">${formatDateLong(d.updated_at)}</td>
      </tr>
    `).join("");

  const typologyRows = carto.topRiskTypologies.length === 0
    ? `<tr><td colspan="2" class="muted">— aucun signal de risque significatif —</td></tr>`
    : carto.topRiskTypologies.map((t) => `
      <tr>
        <td>${escapeHtml(t.key)}</td>
        <td class="num">${t.count}</td>
      </tr>
    `).join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Cartographie des risques LCB-FT — ${escapeHtml(scopeLabel)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif; color: #0B0822; margin: 0; font-size: 11pt; line-height: 1.45; }

  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #6d28d9; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-name { font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; }
  .brand-sub { font-size: 8.5pt; color: #7A7592; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 1px; }
  .meta { text-align: right; font-size: 9pt; color: #475569; line-height: 1.6; }
  .meta strong { color: #0B0822; }

  h1 { font-size: 19pt; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px; }
  h2 { font-size: 12pt; font-weight: 700; margin: 24px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #EDE9F4; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px; }

  .subtitle { font-size: 10pt; color: #475569; margin-bottom: 18px; }

  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi { padding: 10px 12px; border: 1px solid #EDE9F4; border-radius: 8px; background: #FAF8FE; }
  .kpi-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.4px; color: #6d28d9; margin-bottom: 3px; }
  .kpi-value { font-size: 22pt; font-weight: 800; line-height: 1; color: #0B0822; }
  .kpi-sub { font-size: 8.5pt; color: #64748b; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 10px; }
  th { text-align: left; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; padding: 7px 8px; border-bottom: 2px solid #EDE9F4; }
  td { padding: 7px 8px; border-bottom: 1px solid #F4F0FA; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  td.muted { color: #94a3b8; font-style: italic; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

  .panel { border: 1px solid #EDE9F4; border-radius: 8px; padding: 12px; }
  .panel-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #6d28d9; margin: 0 0 8px; }

  .badge { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 8.5pt; font-weight: 600; }
  .badge-green { background: #ECFDF5; color: #047857; }
  .badge-amber { background: #FEF3C7; color: #b45309; }
  .badge-red { background: #FEE2E2; color: #b91c1c; }
  .badge-black { background: #0B0822; color: #fff; }

  .legal { margin-top: 24px; padding: 12px; background: #FAF8FE; border: 1px dashed #c4b5fd; border-radius: 8px; font-size: 9pt; color: #475569; line-height: 1.55; }
  .legal strong { color: #6d28d9; }

  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #EDE9F4; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8pt; color: #94a3b8; }
  .footer .hash { font-family: "JetBrains Mono", "Courier New", monospace; color: #475569; }
</style>
</head>
<body>

  <header class="header">
    <div class="brand">
      ${klarisLogoSvg(48)}
      <div>
        <div class="brand-name">Klaris</div>
        <div class="brand-sub">Cartographie L.561-4-1 CMF</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Émetteur</strong><br>${escapeHtml(emetteur)}</div>
      <div style="margin-top: 6px"><strong>Périmètre</strong><br>${escapeHtml(scopeLabel)}</div>
      <div style="margin-top: 6px"><strong>Édité le</strong><br>${formatDateLong(generatedAt)}</div>
    </div>
  </header>

  <h1>Cartographie des risques BC/FT</h1>
  <div class="subtitle">
    Document opposable au titre de l&apos;article <strong>L.561-4-1 du Code monétaire et financier</strong>.
    Période couverte : <strong>${fmtRange(carto.rangeStart, carto.rangeEnd)}</strong>.
  </div>

  <!-- KPI grid -->
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Dossiers actifs</div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-sub">${carto.totalArchived} archivés (conservés 5 ans)</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Vigilance renforcée</div>
      <div class="kpi-value">${carto.niveau.vigilance_renforcee}</div>
      <div class="kpi-sub">${fmtPct(carto.niveau.vigilance_renforcee, total)} du portefeuille</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Examen renforcé</div>
      <div class="kpi-value">${carto.niveau.examen_renforce}</div>
      <div class="kpi-sub">${fmtPct(carto.niveau.examen_renforce, total)} du portefeuille</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Interdiction</div>
      <div class="kpi-value">${carto.niveau.interdiction}</div>
      <div class="kpi-sub">${fmtPct(carto.niveau.interdiction, total)} du portefeuille</div>
    </div>
  </div>

  <!-- Distribution niveau -->
  <h2>1. Distribution par niveau de vigilance</h2>
  <table>
    <thead>
      <tr><th>Niveau</th><th class="num">Effectif</th><th class="num">Part</th></tr>
    </thead>
    <tbody>
      ${niveauRow("Vigilance standard (L.561-5)", carto.niveau.vigilance_standard, "badge-green")}
      ${niveauRow("Vigilance renforcée (L.561-10)", carto.niveau.vigilance_renforcee, "badge-amber")}
      ${niveauRow("Examen renforcé (L.561-10-2)", carto.niveau.examen_renforce, "badge-red")}
      ${niveauRow("Interdiction (L.561-15)", carto.niveau.interdiction, "badge-black")}
    </tbody>
  </table>

  <!-- Risques transverses -->
  <h2>2. Risques transverses détectés</h2>
  <table>
    <thead><tr><th>Typologie</th><th class="num">Occurrences</th></tr></thead>
    <tbody>${typologyRows}</tbody>
  </table>

  <!-- Géographie -->
  <h2>3. Exposition géographique</h2>
  <div class="two-col">
    <div class="panel">
      <div class="panel-title">Résidence fiscale du client</div>
      <table>
        <thead><tr><th>Catégorie</th><th class="num">Effectif</th></tr></thead>
        <tbody>${countRows(carto.geographieResidence)}</tbody>
      </table>
    </div>
    <div class="panel">
      <div class="panel-title">Lieu du bien</div>
      <table>
        <thead><tr><th>Catégorie</th><th class="num">Effectif</th></tr></thead>
        <tbody>${countRows(carto.geographieLieuBien)}</tbody>
      </table>
    </div>
  </div>

  <!-- Origine fonds & opérations -->
  <h2>4. Origine des fonds et opérations</h2>
  <div class="three-col">
    <div class="panel">
      <div class="panel-title">Origine des fonds</div>
      <table><tbody>${countRows(carto.origineFonds)}</tbody></table>
    </div>
    <div class="panel">
      <div class="panel-title">Mode de paiement</div>
      <table><tbody>${countRows(carto.modePaiement)}</tbody></table>
    </div>
    <div class="panel">
      <div class="panel-title">Type de bien</div>
      <table><tbody>${countRows(carto.typeBien)}</tbody></table>
    </div>
  </div>

  <!-- Stats screening -->
  ${carto.screening.runsTotal > 0 ? `
  <h2>5. Activité screening sanctions (vérifications automatiques)</h2>
  <table>
    <thead><tr><th>Indicateur</th><th class="num">Valeur</th></tr></thead>
    <tbody>
      <tr><td>Nombre total de vérifications lancées</td><td class="num">${carto.screening.runsTotal}</td></tr>
      <tr><td>Vérifications avec ≥ 1 correspondance pertinente (≥ 50%)</td><td class="num">${carto.screening.runsWithMatches}</td></tr>
      ${carto.screening.topScore !== null ? `<tr><td>Score le plus élevé atteint</td><td class="num">${Math.round(carto.screening.topScore * 100)} %</td></tr>` : ""}
    </tbody>
  </table>
  ` : ""}

  <!-- Dossiers à risque -->
  <h2>${carto.screening.runsTotal > 0 ? "6" : "5"}. Dossiers actifs nécessitant une attention</h2>
  <table>
    <thead>
      <tr><th>Client</th><th>Type</th><th>Niveau</th><th>Dernière mise à jour</th></tr>
    </thead>
    <tbody>${atRiskRows}</tbody>
  </table>

  <!-- Méthodo / mention légale -->
  <div class="legal">
    <strong>Méthodologie et engagement.</strong>
    Cette cartographie est générée automatiquement par la plateforme Klaris à partir des dossiers KYC instruits sur la période indiquée.
    Les pays sont rapportés contre la liste grise/noire GAFI maintenue à jour dans l&apos;application.
    Les classifications s&apos;appuient sur l&apos;algorithme propriétaire Klaris v2, déterministe et versionné — chaque verdict est figé dans un snapshot immuable au moment de l&apos;émission de l&apos;attestation correspondante.
    La traçabilité des actions de l&apos;agent (création, modification, transition de niveau, émission d&apos;attestation, screening sanctions) est conservée dans un journal d&apos;audit horodaté inaltérable.
    Conformément aux lignes directrices DGCCRF (secteur immobilier, édition 2023), la cartographie doit faire l&apos;objet d&apos;une révision <strong>annuelle</strong> minimum,
    ainsi qu&apos;à chaque évolution significative de l&apos;activité ou du cadre réglementaire (transposition d&apos;une directive UE, mise à jour des listes GAFI, etc.).
  </div>

  <footer class="footer">
    <div>Klaris — Conformité LCB-FT pour les professionnels assujettis (CMF Art. L.561-2).</div>
    <div class="hash">SHA-256 ${shortHash(hash)}</div>
  </footer>

</body>
</html>`;
}
