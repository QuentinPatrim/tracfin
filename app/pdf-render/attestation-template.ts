// app/pdf-render/attestation-template.ts — Attestation LCB-FT exhaustive (4 pages A4)
// Affiche TOUS les éléments du dossier : critères + triggers + commentaires
// (justifFonds, justifPrix), PPE étendue, dates de détection, gel d'avoirs,
// sanctions, validations. Conforme exigence DGCCRF/ACPR (traçabilité opposable).

import {
  OPTIONS, RISK_LABELS, NIVEAU_CFG, PPE_LIEN_LABELS,
  type DossierForm, type ScoreResult,
} from "@/lib/tracfin";
import { formatDateLong, initials, shortHash, formatMontant, klarisLogoSvg } from "@/lib/pdf-helpers";
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
  OPTIONS[key]?.find((o) => o.value === value)?.label ?? (value || "—");

const has = (s: string | null | undefined): s is string => !!(s && s.trim());

function niveauVariant(niveau: ScoreResult["niveau"]): "ok" | "warn" | "critical" {
  if (niveau === "vigilance_standard") return "ok";
  if (niveau === "vigilance_renforcee") return "warn";
  return "critical";
}

function verdictTitleFor(niveau: ScoreResult["niveau"]): string {
  return {
    vigilance_standard: "Dossier conforme",
    vigilance_renforcee: "Vigilance renforcée",
    examen_renforce: "Examen renforcé",
    interdiction: "Interdiction de traiter",
  }[niveau];
}

interface BuildAttestationOpts {
  form: DossierForm;
  score: ScoreResult;
  dossierId: string;
  hash: string;
  generatedAt: string;
}

