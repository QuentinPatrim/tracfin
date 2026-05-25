// app/pdf-render/kyc-template.ts — Fiche KYC EXHAUSTIVE (3 pages A4)
// Toutes les déclarations du client visibles, y compris commentaires, précisions PPE,
// BE structurés, justifs d'origine spécifiques.

import {
  ORIGINE_FONDS_OPTIONS, MODE_FINANCEMENT_OPTIONS, MODE_PAIEMENT_OPTIONS,
  TYPE_BIEN_OPTIONS, SECTEUR_ACTIVITE_OPTIONS, PAYS_OPTIONS,
  FORME_JURIDIQUE_OPTIONS, PIECE_IDENTITE_TYPES, TYPE_CONTROLE_BE_OPTIONS,
  MENTION_CNIL_VERSION,
  type KycForm,
} from "@/lib/kyc";
import { formatDateLong, shortHash, formatMontant, klarisLogoSvg } from "@/lib/pdf-helpers";
import { PDF_RENDER_CSS } from "./render-styles";

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const fmtDateShort = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
};

const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const optLabel = <T extends { value: string; label: string }>(
  options: readonly T[],
  value: string,
): string => options.find((o) => o.value === value)?.label ?? (value || "—");

const has = (s: string | null | undefined): s is string => !!(s && s.trim());

interface BuildKycOpts {
  form: KycForm;
  dossierId: string;
  hash: string;
  generatedAt: string;
  signedAt: string;
  /** Rôle du client dans la transaction immobilière (defaut acquéreur pour legacy). */
  partie?: "vendeur" | "acquereur";
}

