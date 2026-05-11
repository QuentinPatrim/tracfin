// app/pdf-render/attestation-template.ts — Construit le HTML brut de l'attestation (transposition fidèle de la maquette)

import {
  OPTIONS, RISK_LABELS, NIVEAU_CFG,
  type DossierForm, type ScoreResult,
} from "@/lib/tracfin";
import { formatDateLong, initials, shortHash, formatMontant } from "@/lib/pdf-helpers";
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

// Variante visuelle du verdict selon niveau v2
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

  // Liste des critères évalués (12 max v2)
  const CRITERE_DEFS: Array<{ key: keyof typeof OPTIONS; name: string }> = [
    { key: "rbe", name: "Bénéficiaires Effectifs" },
    { key: "residenceFiscale", name: "Résidence Fiscale" },
    { key: "paysNationalite", name: "Nationalité" },
    { key: "lieuBien", name: "Lieu du bien" },
    { key: "comportement", name: "Comportement" },
    { key: "origineFonds", name: "Origine des Fonds" },
    { key: "montageFinancier", name: "Montage Financier" },
    { key: "modePaiement", name: "Mode de Paiement" },
    { key: "coherencePrix", name: "Cohérence du Prix" },
    { key: "typeBien", name: "Type de Bien" },
    { key: "secteurActivite", name: "Secteur d'activité" },
    { key: "formation", name: "Formation Tracfin" },
  ];

  type Row = { n: number; name: string; sub: string; badgeCls: "ok" | "warn" | "crit"; badgeLabel: string };
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
  if (score.gelCritique) {
    rows.push({ n: idx++, name: "Gel des avoirs", sub: "Liste de sanctions européennes — correspondance détectée", badgeCls: "crit", badgeLabel: "Critique" });
  }
  if (form.sanctionsListe === true) {
    rows.push({ n: idx++, name: "Sanctions internationales", sub: "Présence sur liste UE / ONU / Trésor", badgeCls: "crit", badgeLabel: "Critique" });
  }
  if (score.ppeDetectee) {
    rows.push({ n: idx++, name: "Personne politiquement exposée", sub: "Vigilance renforcée — L.561-10 1°", badgeCls: "warn", badgeLabel: "Vigilance" });
  }

  const critiques = rows.filter((r) => r.badgeCls === "crit").length;
  const dossierShort = `#${dossierId.slice(0, 8).toUpperCase()}`;
  const today = formatDateLong(generatedAt);
  const sigDate = new Date(generatedAt).toLocaleDateString("fr-FR");
  const sigTime = fmtTime(generatedAt);

  // Recommandation
  const recoText = cfg.action;

  // Critère le plus critique pour la recommandation
  const topCritique = rows.find((r) => r.badgeCls === "crit");
  const recoRef = topCritique
    ? `R-${String(score.niveau === "interdiction" ? 4 : score.niveau === "examen_renforce" ? 3 : 2).padStart(2, "0")} / ${topCritique.name.split(" ").map(w => w[0]).join("").toUpperCase()}`
    : `R-${String(niveauNum).padStart(2, "0")}`;

  // Header réutilisable (3 pages = 3 headers)
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
      <div class="doc-sub">Évaluation des risques de blanchiment de capitaux et de financement du terrorisme — analyse automatisée sur ${Object.values(score.risks).filter(Boolean).length} critères réglementaires (CMF L.561-1 et suiv.).</div>
    </div>
    <div class="stamp"><span class="pulse"></span>Vérifié par Klaris</div>
  </div>

  <section class="verdict ${variant}">
    <div class="glow"></div>
    <div class="vlabel"><span class="ic"></span>Verdict de conformité · Niveau ${niveauNum} / 4</div>
    <h2>${escapeHtml(verdictTitle)}</h2>
    <p class="lead">${escapeHtml(cfg.action)}</p>
    <div class="progress-row">
      <div class="progress"><span style="width:${score.pct}%"></span></div>
      <div class="pct">${score.pct}%</div>
    </div>
    <div class="stat-row">
      <div class="stat">${rows.length} critères évalués · <b>${critiques} critique${critiques > 1 ? "s" : ""}</b></div>
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
      <div class="field"><span class="k">Type de client</span><span class="v">${form.typeClient === "morale" ? "Personne Morale" : "Personne Physique"}</span></div>
      <div class="field"><span class="k">${form.typeClient === "morale" ? "Dénomination" : "Nom et prénom"}</span><span class="v">${escapeHtml(form.nomPrenom || "—")}</span></div>
      ${form.dateNaissance ? `<div class="field"><span class="k">${form.typeClient === "morale" ? "Date de constitution" : "Date de naissance"}</span><span class="v mono">${fmtDateShort(form.dateNaissance)}</span></div>` : ""}
      <div class="field"><span class="k">Référence dossier</span><span class="v mono">${dossierShort}</span></div>
      ${form.nationalite ? `<div class="field"><span class="k">${form.typeClient === "morale" ? "Pays" : "Nationalité"}</span><span class="v">${escapeHtml(form.nationalite)}</span></div>` : ""}
      ${form.profession ? `<div class="field"><span class="k">Profession / Activité</span><span class="v">${escapeHtml(form.profession)}</span></div>` : ""}
      ${form.adresse ? `<div class="field" style="grid-column:1 / -1"><span class="k">Adresse</span><span class="v">${escapeHtml(form.adresse)}</span></div>` : ""}
    </div>
  </section>

  ${footerHtml(1, 3)}