export function buildAttestationHtml(opts: BuildAttestationOpts): string {
  const { form, score, dossierId, hash, generatedAt } = opts;
  const variant = niveauVariant(score.niveau);
  const cfg = NIVEAU_CFG[score.niveau];
  const niveauNum = (["vigilance_standard", "vigilance_renforcee", "examen_renforce", "interdiction"] as const).indexOf(score.niveau) + 1;
  const verdictTitle = verdictTitleFor(score.niveau);
  const isMorale = form.typeClient === "morale";
  const isVendeur = form.partie === "vendeur";
  const roleLabel = isVendeur ? "Vendeur" : "Acquéreur";
  const montantLabel = isVendeur ? "Prix de vente" : "Montant";

  // ─── Critères évalués ────────────────────────────────────────────────
  // Vendeur : on retire les critères qui ne s'appliquent qu'à l'acquéreur
  // (origine des fonds, montage, mode de paiement, cohérence du prix).
  const CRITERE_DEFS_ALL: Array<{ key: keyof typeof OPTIONS; name: string; acquereurOnly?: boolean }> = [
    { key: "rbe", name: "Bénéficiaires Effectifs" },
    { key: "residenceFiscale", name: "Résidence Fiscale" },
    { key: "paysNationalite", name: "Nationalité" },
    { key: "lieuBien", name: "Lieu du bien" },
    { key: "comportement", name: "Comportement du client" },
    { key: "origineFonds", name: "Origine des Fonds", acquereurOnly: true },
    { key: "montageFinancier", name: "Montage Financier", acquereurOnly: true },
    { key: "modePaiement", name: "Mode de Paiement", acquereurOnly: true },
    { key: "coherencePrix", name: "Cohérence du Prix", acquereurOnly: true },
    { key: "typeBien", name: "Type de Bien" },
    { key: "secteurActivite", name: "Secteur d'activité" },
    { key: "formation", name: "Formation TRACFIN" },
  ];
  const CRITERE_DEFS = CRITERE_DEFS_ALL.filter((d) => !(isVendeur && d.acquereurOnly));

  type Row = { n: number; name: string; sub: string; badgeCls: "ok" | "warn" | "crit" | "violet"; badgeLabel: string };
  const rows: Row[] = [];
  let idx = 1;
  for (const d of CRITERE_DEFS) {
    const r = score.risks[d.key];
    if (!r) continue;
    const val = form[d.key as keyof DossierForm] as string;
    const sub = labelOf(d.key, val);
    rows.push({
      n: idx++,
      name: d.name,
      sub,
      badgeCls: r === "green" ? "ok" : r === "orange" ? "warn" : "crit",
      badgeLabel: r === "green" ? "Conforme" : r === "orange" ? "Vigilance" : "Critique",
    });
  }
  // Gates et signaux additionnels
  if (score.gelCritique) {
    rows.push({
      n: idx++,
      name: "Gel des avoirs",
      sub: `Détection sur liste de sanctions${has(form.gelDate) ? ` · date : ${fmtDateShort(form.gelDate)}` : ""} — Règl. (UE) 2580/2001`,
      badgeCls: "crit",
      badgeLabel: "Critique",
    });
  }
  if (form.sanctionsListe === true) {
    rows.push({
      n: idx++,
      name: "Sanctions internationales",
      sub: "Présence sur liste UE / ONU / Trésor américain",
      badgeCls: "crit",
      badgeLabel: "Critique",
    });
  }
  if (form.ppe === true) {
    rows.push({
      n: idx++,
      name: "PPE — client",
      sub: "Personne politiquement exposée — vigilance renforcée (L.561-10 1°)",
      badgeCls: "warn",
      badgeLabel: "Vigilance",
    });
  }
  if (form.ppeProcheDetecte === true) {
    rows.push({
      n: idx++,
      name: "PPE — entourage",
      sub: "Proche d'une personne politiquement exposée",
      badgeCls: "warn",
      badgeLabel: "Vigilance",
    });
  }

  const critiques = rows.filter((r) => r.badgeCls === "crit").length;
  const vigilances = rows.filter((r) => r.badgeCls === "warn").length;
  const conformes = rows.filter((r) => r.badgeCls === "ok").length;

  const dossierShort = `#${dossierId.slice(0, 8).toUpperCase()}`;
  const today = formatDateLong(generatedAt);
  const sigDate = new Date(generatedAt).toLocaleDateString("fr-FR");
  const sigTime = fmtTime(generatedAt);
  const dateDetection = has(form.dateDetection) ? fmtDateShort(form.dateDetection) : null;

  // ─── Commentaires / justifications (champs texte libre du pro) ────────
  const hasJustifFonds = has(form.justifFonds);
  // Cohérence du prix : critère acquéreur uniquement.
  const hasJustifPrix = !isVendeur && has(form.justifPrix);
  const hasPpePrecisions = form.ppeProches && form.ppeProches.length > 0;

  // Critère le plus critique pour la recommandation
  const topCritique = rows.find((r) => r.badgeCls === "crit");
  const recoRef = topCritique
    ? `R-${String(score.niveau === "interdiction" ? 4 : score.niveau === "examen_renforce" ? 3 : 2).padStart(2, "0")} / ${topCritique.name.split(" ").map(w => w[0]).join("").toUpperCase()}`
    : `R-${String(niveauNum).padStart(2, "0")}`;

  // Headers / footers
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
        <div class="label">Émis le</div>
        <div class="val regular">${today}</div>
      </div>
    </div>
  </header>`;

  const footerHtml = (pageNum: number, totalPages: number, withHash = false) => `
  <footer class="doc-foot">
    <span class="conf-tag"><span class="d"></span>Document confidentiel · LCB-FT</span>
    <span class="gen-tag">${withHash ? `SHA-256 · ${shortHash(hash)}  ·  ` : ""}Généré par <span class="lk">Klaris</span> · Page ${pageNum} / ${totalPages}</span>
  </footer>`;

  // Champs identification (riches)
  const idFields: Array<{ k: string; v: string; mono?: boolean; full?: boolean }> = [
    { k: "Rôle dans l'opération", v: roleLabel },
    { k: "Type de client", v: isMorale ? "Personne morale (société)" : "Personne physique" },
    { k: isMorale ? "Dénomination" : "Nom et prénom", v: form.nomPrenom || "—" },
    ...(has(form.dateNaissance) ? [{ k: isMorale ? "Date de constitution" : "Date de naissance", v: fmtDateShort(form.dateNaissance), mono: true }] : []),
    { k: "Référence dossier", v: dossierShort, mono: true },
    ...(has(form.lieuNaissance) ? [{ k: isMorale ? "Lieu d'immatriculation" : "Lieu de naissance", v: form.lieuNaissance }] : []),
    ...(has(form.nationalite) ? [{ k: isMorale ? "Pays" : "Nationalité", v: form.nationalite }] : []),
    ...(has(form.profession) ? [{ k: "Profession / Activité", v: form.profession }] : []),
    ...(has(form.secteurActivite) ? [{ k: "Secteur d'activité", v: labelOf("secteurActivite", form.secteurActivite) }] : []),
    ...(has(form.residenceFiscale) ? [{ k: "Résidence fiscale", v: labelOf("residenceFiscale", form.residenceFiscale) }] : []),
    ...(dateDetection ? [{ k: "Date de détection", v: dateDetection, mono: true }] : []),
    ...(has(form.adresse) ? [{ k: "Adresse complète", v: form.adresse, full: true }] : []),
  ];

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Klaris — Attestation ${dossierShort}</title>
<style>${PDF_RENDER_CSS}</style>
</head>
<body>

<!-- =================== PAGE 1 — VERDICT + IDENTIFICATION =================== -->
<article class="page">
  ${headerHtml("Attestation")}

  <div class="title-row">
    <div>
      <h1 class="doc-title">Attestation de Conformité<br/>LCB-FT</h1>
      <div class="doc-sub">Évaluation des risques de blanchiment de capitaux et de financement du terrorisme — analyse algorithmique opposable sur ${rows.length} critères (CMF L.561-1 et suivants). Client analysé en qualité de <b>${escapeHtml(roleLabel.toLowerCase())}</b>.</div>
    </div>
    <div class="stamp"><span class="pulse"></span>Vérifié par Klaris</div>
  </div>

  <section class="verdict ${variant}">
    <div class="glow"></div>
    <div class="vlabel"><span class="ic"></span>Verdict de conformité · Niveau ${niveauNum} / 4</div>
    <h2>${escapeHtml(verdictTitle)}</h2>
    <p class="lead">${escapeHtml(cfg.action)}</p>

    <!-- Compteurs factuels des signaux levés (remplace le score arbitraire) -->
    <div class="signal-row">
      <div class="signal ok"><span class="d"></span><b>${conformes}</b> critère${conformes > 1 ? "s" : ""} conforme${conformes > 1 ? "s" : ""}</div>
      ${vigilances > 0 ? `<div class="signal warn"><span class="d"></span><b>${vigilances}</b> en vigilance</div>` : ""}
      ${critiques > 0 ? `<div class="signal crit"><span class="d"></span><b>${critiques}</b> critique${critiques > 1 ? "s" : ""}</div>` : ""}
    </div>

    <div class="stat-row">
      <div class="stat">Total critères évalués · <b>${rows.length}</b></div>
      <div class="stat">Référence légale · <b>${escapeHtml(cfg.ref)}</b></div>
      <div class="stat">Algorithme · <b>Klaris ${escapeHtml(score.algoVersion.toUpperCase())}</b></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">01</span>
      <span class="ttl">Identification du client</span>
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

  ${footerHtml(1, 4)}
</article>

<!-- =================== PAGE 2 — DÉTAIL DES CRITÈRES =================== -->
<article class="page">
  ${headerHtml("Attestation · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">02</span>
      <span class="ttl">Détail des critères évalués</span>
      <span class="accent"></span>
    </div>
    <div class="criteria">
      ${rows.map((r) => `
        <div class="crit">
          <div class="lbl">
            <div class="ix">${String(r.n).padStart(2, "0")}</div>
            <div>
              <div class="name">${escapeHtml(r.name)}</div>
              <div class="meta-line">${escapeHtml(r.sub)}</div>
            </div>
          </div>
          <span class="badge ${r.badgeCls}"><span class="d"></span>${r.badgeLabel}</span>
        </div>
      `).join("")}
    </div>
  </section>

  ${hasPpePrecisions ? `
  <section class="section">
    <div class="section-head">
      <span class="num">03</span>
      <span class="ttl">Détail PPE — entourage</span>
      <span class="accent"></span>
    </div>
    <div class="criteria">
      ${form.ppeProches!.map((p, i) => `
        <div class="crit">
          <div class="lbl">
            <div class="ix">${String(i + 1).padStart(2, "0")}</div>
            <div>
              <div class="name">${escapeHtml(p.nom || "—")}</div>
              <div class="meta-line">${escapeHtml(PPE_LIEN_LABELS[p.lien] ?? p.lien)}${has(p.fonction) ? ` · ${escapeHtml(p.fonction)}` : ""}</div>
            </div>
          </div>
          <span class="badge warn"><span class="d"></span>Vigilance</span>
        </div>
      `).join("")}
    </div>
  </section>` : ""}

  ${footerHtml(2, 4)}
</article>

<!-- =================== PAGE 3 — ANALYSE TRANSACTION + COMMENTAIRES =================== -->
<article class="page">
  ${headerHtml("Attestation · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">${hasPpePrecisions ? "04" : "03"}</span>
      <span class="ttl">Analyse de la transaction</span>
      <span class="accent"></span>
    </div>
    <div class="tx-grid">
      ${isVendeur ? `
      <div class="tx-card">
        <div class="k">Origine du bien vendu</div>
        <div class="v">${escapeHtml(labelOf("origineFonds", form.origineFonds))}</div>
      </div>` : `
      <div class="tx-card">
        <div class="k">Origine des fonds</div>
        <div class="v">${escapeHtml(labelOf("origineFonds", form.origineFonds))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Montage financier</div>
        <div class="v">${escapeHtml(labelOf("montageFinancier", form.montageFinancier))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Mode de paiement</div>
        <div class="v">${escapeHtml(labelOf("modePaiement", form.modePaiement))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Cohérence du prix</div>
        <div class="v">${escapeHtml(labelOf("coherencePrix", form.coherencePrix))}</div>
      </div>`}
      <div class="tx-card">
        <div class="k">Type de bien</div>
        <div class="v">${escapeHtml(labelOf("typeBien", form.typeBien))}</div>
      </div>
      <div class="tx-card">
        <div class="k">${escapeHtml(montantLabel)}</div>
        <div class="v">${form.montantTransaction ? `${formatMontant(form.montantTransaction)} €` : "—"}</div>
      </div>
      <div class="tx-card">
        <div class="k">Lieu du bien</div>
        <div class="v">${escapeHtml(labelOf("lieuBien", form.lieuBien))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Bénéficiaires effectifs</div>
        <div class="v">${escapeHtml(labelOf("rbe", form.rbe))}</div>
      </div>
    </div>
  </section>

  ${(hasJustifFonds || hasJustifPrix) ? `
  <section class="section">
    <div class="section-head">
      <span class="num">${hasPpePrecisions ? "05" : "04"}</span>
      <span class="ttl">Commentaires et justifications de l'agent</span>
      <span class="accent"></span>
    </div>
    ${hasJustifFonds ? `
    <div class="reco" style="margin-top:10px">
      <div class="label">${isVendeur ? "Justification de l'origine du bien vendu" : "Justification de l'origine des fonds"}</div>
      <p>${escapeHtml(form.justifFonds)}</p>
    </div>` : ""}
    ${hasJustifPrix && !isVendeur ? `
    <div class="reco" style="margin-top:10px">
      <div class="label">Justification de la cohérence du prix</div>
      <p>${escapeHtml(form.justifPrix)}</p>
    </div>` : ""}
  </section>` : ""}

  ${footerHtml(3, 4)}
</article>

<!-- =================== PAGE 4 — RECO + VALIDATIONS + DÉCLARATION =================== -->
<article class="page">
  ${headerHtml("Attestation · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">${hasPpePrecisions ? (hasJustifFonds || hasJustifPrix ? "06" : "05") : (hasJustifFonds || hasJustifPrix ? "05" : "04")}</span>
      <span class="ttl">Recommandation algorithmique</span>
      <span class="accent"></span>
    </div>
    <div class="reco">
      <div class="label">Action requise</div>
      <p>${escapeHtml(cfg.action)}</p>
      <div class="stat-row">
        ${(score.niveau === "examen_renforce" || score.niveau === "interdiction") ? '<div class="stat">Délai légal · <b>48h (DS TRACFIN)</b></div>' : ''}
        <div class="stat">Référence interne · <b>${escapeHtml(recoRef)}</b></div>
        <div class="stat">Niveau · <b>${escapeHtml(verdictTitle)}</b></div>
        <div class="stat">CMF · <b>${escapeHtml(cfg.ref)}</b></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">${hasPpePrecisions ? (hasJustifFonds || hasJustifPrix ? "07" : "06") : (hasJustifFonds || hasJustifPrix ? "06" : "05")}</span>
      <span class="ttl">Validations internes</span>
      <span class="accent"></span>
    </div>
    <div class="validations">
      <div class="validation">
        <div class="k">Validé par</div>
        <div class="person">
          <div class="av">${escapeHtml(initials(form.nomEmploye))}</div>
          <div>
            <div class="name">${escapeHtml(form.nomEmploye || "—")}</div>
            <div class="role">Agent en charge du dossier</div>
          </div>
        </div>
        <div class="sig">
          <span>Signature électronique</span>
          <span>${sigDate} · ${sigTime}</span>
        </div>
      </div>
      <div class="validation">
        <div class="k">Responsable LCB-FT</div>
        <div class="person">
          <div class="av">${escapeHtml(initials(form.responsableLCBFT))}</div>
          <div>
            <div class="name">${escapeHtml(form.responsableLCBFT || "—")}</div>
            <div class="role">Compliance Officer</div>
          </div>
        </div>
        <div class="sig">
          <span>Signature électronique</span>
          <span>${sigDate} · ${sigTime}</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">${hasPpePrecisions ? (hasJustifFonds || hasJustifPrix ? "08" : "07") : (hasJustifFonds || hasJustifPrix ? "07" : "06")}</span>
      <span class="ttl">Mentions légales & traçabilité</span>
      <span class="accent"></span>
    </div>
    <div class="decl">
      <p>
        La présente attestation est délivrée sur la base de l'analyse algorithmique Klaris ${escapeHtml(score.algoVersion.toUpperCase())},
        appliquant les obligations LCB-FT prévues aux articles L.561-1 et suivants du Code monétaire et
        financier, ainsi que les recommandations DGCCRF / TRACFIN pour le secteur immobilier.
        Elle ne se substitue pas à l'analyse personnelle du professionnel assujetti, qui demeure
        seul responsable des décisions d'entrée en relation d'affaires.
      </p>
      <p style="margin-top:8px">
        Cette attestation et les pièces justificatives associées sont conservées <b>5 ans à compter de la fin
        de la relation d'affaires</b> (art. L.561-12-1 CMF), dans une infrastructure souveraine européenne
        chiffrée (TLS 1.3 + AES-256). Toute reproduction non autorisée est interdite.
      </p>
      <div class="sig">
        <div>
          <div class="k">Hash d'intégrité — SHA-256</div>
          <div class="name">${escapeHtml(hash.slice(0, 8))}…${escapeHtml(hash.slice(-4))}</div>
        </div>
        <div class="hash">${sigDate} · ${sigTime}</div>
      </div>
    </div>
  </section>

  ${footerHtml(4, 4, true)}
</article>

</body>
</html>`;
}
