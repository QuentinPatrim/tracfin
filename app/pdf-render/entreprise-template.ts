// app/pdf-render/entreprise-template.ts — Fiche entreprise & classification des risques
//
// Document A4 présentable en contrôle (DGCCRF) : identité de l'assujetti (données
// registre + déclaratif), activités exercées, typologies de clientèle, obligations
// LCB-FT applicables et points de vigilance prioritaires dérivés par le moteur
// déterministe. Contribue à l'obligation de classification des risques (L.561-4-1).

import { klarisLogoSvg, formatDateLong } from "@/lib/pdf-helpers";
import { ACTIVITES, CLIENTELES, OBLIGATIONS_SOCLE, type VigilancePoint } from "@/lib/vigilance";

export interface EntrepriseProfileForPdf {
  siren: string;
  raisonSociale: string;
  formeJuridique: string;
  nafCode: string;
  nafLibelle: string;
  dateCreation: string;
  effectif: string;
  categorie: string;
  adresse: string;
  dirigeants: Array<{ nom: string; qualite: string }>;
  finances: Array<{ annee: string; ca: number | null; resultatNet: number | null }>;
  activites: string[];
  clienteles: string[];
  notes: string;
}

interface BuildParams {
  profile: EntrepriseProfileForPdf;
  vigilance: VigilancePoint[];
  generatedAt: string;
  scopeLabel: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c] as string);
}

const fmtEuro = (n: number) =>
  `${n.toLocaleString("fr-FR")} €`;

const labelOf = (key: string): string =>
  ACTIVITES.find((a) => a.key === key)?.label ?? CLIENTELES.find((c) => c.key === key)?.label ?? key;