const DOC_ID_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h5"/><path d="M14 14h4"/></svg>`;
const DOC_HOME_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/></svg>`;
const DOC_BIZ_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
const DOC_FILE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`;
const DOC_RECEIPT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`;

export function buildKycHtml(opts: BuildKycOpts): string {
  const { form, dossierId, hash, generatedAt, signedAt } = opts;
  const partie = opts.partie ?? "acquereur";
  const isVendeur = partie === "vendeur";
  const roleLabel = isVendeur ? "Vendeur" : "Acquéreur";
  const isMorale = form.typeClient === "morale";
  const dossierShort = `#${dossierId.slice(0, 8).toUpperCase()}`;
  const today = formatDateLong(generatedAt);
  const sigDate = new Date(signedAt).toLocaleDateString("fr-FR");
  const sigTime = fmtTime(signedAt);

  // ─── Inventaire des pièces ──────────────────────────────────────────
  type PieceDef = { icon: string; key: string; provided: boolean; required: boolean };
  const justifOrigineLabel = isVendeur ? "Justificatif d'origine du bien" : "Justificatif d'origine fonds";
  const pieces: PieceDef[] = isMorale
    ? [
        { icon: DOC_BIZ_SVG,    key: "Extrait Kbis (-3 mois)",       provided: !!form.urlKbis,           required: true  },
        { icon: DOC_FILE_SVG,   key: "Statuts à jour",               provided: !!form.urlStatuts,        required: false },
        { icon: DOC_ID_SVG,     key: "CNI du gérant",                provided: !!form.urlCniGerant,      required: true  },
        { icon: DOC_ID_SVG,     key: "Pièce d'identité",             provided: !!form.urlPieceIdentite,  required: true  },
        { icon: DOC_HOME_SVG,   key: "Justificatif de domicile",     provided: !!form.urlJustifDomicile, required: true  },
        { icon: DOC_RECEIPT_SVG,key: "Bilans / liasses fiscales",    provided: !!form.urlBilans,         required: false },
        { icon: DOC_FILE_SVG,   key: "Registre bénéf. effectifs",    provided: !!form.urlRbe,            required: false },
        { icon: DOC_RECEIPT_SVG,key: justifOrigineLabel,             provided: !!form.urlJustifOrigineFonds, required: false },
      ]
    : isVendeur
    ? [
        { icon: DOC_ID_SVG,     key: "Pièce d'identité",             provided: !!form.urlPieceIdentite,  required: true  },
        { icon: DOC_HOME_SVG,   key: "Justificatif de domicile",     provided: !!form.urlJustifDomicile, required: true  },
        { icon: DOC_RECEIPT_SVG,key: justifOrigineLabel,             provided: !!form.urlJustifOrigineFonds, required: false },
      ]
    : [
        { icon: DOC_ID_SVG,     key: "Pièce d'identité",             provided: !!form.urlPieceIdentite,  required: true  },
        { icon: DOC_HOME_SVG,   key: "Justificatif de domicile",     provided: !!form.urlJustifDomicile, required: true  },
        { icon: DOC_RECEIPT_SVG,key: "Avis d'imposition",            provided: !!form.urlAvisImposition, required: false },
        { icon: DOC_RECEIPT_SVG,key: "Justificatifs de revenus",     provided: !!form.urlJustifRevenus,  required: false },
        { icon: DOC_RECEIPT_SVG,key: justifOrigineLabel,             provided: !!form.urlJustifOrigineFonds, required: false },
      ];
  const piecesProvided = pieces.filter((p) => p.provided).length;
  const piecesRequired = pieces.filter((p) => p.required).length;
  const piecesRequiredOk = pieces.filter((p) => p.required && p.provided).length;
  const allRequiredOk = piecesRequiredOk === piecesRequired;

  // ─── Champs identité ──────────────────────────────────────────────────
  const idFields: Array<{ k: string; v: string; mono?: boolean; full?: boolean }> = [
    { k: "Rôle dans l'opération", v: roleLabel },
    { k: "Type", v: isMorale ? "Personne morale (société)" : "Personne physique" },
    { k: isMorale ? "Dénomination sociale" : "Nom et prénom", v: form.nomPrenom || "—" },
    ...(has(form.emailContact) ? [{ k: "Email", v: form.emailContact, mono: true }] : []),
    ...(has(form.telephone) ? [{ k: "Téléphone", v: form.telephone, mono: true }] : []),
    ...(has(form.dateNaissance) ? [{ k: isMorale ? "Date de constitution" : "Date de naissance", v: fmtDateShort(form.dateNaissance), mono: true }] : []),
    ...(has(form.lieuNaissance) ? [{ k: "Lieu de naissance", v: form.lieuNaissance }] : []),
    ...(has(form.nationalite) ? [{ k: "Nationalité", v: form.nationalite }] : []),
    ...(has(form.paysNationalite) ? [{ k: isMorale ? "Pays d'immatriculation" : "Pays d'origine (cat.)", v: optLabel(PAYS_OPTIONS, form.paysNationalite) }] : []),
    ...(has(form.profession) ? [{ k: "Profession", v: form.profession }] : []),
    ...(has(form.secteurActivite) ? [{ k: "Secteur d'activité", v: optLabel(SECTEUR_ACTIVITE_OPTIONS, form.secteurActivite) }] : []),
    ...(has(form.paysResidenceFiscale) ? [{ k: "Résidence fiscale (cat.)", v: optLabel(PAYS_OPTIONS, form.paysResidenceFiscale) }] : []),
    ...(has(form.adresse) ? [{ k: isMorale ? "Adresse du siège" : "Adresse complète", v: form.adresse, full: true }] : []),
  ];

  // ─── Champs personne morale (forme, SIREN, etc.) ─────────────────────
  const moraleFields: Array<{ k: string; v: string; mono?: boolean; full?: boolean }> = isMorale ? [
    ...(has(form.formeJuridique) ? [{ k: "Forme juridique", v: optLabel(FORME_JURIDIQUE_OPTIONS, form.formeJuridique) }] : []),
    ...(has(form.siren) ? [{ k: "SIREN", v: form.siren, mono: true }] : []),
    ...(has(form.dateConstitution) ? [{ k: "Date de constitution", v: fmtDateShort(form.dateConstitution), mono: true }] : []),
    ...(has(form.activitePrincipale) ? [{ k: "Activité principale", v: form.activitePrincipale, full: true }] : []),
    ...(has(form.nomGerant) ? [{ k: "Gérant / représentant légal", v: form.nomGerant, full: true }] : []),
  ] : [];

  // ─── Pièce d'identité (détaillée) ───────────────────────────────────
  const pieceIdFields: Array<{ k: string; v: string; mono?: boolean }> = [
    ...(has(form.pieceIdentiteType) ? [{ k: "Type de pièce", v: optLabel(PIECE_IDENTITE_TYPES, form.pieceIdentiteType) }] : []),
    ...(has(form.pieceIdentiteNumero) ? [{ k: "Numéro", v: form.pieceIdentiteNumero, mono: true }] : []),
    ...(has(form.pieceIdentiteExpiration) ? [{ k: "Date d'expiration", v: fmtDateShort(form.pieceIdentiteExpiration), mono: true }] : []),
    ...(has(form.pieceIdentiteAutorite) ? [{ k: "Autorité de délivrance", v: form.pieceIdentiteAutorite }] : []),
  ];

  // ─── PPE détail ──────────────────────────────────────────────────────
  const ppeClient = form.ppe === true;
  const ppeProche = form.ppeProcheDetecte === true;

  // Header / footer réutilisables
  const headerHtml = (tag: string) => `
  <header class="doc-head">
    <div class="brand">
      <div class="logo">${klarisLogoSvg(36)}</div>
      <div class="name">Klaris</div>
      <div class="tag">${escapeHtml(tag)}</div>
    </div>
    <div class="meta">
      <div class="col">
        <div class="label">Dossier</div>
        <div class="val">${dossierShort}</div>
      </div>
      <div class="col">
        <div class="label">Généré le</div>
        <div class="val regular">${today}</div>
      </div>
    </div>
  </header>`;

  const footerHtml = (pageNum: number, totalPages: number, withHash = false) => `
  <footer class="doc-foot">
    <span class="conf-tag"><span class="d"></span>Document confidentiel · Données client</span>
    <span class="gen-tag">${withHash ? `SHA-256 · ${shortHash(hash)}  ·  ` : ""}Généré par <span class="lk">Klaris</span> · Page ${pageNum} / ${totalPages}</span>
  </footer>`;

  // Render commun pour une grille de champs
  const renderGrid = (fields: Array<{ k: string; v: string; mono?: boolean; full?: boolean }>) => `
    <div class="grid">
      ${fields.map((f) => `
        <div class="field"${f.full ? ' style="grid-column:1 / -1"' : ''}>
          <span class="k">${escapeHtml(f.k)}</span>
          <span class="v${f.mono ? " mono" : ""}">${escapeHtml(f.v)}</span>
        </div>
      `).join("")}
    </div>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Klaris — Fiche KYC ${dossierShort}</title>
<style>${PDF_RENDER_CSS}</style>
</head>
<body>

<!-- =================== PAGE 1 — STATUT + IDENTITÉ =================== -->
<article class="page">
  ${headerHtml("KYC")}

  <div class="title-row">
    <div>
      <h1 class="doc-title">Fiche Know Your<br/>Customer (KYC)</h1>
      <div class="doc-sub">Déclarations et informations recueillies auprès du client lors de l'entrée en relation, en qualité de <b>${escapeHtml(roleLabel.toLowerCase())}</b>. Données chiffrées (TLS 1.3 + AES-256), hébergées en France.</div>
    </div>
    <div class="stamp"><span class="pulse"></span>Vérifié par Klaris</div>
  </div>

  <section class="verdict ${allRequiredOk ? "ok" : "warn"}">
    <div class="glow"></div>
    <div class="vlabel"><span class="ic"></span>Statut du dossier</div>
    <h2>${allRequiredOk ? "Dossier complet" : "Pièces obligatoires en attente"}</h2>
    <p class="lead">${allRequiredOk
      ? "Toutes les pièces obligatoires ont été collectées. Le dossier est prêt pour évaluation LCB-FT."
      : `Il manque ${piecesRequired - piecesRequiredOk} pièce(s) obligatoire(s) pour finaliser ce dossier.`}</p>

    <!-- Compteurs factuels (remplace l'ancienne progress bar arbitraire) -->
    <div class="signal-row">
      <div class="signal ${allRequiredOk ? "ok" : "warn"}">
        <span class="d"></span>
        <b>${piecesRequiredOk} / ${piecesRequired}</b> pièce${piecesRequired > 1 ? "s" : ""} obligatoire${piecesRequired > 1 ? "s" : ""}
      </div>
      <div class="signal ${form.consentementRgpd ? "ok" : "crit"}">
        <span class="d"></span>
        Consentement RGPD ${form.consentementRgpd ? "donné" : "manquant"}
      </div>
    </div>

    <div class="stat-row">
      <div class="stat">Pièces totales · <b>${piecesProvided} / ${pieces.length}</b></div>
      <div class="stat">Source · <b>Lien client sécurisé</b></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">01</span>
      <span class="ttl">Identité du client</span>
      <span class="accent"></span>
    </div>
    ${renderGrid(idFields)}
  </section>

  ${isMorale && moraleFields.length > 0 ? `
  <section class="section">
    <div class="section-head">
      <span class="num">02</span>
      <span class="ttl">Informations société</span>
      <span class="accent"></span>
    </div>
    ${renderGrid(moraleFields)}
  </section>` : ""}

  ${footerHtml(1, 3)}
</article>

<!-- =================== PAGE 2 — PIÈCE D'IDENTITÉ + PPE + BE + OPÉRATION =================== -->
<article class="page">
  ${headerHtml("KYC · suite")}

  ${pieceIdFields.length > 0 ? `
  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">${isMorale ? "03" : "02"}</span>
      <span class="ttl">Pièce d'identité (Arrêté 6 janvier 2021)</span>
      <span class="accent"></span>
    </div>
    ${renderGrid(pieceIdFields)}
  </section>` : ""}

  <section class="section">
    <div class="section-head">
      <span class="num">${isMorale ? "04" : "03"}</span>
      <span class="ttl">Personne politiquement exposée (PPE)</span>
      <span class="accent"></span>
    </div>
    <div class="grid">
      <div class="field">
        <span class="k">${isMorale ? "Représentant PPE ?" : "Client PPE ?"}</span>
        <span class="v">${form.ppe === null ? "Non renseigné" : ppeClient ? "Oui — vigilance renforcée" : "Non"}</span>
      </div>
      <div class="field">
        <span class="k">Proche d'une PPE ?</span>
        <span class="v">${form.ppeProcheDetecte === null ? "Non renseigné" : ppeProche ? "Oui — vigilance renforcée" : "Non"}</span>
      </div>
      ${ppeClient && has(form.ppePrecisions) ? `
      <div class="field" style="grid-column:1 / -1">
        <span class="k">Précisions sur la fonction</span>
        <span class="v">${escapeHtml(form.ppePrecisions)}</span>
      </div>` : ""}
      ${ppeProche && has(form.ppeProchePrecisions) ? `
      <div class="field" style="grid-column:1 / -1">
        <span class="k">Précisions sur le proche</span>
        <span class="v">${escapeHtml(form.ppeProchePrecisions)}</span>
      </div>` : ""}
    </div>
  </section>

  ${isMorale && form.beneficiairesEffectifsJson.length > 0 ? `
  <section class="section">
    <div class="section-head">
      <span class="num">05</span>
      <span class="ttl">Bénéficiaires effectifs (art. R.561-1 CMF)</span>
      <span class="accent"></span>
    </div>
    <div class="criteria">
      ${form.beneficiairesEffectifsJson.map((be, i) => `
        <div class="crit">
          <div class="lbl">
            <div class="ix">${String(i + 1).padStart(2, "0")}</div>
            <div>
              <div class="name">${escapeHtml(be.nom || "—")}</div>
              <div class="meta-line">${has(be.pctDetention) ? `${escapeHtml(be.pctDetention)}% du capital` : ""} ${has(be.typeControle) ? ` · ${escapeHtml(optLabel(TYPE_CONTROLE_BE_OPTIONS, be.typeControle))}` : ""}</div>
            </div>
          </div>
          <span class="badge violet"><span class="d"></span>BE déclaré</span>
        </div>
      `).join("")}
    </div>
  </section>` : ""}

  <section class="section">
    <div class="section-head">
      <span class="num">${isMorale ? "06" : "04"}</span>
      <span class="ttl">${isVendeur ? "Le bien vendu" : "L'opération immobilière"}</span>
      <span class="accent"></span>
    </div>
    <div class="tx-grid">
      ${has(form.typeBien) ? `<div class="tx-card"><div class="k">Type de bien</div><div class="v">${escapeHtml(optLabel(TYPE_BIEN_OPTIONS, form.typeBien))}</div></div>` : ""}
      ${has(form.lieuBien) ? `<div class="tx-card"><div class="k">Adresse du bien</div><div class="v">${escapeHtml(form.lieuBien)}</div></div>` : ""}
      ${has(form.montantOperation) ? `<div class="tx-card"><div class="k">${isVendeur ? "Prix de vente" : "Montant"}</div><div class="v">${formatMontant(form.montantOperation)} €</div></div>` : ""}
      ${!isVendeur && has(form.modeFinancement) ? `<div class="tx-card"><div class="k">Mode de financement</div><div class="v">${escapeHtml(optLabel(MODE_FINANCEMENT_OPTIONS, form.modeFinancement))}</div></div>` : ""}
      ${!isVendeur && has(form.modePaiement) ? `<div class="tx-card"><div class="k">Mode de paiement</div><div class="v">${escapeHtml(optLabel(MODE_PAIEMENT_OPTIONS, form.modePaiement))}</div></div>` : ""}
      ${has(form.origineFonds) ? `<div class="tx-card"><div class="k">${isVendeur ? "Origine du bien vendu" : "Origine principale des fonds"}</div><div class="v">${escapeHtml(optLabel(ORIGINE_FONDS_OPTIONS, form.origineFonds))}</div></div>` : ""}
    </div>

    ${(has(form.origineFondsVenteAdresse) || has(form.origineFondsDonateur) || has(form.origineFondsLienDefunt) || has(form.origineFondsPrecisions)) ? `
    <div class="reco" style="margin-top:14px">
      <div class="label">${isVendeur ? "Détails sur l'origine du bien" : "Détails sur l'origine des fonds"}</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;font-size:13px;color:var(--ink-2);line-height:1.55">
        ${has(form.origineFondsVenteAdresse) ? `<div><b>${isVendeur ? "Bien initial" : "Bien vendu"} :</b> ${escapeHtml(form.origineFondsVenteAdresse)}</div>` : ""}
        ${has(form.origineFondsDonateur) ? `<div><b>Donateur :</b> ${escapeHtml(form.origineFondsDonateur)}</div>` : ""}
        ${has(form.origineFondsLienDefunt) ? `<div><b>Défunt :</b> ${escapeHtml(form.origineFondsLienDefunt)}</div>` : ""}
        ${has(form.origineFondsPrecisions) ? `<div><b>Commentaires :</b> ${escapeHtml(form.origineFondsPrecisions)}</div>` : ""}
      </div>
    </div>` : ""}
  </section>

  ${footerHtml(2, 3)}
</article>

<!-- =================== PAGE 3 — PIÈCES + DÉCLARATION + CONSENTEMENT =================== -->
<article class="page">
  ${headerHtml("KYC · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">${isMorale ? "07" : "05"}</span>
      <span class="ttl">Pièces justificatives</span>
      <span class="accent"></span>
    </div>
    <div class="docs-grid">
      ${pieces.map((p) => `
        <div class="doc">
          <div class="left">
            <div class="icn">${p.icon}</div>
            <div>
              <div class="k">${escapeHtml(p.key)}${p.required ? " *" : ""}</div>
              <div class="v">${p.provided ? "Document fourni" : p.required ? "Manquante (obligatoire)" : "Non fournie"}</div>
            </div>
          </div>
          <span class="badge ${p.provided ? "ok" : p.required ? "crit" : "warn"}"><span class="d"></span>${p.provided ? "Fournie" : p.required ? "Manquante" : "Optionnelle"}</span>
        </div>
      `).join("")}
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">${isMorale ? "08" : "06"}</span>
      <span class="ttl">Consentement RGPD</span>
      <span class="accent"></span>
    </div>
    <div class="decl">
      <p><b>Information sur le traitement des données personnelles</b> — Le client a pris connaissance de la finalité du traitement (obligations LCB-FT, art. L.561-1 et s. CMF), de la base légale (obligation légale), de la durée de conservation (5 ans, art. L.561-12-1 CMF), de l'hébergement en France et en Union Européenne, et de ses droits d'accès, rectification, opposition (limitée par l'obligation légale) et réclamation auprès de la CNIL.</p>
      <div class="sig">
        <div>
          <div class="k">Consentement</div>
          <div class="name">${form.consentementRgpd ? "✓ Donné" : "✗ Manquant"} · mention version ${MENTION_CNIL_VERSION}</div>
        </div>
        <div class="hash">${sigDate} · ${sigTime}</div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">${isMorale ? "09" : "07"}</span>
      <span class="ttl">Déclaration sur l'honneur</span>
      <span class="accent"></span>
    </div>
    <div class="decl">
      <p>Je, soussigné <b>${escapeHtml(form.nomPrenom || "—")}</b>, certifie l'exactitude des informations et pièces renseignées dans la présente fiche, et m'engage à signaler à mon conseiller tout changement substantiel dans ma situation, conformément aux obligations LCB-FT (art. L.561-5-1 du Code monétaire et financier).</p>
      <div class="sig">
        <div>
          <div class="k">Signé électroniquement par</div>
          <div class="name">${escapeHtml(form.nomPrenom || "—")} · ${sigDate} · ${sigTime}</div>
        </div>
        <div class="hash">SHA-256 · ${shortHash(hash)}</div>
      </div>
    </div>
  </section>

  ${footerHtml(3, 3, true)}
</article>

</body>
</html>`;
}
