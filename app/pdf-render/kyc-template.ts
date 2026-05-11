// app/pdf-render/kyc-template.ts — Fiche KYC (1 page, design maquette Klaris)

import { OPTIONS, type DossierForm } from "@/lib/tracfin";
import { formatDateLong, shortHash, formatMontant } from "@/lib/pdf-helpers";
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

const labelOf = (key: keyof typeof OPTIONS, value: string): string =>
  OPTIONS[key]?.find((o) => o.value === value)?.label ?? "—";

interface BuildKycOpts {
  form: DossierForm;
  dossierId: string;
  hash: string;
  generatedAt: string;     // date d'émission du PDF (footer)
  signedAt: string;        // date de soumission KYC par le client (signature électronique)
}

const DOC_ID_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h5"/><path d="M14 14h4"/></svg>`;
const DOC_HOME_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/></svg>`;
const DOC_BIZ_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
const DOC_FILE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`;

export function buildKycHtml(opts: BuildKycOpts): string {
  const { form, dossierId, hash, generatedAt, signedAt } = opts;
  const isMorale = form.typeClient === "morale";
  const dossierShort = `#${dossierId.slice(0, 8).toUpperCase()}`;
  const today = formatDateLong(generatedAt);
  // Signature = horodatage de la soumission par le client (preuve légale)
  const sigDate = new Date(signedAt).toLocaleDateString("fr-FR");
  const sigTime = fmtTime(signedAt);

  // Inventaire des pièces fournies
  const pieces: Array<{ icon: string; key: string; label: string; provided: boolean }> = isMorale
    ? [
        { icon: DOC_BIZ_SVG, key: "Extrait Kbis", label: form.kbis ? "Document fourni (-3 mois)" : "Manquant", provided: form.kbis },
        { icon: DOC_FILE_SVG, key: "Statuts", label: form.statuts ? "Document à jour fourni" : "Manquant", provided: form.statuts },
        { icon: DOC_ID_SVG, key: "CNI du gérant", label: form.cniGerant ? "Carte nationale d'identité" : "Manquant", provided: form.cniGerant },
        { icon: DOC_HOME_SVG, key: "Justificatif de domicile", label: form.justifDomicile ? "Facture < 3 mois" : "Manquant", provided: form.justifDomicile },
      ]
    : [
        { icon: DOC_ID_SVG, key: "Pièce d'identité", label: form.pieceIdentite ? "Carte nationale d'identité" : "Manquant", provided: form.pieceIdentite },
        { icon: DOC_HOME_SVG, key: "Justificatif de domicile", label: form.justifDomicile ? "Facture < 3 mois" : "Manquant", provided: form.justifDomicile },
      ];
  const piecesProvided = pieces.filter((p) => p.provided).length;

  // Champs identitaires
  const idFields: Array<{ k: string; v: string; mono?: boolean; full?: boolean }> = [
    { k: "Type", v: isMorale ? "Personne Morale" : "Personne Physique" },
    { k: isMorale ? "Dénomination" : "Nom et prénom", v: form.nomPrenom || "—" },
    ...(form.dateNaissance ? [{ k: isMorale ? "Date de constitution" : "Date de naissance", v: fmtDateShort(form.dateNaissance), mono: true }] : []),
    ...(form.lieuNaissance ? [{ k: isMorale ? "Lieu d'immatriculation" : "Lieu de naissance", v: form.lieuNaissance }] : []),
    ...(form.nationalite ? [{ k: isMorale ? "Pays" : "Nationalité", v: form.nationalite }] : []),
    ...(form.profession ? [{ k: "Profession / Activité", v: form.profession }] : []),
    ...(form.residenceFiscale ? [{ k: "Résidence fiscale", v: labelOf("residenceFiscale", form.residenceFiscale) }] : []),
    ...(form.adresse ? [{ k: "Adresse complète", v: form.adresse, full: true }] : []),
  ];
  const fieldsFilled = idFields.length;

  const piecesPct = pieces.length ? Math.round((piecesProvided / pieces.length) * 100) : 0;

  // Header réutilisable
  const headerHtml = (tag: string) => `
  <header class="doc-head">
    <div class="brand">
      <div class="logo"></div>
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

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Klaris — Fiche KYC ${dossierShort}</title>
<style>${PDF_RENDER_CSS}</style>
</head>
<body>

<!-- =================== PAGE 1 — STATUT + IDENTITÉ + OPÉRATION =================== -->
<article class="page">
  ${headerHtml("KYC")}

  <div class="title-row">
    <div>
      <h1 class="doc-title">Fiche Know Your<br/>Customer (KYC)</h1>
      <div class="doc-sub">Déclarations et informations recueillies auprès du client lors de l'entrée en relation. Données vérifiées et chiffrées (TLS 1.3 + AES-256).</div>
    </div>
    <div class="stamp"><span class="pulse"></span>Vérifié par Klaris</div>
  </div>

  <section class="verdict ok">
    <div class="glow"></div>
    <div class="vlabel"><span class="ic"></span>Statut du dossier</div>
    <h2>${piecesProvided === pieces.length ? "Dossier complet" : "Dossier en cours"}</h2>
    <p class="lead">${piecesProvided === pieces.length ? "Toutes les pièces requises ont été collectées et vérifiées. Le dossier est prêt pour évaluation Tracfin." : "Certaines pièces sont en attente. Le dossier sera prêt pour évaluation une fois complété."}</p>
    <div class="progress-row">
      <div class="progress"><span style="width:${piecesPct}%"></span></div>
      <div class="pct">${piecesPct}%</div>
    </div>
    <div class="stat-row">
      <div class="stat">Pièces · <b>${piecesProvided} / ${pieces.length}</b></div>
      <div class="stat">Champs remplis · <b>${fieldsFilled} / ${fieldsFilled}</b></div>
      <div class="stat">Source · <b>Lien client sécurisé</b></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">01</span>
      <span class="ttl">Identité du client</span>
      <span class="accent"></span>
    </div>
    <div class="grid">
      ${idFields.map((f) => `
        <div class="field"${f.full ? ' style="grid-column:1 / -1"' : ''}>
          <span class="k">${escapeHtml(f.k)}</span>
          <span class="v${f.mono ? " mono" : ""}">${escapeHtml(f.v)}</span>
        </div>
      `).join("")}
    </div>
  </section>

  ${footerHtml(1, 2)}
</article>

<!-- =================== PAGE 2 — OPÉRATION + PIÈCES + DÉCLARATION =================== -->
<article class="page">
  ${headerHtml("KYC · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">02</span>
      <span class="ttl">Informations sur l'opération</span>
      <span class="accent"></span>
    </div>
    <div class="tx-grid">
      <div class="tx-card">
        <div class="k">Origine des fonds</div>
        <div class="v">${escapeHtml(labelOf("origineFonds", form.origineFonds))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Montage financier</div>
        <div class="v">${escapeHtml(labelOf("montageFinancier", form.montageFinancier))}</div>
      </div>
      ${form.typeBien ? `
      <div class="tx-card">
        <div class="k">Type de bien</div>
        <div class="v">${escapeHtml(labelOf("typeBien", form.typeBien))}</div>
      </div>` : ""}
      ${form.montantTransaction ? `
      <div class="tx-card">
        <div class="k">Montant</div>
        <div class="v">${formatMontant(form.montantTransaction)} €</div>
      </div>` : ""}
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">03</span>
      <span class="ttl">Pièces justificatives fournies</span>
      <span class="accent"></span>
    </div>
    <div class="docs-grid">
      ${pieces.map((p) => `
        <div class="doc">
          <div class="left">
            <div class="icn">${p.icon}</div>
            <div>
              <div class="k">${escapeHtml(p.key)}</div>
              <div class="v">${escapeHtml(p.label)}</div>
            </div>
          </div>
          <span class="badge ${p.provided ? "ok" : "crit"}"><span class="d"></span>${p.provided ? "Fournie" : "Manquante"}</span>
        </div>
      `).join("")}
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">04</span>
      <span class="ttl">Déclaration sur l'honneur</span>
      <span class="accent"></span>
    </div>
    <div class="decl">
      <p>Je, soussigné <b>${escapeHtml(form.nomPrenom || "—")}</b>, certifie l'exactitude des informations renseignées et m'engage à signaler à Klaris tout changement substantiel dans ma situation, conformément aux obligations LCB-FT (art. L.561-1 et suivants du Code monétaire et financier).</p>
      <div class="sig">
        <div>
          <div class="k">Signé électroniquement</div>
          <div class="name">${escapeHtml(form.nomPrenom || "—")} · ${sigDate} · ${sigTime}</div>
        </div>
        <div class="hash">SHA-256 · ${shortHash(hash)}</div>
      </div>
    </div>
  </section>

  ${footerHtml(2, 2, true)}
</article>

</body>
</html>`;
}