</article>

<!-- =================== PAGE 2 — DÉTAIL DES CRITÈRES =================== -->
<article class="page">
  ${headerHtml("Attestation · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">02</span>
      <span class="ttl">Détail des critères de risque</span>
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

  ${footerHtml(2, 3)}
</article>

<!-- =================== PAGE 3 — TRANSACTION + RECO + VALIDATION =================== -->
<article class="page">
  ${headerHtml("Attestation · suite")}

  <section class="section" style="margin-top:14px">
    <div class="section-head">
      <span class="num">03</span>
      <span class="ttl">Analyse de la transaction</span>
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
      <div class="tx-card">
        <div class="k">Mode de paiement</div>
        <div class="v">${escapeHtml(labelOf("modePaiement", form.modePaiement))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Cohérence du prix</div>
        <div class="v">${escapeHtml(labelOf("coherencePrix", form.coherencePrix))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Type de bien</div>
        <div class="v">${escapeHtml(labelOf("typeBien", form.typeBien))}</div>
      </div>
      <div class="tx-card">
        <div class="k">Montant</div>
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

  <section class="section">
    <div class="section-head">
      <span class="num">04</span>
      <span class="ttl">Recommandation de l'algorithme</span>
      <span class="accent"></span>
    </div>
    <div class="reco">
      <div class="label">Action requise</div>
      <p>${escapeHtml(recoText)}</p>
      <div class="stat-row">
        ${(score.niveau === "examen_renforce" || score.niveau === "interdiction") ? '<div class="stat">Délai légal · <b>48h (DS TRACFIN)</b></div>' : ''}
        <div class="stat">Référence · <b>${escapeHtml(recoRef)}</b></div>
        <div class="stat">Niveau · <b>${escapeHtml(verdictTitle)}</b></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="num">05</span>
      <span class="ttl">Validation</span>
      <span class="accent"></span>
    </div>
    <div class="validations">
      <div class="validation">
        <div class="k">Validé par</div>
        <div class="person">
          <div class="av">${escapeHtml(initials(form.nomEmploye))}</div>
          <div>
            <div class="name">${escapeHtml(form.nomEmploye || "—")}</div>
            <div class="role">Agent en charge</div>
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

  ${footerHtml(3, 3, true)}
</article>

</body>
</html>`;
}
