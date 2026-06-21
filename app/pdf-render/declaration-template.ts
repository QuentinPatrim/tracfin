// app/pdf-render/declaration-template.ts — PDF déclaration de soupçon TRACFIN
//
// Document destiné à être joint à une soumission ERMES (portail TRACFIN), ou
// imprimé / scanné si l'agent utilise le formulaire papier. Format aligné sur
// la structure d'une DS officielle (CMF Art. L.561-15).

import { klarisLogoSvg, formatDateLong, shortHash } from "@/lib/pdf-helpers";
import type { DeclarationDraft } from "@/lib/declaration";

interface BuildParams {
  draft: DeclarationDraft;
  faits: string;                   // Champ libre rédigé/modifié par l'agent
  declarationId: string;
  generatedAt: string;
  hash: string;
  declarant: string;              // Nom + email du déclarant
  scopeLabel: string;             // "Organisation X" ou "Espace personnel"
  ermesRef?: string | null;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c] as string);
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

function fmtMontant(n: number | null): string {
  if (n === null) return "—";
  return `${n.toLocaleString("fr-FR")} €`;
}

export function buildDeclarationHtml(params: BuildParams): string {
  const { draft, faits, declarationId, generatedAt, hash, declarant, scopeLabel, ermesRef } = params;
  const isMorale = draft.soupconne.typeClient === "morale";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Déclaration de soupçon TRACFIN — ${escapeHtml(draft.soupconne.nomComplet)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 22mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif; color: #0B0822; margin: 0; font-size: 10.5pt; line-height: 1.5; }

  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 3px solid #b91c1c; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-name { font-size: 18pt; font-weight: 800; }
  .brand-sub { font-size: 8pt; color: #7A7592; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 1px; }
  .meta { text-align: right; font-size: 8.5pt; color: #475569; line-height: 1.55; }
  .meta strong { color: #0B0822; }

  h1 { font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px; color: #b91c1c; }
  h2 { font-size: 11pt; font-weight: 700; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #EDE9F4; color: #b91c1c; text-transform: uppercase; letter-spacing: 1px; }

  .subtitle { font-size: 9.5pt; color: #475569; margin-bottom: 16px; line-height: 1.55; }
  .subtitle strong { color: #0B0822; }

  .urgency { background: #FEE2E2; border-left: 4px solid #b91c1c; padding: 10px 12px; margin: 10px 0 18px; font-size: 9.5pt; color: #7f1d1d; }
  .urgency strong { color: #991b1b; }

  table.kv { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.kv td { padding: 5px 0; vertical-align: top; border-bottom: 1px solid #F4F0FA; }
  table.kv td.k { width: 40%; color: #64748b; font-weight: 500; }
  table.kv td.v { color: #0B0822; font-weight: 500; }
  table.kv td.v.muted { color: #94a3b8; font-style: italic; font-weight: 400; }

  .panel { border: 1px solid #EDE9F4; border-radius: 6px; padding: 12px; }
  .panel-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #b91c1c; margin: 0 0 8px; }

  .indices-list { list-style: none; padding: 0; margin: 0; font-size: 9.5pt; }
  .indice { padding: 8px 10px; margin-bottom: 6px; border-left: 3px solid #b91c1c; background: #FEF2F2; border-radius: 0 4px 4px 0; }
  .indice.rouge { border-color: #dc2626; }
  .indice.orange { border-color: #f59e0b; background: #FFFBEB; }
  .indice.gate { border-color: #0f172a; background: #F1F5F9; }
  .indice-type { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #b91c1c; margin-bottom: 2px; }
  .indice-type.gate { color: #0f172a; }
  .indice-type.orange { color: #b45309; }
  .indice-desc { color: #0B0822; }

  .expose { background: #FAF8FE; padding: 12px; border-radius: 6px; border: 1px solid #c4b5fd; font-size: 10pt; line-height: 1.6; }
  .expose strong { color: #6d28d9; }

  .pieces-list { font-size: 9.5pt; }
  .piece-item { display: flex; align-items: center; gap: 6px; padding: 4px 0; }
  .piece-bullet { width: 6px; height: 6px; border-radius: 50%; background: #b91c1c; flex-shrink: 0; }

  .ack-section { background: #ECFDF5; border: 2px solid #10b981; padding: 12px; margin-top: 14px; border-radius: 6px; }
  .ack-section .label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #047857; margin-bottom: 4px; }
  .ack-section .value { font-size: 11pt; font-weight: 700; color: #065f46; font-family: "JetBrains Mono", monospace; }

  .legal { margin-top: 24px; padding: 12px; background: #FAF8FE; border: 1px dashed #c4b5fd; border-radius: 6px; font-size: 8.5pt; color: #475569; line-height: 1.55; }
  .legal strong { color: #6d28d9; }

  .footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #EDE9F4; display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5pt; color: #94a3b8; }
  .footer .hash { font-family: "JetBrains Mono", "Courier New", monospace; color: #475569; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
</style>
</head>
<body>

  <header class="header">
    <div class="brand">
      ${klarisLogoSvg(48)}
      <div>
        <div class="brand-name">Klaris</div>
        <div class="brand-sub">Déclaration de soupçon · L.561-15 CMF</div>
      </div>
    </div>
    <div class="meta">
      <div><strong>Référence Klaris</strong><br>${declarationId.slice(0, 8).toUpperCase()}</div>
      <div style="margin-top: 5px"><strong>Édité le</strong><br>${formatDateLong(generatedAt)}</div>
      <div style="margin-top: 5px"><strong>Périmètre</strong><br>${escapeHtml(scopeLabel)}</div>
    </div>
  </header>

  <h1>Déclaration de soupçon</h1>
  <div class="subtitle">
    Document préparé par <strong>Klaris</strong> à destination du portail <strong>ERMES — TRACFIN</strong>
    (cellule française de renseignement financier, ministère de l&apos;Économie).
    Conformément à l&apos;article <strong>L.561-15 du Code monétaire et financier</strong>.
  </div>

  ${draft.niveau === "interdiction" ? `
  <div class="urgency">
    <strong>⚠ Niveau de vigilance : INTERDICTION (L.561-15)</strong> — la relation d&apos;affaires
    a été refusée ou doit être interrompue. La déclaration de soupçon est obligatoire.
    Délai légal de soumission à TRACFIN : <strong>48 heures</strong> à compter de la détection.
  </div>
  ` : `
  <div class="urgency">
    <strong>Niveau de vigilance : ${escapeHtml(draft.niveauLabel)}</strong> —
    L&apos;examen des éléments du dossier conduit à former un soupçon au sens de
    l&apos;article L.561-15 du CMF.
  </div>
  `}

  <!-- 1. Identification du déclarant -->
  <h2>1. Identification du déclarant</h2>
  <table class="kv">
    <tr><td class="k">Personne morale assujettie</td><td class="v">${escapeHtml(scopeLabel)}</td></tr>
    <tr><td class="k">Catégorie d&apos;assujetti (L.561-2)</td><td class="v">Agent immobilier (ou équivalent)</td></tr>
    <tr><td class="k">Déclarant désigné</td><td class="v">${escapeHtml(declarant)}</td></tr>
    <tr><td class="k">Date de détection des faits</td><td class="v">${formatDateLong(draft.dateDetection)}</td></tr>
    <tr><td class="k">Référence interne Klaris</td><td class="v">${draft.refKlaris.slice(0, 8).toUpperCase()}</td></tr>
  </table>

  <!-- 2. Identification du déclaré -->
  <h2>2. Identification de la personne déclarée</h2>
  <table class="kv">
    <tr><td class="k">Type de personne</td><td class="v">${isMorale ? "Personne morale" : "Personne physique"}</td></tr>
    <tr><td class="k">${isMorale ? "Dénomination sociale" : "Nom et prénom"}</td><td class="v">${escapeHtml(draft.soupconne.nomComplet)}</td></tr>
    ${isMorale ? `
      <tr><td class="k">Forme juridique</td><td class="v ${draft.soupconne.formeJuridique ? "" : "muted"}">${escapeHtml(draft.soupconne.formeJuridique ?? "Non renseigné")}</td></tr>
      <tr><td class="k">N° SIREN</td><td class="v ${draft.soupconne.siren ? "" : "muted"}">${escapeHtml(draft.soupconne.siren ?? "Non renseigné")}</td></tr>
      <tr><td class="k">Activité principale</td><td class="v ${draft.soupconne.activitePrincipale ? "" : "muted"}">${escapeHtml(draft.soupconne.activitePrincipale ?? "Non renseigné")}</td></tr>
      <tr><td class="k">Gérant / représentant légal</td><td class="v ${draft.soupconne.nomGerant ? "" : "muted"}">${escapeHtml(draft.soupconne.nomGerant ?? "Non renseigné")}</td></tr>
    ` : `
      <tr><td class="k">Date de naissance</td><td class="v ${draft.soupconne.dateNaissance ? "" : "muted"}">${draft.soupconne.dateNaissance ? formatDateLong(draft.soupconne.dateNaissance) : "Non renseigné"}</td></tr>
      <tr><td class="k">Lieu de naissance</td><td class="v ${draft.soupconne.lieuNaissance ? "" : "muted"}">${escapeHtml(draft.soupconne.lieuNaissance ?? "Non renseigné")}</td></tr>
      <tr><td class="k">Nationalité</td><td class="v ${draft.soupconne.nationalite ? "" : "muted"}">${escapeHtml(draft.soupconne.nationalite ?? "Non renseigné")}</td></tr>
      <tr><td class="k">Profession</td><td class="v ${draft.soupconne.profession ? "" : "muted"}">${escapeHtml(draft.soupconne.profession ?? "Non renseigné")}</td></tr>
    `}
    <tr><td class="k">Adresse</td><td class="v ${draft.soupconne.adresse ? "" : "muted"}">${escapeHtml(draft.soupconne.adresse ?? "Non renseigné")}</td></tr>
    <tr><td class="k">Pays de résidence fiscale (catégorie)</td><td class="v ${draft.soupconne.paysResidenceFiscale ? "" : "muted"}">${escapeHtml(draft.soupconne.paysResidenceFiscale ?? "Non renseigné")}</td></tr>
  </table>

  <!-- 3. Bénéficiaires effectifs (si PM) -->
  ${isMorale && draft.beneficiairesEffectifs.length > 0 ? `
    <h2>3. Bénéficiaires effectifs (L.561-2-2)</h2>
    <table class="kv">
      ${draft.beneficiairesEffectifs.map((b) => `
        <tr>
          <td class="k">${escapeHtml(b.nom || "—")}</td>
          <td class="v">
            ${b.pctDetention ? `${escapeHtml(b.pctDetention)} %` : "—"}
            ${b.typeControle ? ` · ${escapeHtml(b.typeControle === "capital" ? "Détention de capital" : b.typeControle === "vote" ? "Droits de vote" : "Contrôle effectif")}` : ""}
          </td>
        </tr>
      `).join("")}
    </table>
  ` : ""}

  <!-- 4. Opération -->
  <h2>${isMorale && draft.beneficiairesEffectifs.length > 0 ? "4" : "3"}. Opération concernée</h2>
  <table class="kv">
    <tr><td class="k">Type de bien</td><td class="v ${draft.operation.typeBien ? "" : "muted"}">${escapeHtml(draft.operation.typeBien ?? "Non renseigné")}</td></tr>
    <tr><td class="k">Lieu du bien</td><td class="v ${draft.operation.lieuBien ? "" : "muted"}">${escapeHtml(draft.operation.lieuBien ?? "Non renseigné")}</td></tr>
    <tr><td class="k">Montant de l&apos;opération</td><td class="v">${fmtMontant(draft.operation.montantEur)}</td></tr>
    <tr><td class="k">Origine des fonds déclarée</td><td class="v ${draft.operation.origineFonds ? "" : "muted"}">${escapeHtml(draft.operation.origineFonds ?? "Non renseigné")}</td></tr>
    <tr><td class="k">Mode de paiement</td><td class="v ${draft.operation.modePaiement ? "" : "muted"}">${escapeHtml(draft.operation.modePaiement ?? "Non renseigné")}</td></tr>
    <tr><td class="k">Montage financier</td><td class="v ${draft.operation.montageFinancier ? "" : "muted"}">${escapeHtml(draft.operation.montageFinancier ?? "Non renseigné")}</td></tr>
  </table>

  <!-- 5. Indices détectés (automatique) -->
  <h2>${isMorale && draft.beneficiairesEffectifs.length > 0 ? "5" : "4"}. Indices détectés (algorithme Klaris v2)</h2>
  ${draft.indices.length === 0
    ? `<p style="color:#94a3b8; font-style: italic;">Aucun indice automatiquement détecté. La déclaration repose sur l&apos;appréciation directe du déclarant — voir exposé des faits ci-dessous.</p>`
    : `<ul class="indices-list">
        ${draft.indices.map((idx) => `
          <li class="indice ${idx.severite}">
            <div class="indice-type ${idx.severite}">${escapeHtml(idx.severite === "gate" ? "Gate absolue" : idx.severite === "rouge" ? "Critère rouge" : "Critère orange")}</div>
            <div class="indice-desc">${escapeHtml(idx.description)}</div>
          </li>
        `).join("")}
      </ul>`
  }

  <!-- 6. Exposé des faits -->
  <h2>${isMorale && draft.beneficiairesEffectifs.length > 0 ? "6" : "5"}. Exposé des faits et motivation du soupçon</h2>
  <div class="expose">${nl2br(faits)}</div>

  <!-- 7. Pièces jointes -->
  ${draft.pieces.length > 0 ? `
    <h2>${isMorale && draft.beneficiairesEffectifs.length > 0 ? "7" : "6"}. Pièces jointes disponibles</h2>
    <div class="pieces-list">
      ${draft.pieces.map((p) => `
        <div class="piece-item">
          <span class="piece-bullet"></span>
          <span><strong>${escapeHtml(p.label)}</strong> — fichier ${escapeHtml(p.ext)} (réf. ${escapeHtml(p.key)})</span>
        </div>
      `).join("")}
    </div>
  ` : ""}

  <!-- 8. AR ERMES (si déjà obtenu) -->
  ${ermesRef ? `
    <div class="ack-section">
      <div class="label">Accusé de réception TRACFIN — ERMES</div>
      <div class="value">${escapeHtml(ermesRef)}</div>
    </div>
  ` : ""}

  <!-- Mention légale -->
  <div class="legal">
    <strong>Confidentialité et protection du déclarant.</strong>
    Cette déclaration est strictement confidentielle (Art. L.561-19 CMF).
    L&apos;identité du déclarant est protégée par la loi. Le client déclaré ne peut
    être informé qu&apos;une déclaration a été faite (interdiction de tipping-off).
    Le présent document est destiné exclusivement à TRACFIN et aux contrôles légaux.
    <br><br>
    <strong>Protection juridique du déclarant.</strong>
    L&apos;article L.561-22 du CMF exonère de toute responsabilité civile et pénale
    le déclarant de bonne foi, même si les faits déclarés s&apos;avèrent inexacts.
  </div>

  <footer class="footer">
    <div>Klaris — Conformité LCB-FT pour les professionnels assujettis (CMF Art. L.561-2).</div>
    <div class="hash">SHA-256 ${shortHash(hash)}</div>
  </footer>

</body>
</html>`;
}