export function buildEntrepriseHtml({ profile, vigilance, generatedAt, scopeLabel }: BuildParams): string {
  const p = profile;
  const kv = (k: string, v: string | null | undefined) => `
    <tr><td class="k">${escapeHtml(k)}</td><td class="v ${v ? "" : "muted"}">${v ? escapeHtml(v) : "Non renseigné"}</td></tr>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Fiche entreprise & classification des risques — ${escapeHtml(p.raisonSociale)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 22mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif; color: #0B0822; margin: 0; font-size: 10.5pt; line-height: 1.5; }

  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 3px solid #7c3aed; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-name { font-size: 18pt; font-weight: 800; }
  .brand-sub { font-size: 8pt; color: #7A7592; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 1px; }
  .meta { text-align: right; font-size: 8.5pt; color: #475569; line-height: 1.55; }
  .meta strong { color: #0B0822; }

  h1 { font-size: 17pt; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px; color: #4c1d95; }
  h2 { font-size: 11pt; font-weight: 700; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #EDE9F4; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px; }
  .subtitle { font-size: 9.5pt; color: #475569; margin-bottom: 14px; line-height: 1.55; }
  .subtitle strong { color: #0B0822; }

  table.kv { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.kv td { padding: 5px 0; vertical-align: top; border-bottom: 1px solid #F4F0FA; }
  table.kv td.k { width: 38%; color: #64748b; font-weight: 500; }
  table.kv td.v { color: #0B0822; font-weight: 600; }
  table.kv td.v.muted { color: #94a3b8; font-style: italic; font-weight: 400; }

  .chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .chip { font-size: 8.5pt; padding: 3px 9px; border-radius: 999px; background: #F5F0FF; border: 1px solid #DDD1FA; color: #4c1d95; font-weight: 600; }

  .vig { padding: 8px 11px; margin-bottom: 6px; border-left: 3px solid #dc2626; background: #FEF2F2; border-radius: 0 4px 4px 0; page-break-inside: avoid; }
  .vig.moyenne { border-color: #d97706; background: #FFFBEB; }
  .vig-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .vig-prio { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
  .vig.moyenne .vig-prio { color: #b45309; }
  .vig-ref { font-size: 7.5pt; color: #94a3b8; }
  .vig-titre { font-weight: 700; font-size: 10pt; color: #0B0822; }
  .vig-detail { font-size: 9pt; color: #334155; margin-top: 2px; }
  .vig-src { font-size: 7.5pt; color: #94a3b8; margin-top: 3px; }

  .obl { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F4F0FA; page-break-inside: avoid; }
  .obl-check { color: #047857; font-weight: 800; flex-shrink: 0; }
  .obl-titre { font-weight: 700; font-size: 9.5pt; }
  .obl-ref { font-size: 8pt; color: #7c3aed; margin-left: 6px; font-weight: 600; }
  .obl-detail { font-size: 8.5pt; color: #475569; }

  .notes { background: #FAF8FE; padding: 10px 12px; border-radius: 6px; border: 1px solid #DDD1FA; font-size: 9.5pt; }

  .legal { margin-top: 22px; padding: 11px 13px; background: #FAF8FE; border: 1px dashed #c4b5fd; border-radius: 6px; font-size: 8.5pt; color: #475569; line-height: 1.55; }
  .legal strong { color: #6d28d9; }

  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #EDE9F4; display: flex; justify-content: space-between; font-size: 7.5pt; color: #94a3b8; }
</style>
</head>
<body>

  <header class="header">
    <div class="brand">
      ${klarisLogoSvg(48)}
      <div>
        <div class="brand-name">Klaris</div>
        <div class="brand-sub">Fiche entreprise · Conformité LCB-FT</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Édité le</strong><br>${formatDateLong(generatedAt)}</div>
      <div style="margin-top: 5px"><strong>Périmètre</strong><br>${escapeHtml(scopeLabel)}</div>
    </div>
  </header>

  <h1>Fiche entreprise &amp; classification des risques</h1>
  <div class="subtitle">
    Profil de conformité LCB-FT de l&apos;assujetti — identité, activités, typologies de
    clientèle, obligations applicables et points de vigilance prioritaires. Document
    contribuant à l&apos;obligation de classification des risques (<strong>CMF art. L.561-4-1</strong>),
    présentable en cas de contrôle (DGCCRF).
  </div>

  <h2>1. Identité de l'entreprise</h2>
  <table class="kv">
    ${kv("Raison sociale", p.raisonSociale)}
    ${kv("SIREN", p.siren)}
    ${kv("Forme juridique", p.formeJuridique)}
    ${kv("Activité principale (NAF)", p.nafLibelle ? `${p.nafLibelle}${p.nafCode ? ` (${p.nafCode})` : ""}` : p.nafCode)}
    ${kv("Date de création", p.dateCreation ? formatDateLong(p.dateCreation) : null)}
    ${kv("Effectif", p.effectif)}
    ${kv("Catégorie", p.categorie)}
    ${kv("Adresse du siège", p.adresse)}
    ${p.dirigeants.length > 0
      ? kv("Dirigeant(s)", p.dirigeants.map((d) => `${d.nom}${d.qualite ? ` (${d.qualite})` : ""}`).join(" · "))
      : ""}
    ${p.finances.length > 0
      ? kv("Chiffre d'affaires", p.finances.filter((f) => f.ca != null).map((f) => `${f.annee} : ${fmtEuro(f.ca as number)}`).join(" · ") || null)
      : ""}
  </table>

  <h2>2. Activités exercées</h2>
  ${p.activites.length > 0
    ? `<div class="chips">${p.activites.map((a) => `<span class="chip">${escapeHtml(labelOf(a))}</span>`).join("")}</div>`
    : `<p style="color:#94a3b8; font-style: italic; font-size: 9.5pt;">Aucune activité déclarée.</p>`}

  <h2>3. Typologies de clientèle</h2>
  ${p.clienteles.length > 0
    ? `<div class="chips">${p.clienteles.map((c) => `<span class="chip">${escapeHtml(labelOf(c))}</span>`).join("")}</div>`
    : `<p style="color:#94a3b8; font-style: italic; font-size: 9.5pt;">Aucune typologie déclarée.</p>`}

  <h2>4. Points de vigilance prioritaires</h2>
  ${vigilance.length === 0
    ? `<p style="color:#94a3b8; font-style: italic; font-size: 9.5pt;">Aucun point conditionnel — les obligations socle s'appliquent.</p>`
    : vigilance.map((v) => `
      <div class="vig ${v.priorite}">
        <div class="vig-head">
          <span class="vig-prio">${v.priorite === "haute" ? "Priorité haute" : "À surveiller"}</span>
          <span class="vig-ref">${escapeHtml(v.ref)}</span>
        </div>
        <div class="vig-titre">${escapeHtml(v.titre)}</div>
        <div class="vig-detail">${escapeHtml(v.detail)}</div>
        <div class="vig-src">Déclenché par : ${escapeHtml(v.declencheurs.join(", "))}</div>
      </div>
    `).join("")}

  <h2>5. Obligations LCB-FT applicables (socle)</h2>
  ${OBLIGATIONS_SOCLE.map((o) => `
    <div class="obl">
      <span class="obl-check">✓</span>
      <div>
        <span class="obl-titre">${escapeHtml(o.titre)}</span><span class="obl-ref">${escapeHtml(o.ref)}</span>
        <div class="obl-detail">${escapeHtml(o.detail)}</div>
      </div>
    </div>
  `).join("")}

  ${p.notes ? `
    <h2>6. Précisions de l'assujetti</h2>
    <div class="notes">${escapeHtml(p.notes).replace(/\n/g, "<br>")}</div>
  ` : ""}

  <div class="legal">
    <strong>Nature du document.</strong> Cette fiche est établie par l&apos;assujetti à partir des
    données du registre officiel des entreprises (INSEE/INPI) et de ses déclarations dans
    Klaris. Les points de vigilance sont dérivés par un moteur de règles déterministe et
    auditable. Elle contribue à la classification des risques exigée par l&apos;article
    L.561-4-1 du Code monétaire et financier et doit être tenue à jour en cas d&apos;évolution
    des activités ou de la clientèle.
  </div>

  <footer class="footer">
    <span>Klaris — plateforme française de conformité LCB-FT</span>
    <span>Édité le ${formatDateLong(generatedAt)}</span>
  </footer>

</body>
</html>`;
}
