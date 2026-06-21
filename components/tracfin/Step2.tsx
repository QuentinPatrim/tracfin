// components/tracfin/Step2.tsx — Étape 2 : Analyse des risques

"use client";

import { useState } from "react";
import { PAYS_NOIRE, PAYS_GRISE_REGIONS, type DossierForm } from "@/lib/tracfin";
import { inputStyle, Sect, Field, RiskSelect, BinaryField } from "./primitives";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
  /** ID du dossier pour appeler /api/screening/sanctions. Si absent (création
   *  d'un dossier pas encore persisté), le screening n'est pas accessible. */
  dossierId?: string;
  /** Criblage auto activé (clé OpenSanctions). Sinon → repli lien manuel. */
  screeningEnabled?: boolean;
}

function PaysModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.40)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{
          background: "white",
          border: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "0 30px 80px -20px rgba(15,23,42,0.30)",
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold" style={{ color: "#0f172a" }}>Pays sous surveillance GAFI</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: "#94a3b8" }}
          >×</button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: "#b91c1c" }}>Liste noire</h4>
          <div className="flex flex-wrap gap-2">
            {PAYS_NOIRE.map((p) => (
              <span
                key={p}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.30)",
                  color: "#b91c1c",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: "#b45309" }}>Liste grise</h4>
          {PAYS_GRISE_REGIONS.map((g) => (
            <div key={g.region} className="mb-4">
              <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>{g.region}</div>
              <div className="flex flex-wrap gap-2">
                {g.pays.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.30)",
                      color: "#b45309",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Step2({ form, set, dossierId, screeningEnabled = false }: Props) {
  const [showPays, setShowPays] = useState(false);

  return (
    <>
      {showPays && <PaysModal onClose={() => setShowPays(false)} />}

      <Sect title="Risque géographique" sub="Liste GAFI">
        <Field label="Résidence fiscale">
          <RiskSelect optionsKey="residenceFiscale" value={form.residenceFiscale} onChange={(v) => set("residenceFiscale", v)} />
          <button
            type="button"
            onClick={() => setShowPays(true)}
            className="self-start text-xs underline mt-1"
            style={{ color: "#6d28d9" }}
          >
            Voir la liste des pays GAFI
          </button>
        </Field>

        <Field label="Lieu du bien immobilier">
          <RiskSelect optionsKey="lieuBien" value={form.lieuBien} onChange={(v) => set("lieuBien", v)} />
        </Field>

        <Field label="Comportement du client">
          <RiskSelect optionsKey="comportement" value={form.comportement} onChange={(v) => set("comportement", v)} />
        </Field>
      </Sect>

      {/* ─── Section Origine des fonds : ACQUÉREUR uniquement ─── */}
      {form.partie === "acquereur" && (
        <Sect title="Origine des fonds" sub="Côté acquéreur">
          <Field label="Source des fonds">
            <RiskSelect optionsKey="origineFonds" value={form.origineFonds} onChange={(v) => set("origineFonds", v)} />
          </Field>
          <Field label="Justification (optionnel)">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.justifFonds}
              onChange={(e) => set("justifFonds", e.target.value)}
              placeholder="Détails complémentaires..."
            />
          </Field>
        </Sect>
      )}

      {/* ─── Section Origine du bien : VENDEUR uniquement ─── */}
      {form.partie === "vendeur" && (
        <Sect title="Origine du bien vendu" sub="Côté vendeur">
          <Field label="Comment le vendeur a-t-il acquis ce bien ?">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.justifFonds}
              onChange={(e) => set("justifFonds", e.target.value)}
              placeholder="Achat en 2015 (prêt bancaire) — héritage 2018 — construction 2010 — donation..."
            />
          </Field>
          <div
            className="rounded-xl px-3 py-2.5 text-[12px]"
            style={{
              background: "rgba(124,58,237,0.05)",
              border: "1px solid rgba(124,58,237,0.20)",
              color: "#475569",
            }}
          >
            <span className="font-semibold" style={{ color: "#6d28d9" }}>ℹ️ Côté vendeur</span> — Les questions relatives à l&apos;origine des fonds (mode de paiement, financement, espèces) ne s&apos;appliquent pas. Concentrez-vous sur la traçabilité du bien cédé.
          </div>
        </Sect>
      )}

      <Sect title="Transaction" sub="Bien & financement">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Type de bien">
            <RiskSelect optionsKey="typeBien" value={form.typeBien} onChange={(v) => set("typeBien", v)} />
          </Field>
          <Field label={form.partie === "vendeur" ? "Prix de vente (€)" : "Montant de l'opération (€)"}>
            <input
              type="number"
              min="0"
              className={inputStyle}
              value={form.montantTransaction}
              onChange={(e) => set("montantTransaction", e.target.value)}
              placeholder="500000"
            />
          </Field>
        </div>

        {/* Montage / paiement / cohérence prix : ACQUÉREUR uniquement */}
        {form.partie === "acquereur" && (
          <>
            <Field label="Montage financier">
              <RiskSelect optionsKey="montageFinancier" value={form.montageFinancier} onChange={(v) => set("montageFinancier", v)} />
            </Field>

            <Field label="Mode de paiement">
              <RiskSelect optionsKey="modePaiement" value={form.modePaiement} onChange={(v) => set("modePaiement", v)} />
              <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>
                Espèces &gt; 1 000 € interdites (art. L112-6 CMF) entre professionnel et particulier.
              </p>
            </Field>

            <Field label="Cohérence du prix">
              <RiskSelect optionsKey="coherencePrix" value={form.coherencePrix} onChange={(v) => set("coherencePrix", v)} />
            </Field>
            <Field label="Justification du prix (optionnel)">
              <textarea
                className={`${inputStyle} min-h-[80px] resize-none`}
                value={form.justifPrix}
                onChange={(e) => set("justifPrix", e.target.value)}
                placeholder="Comparables, expertise, référence DVF..."
              />
            </Field>
          </>
        )}
      </Sect>

      <Sect title="Bénéficiaires effectifs">
        <Field label="RBE (Registre des Bénéficiaires Effectifs)">
          <RiskSelect optionsKey="rbe" value={form.rbe} onChange={(v) => set("rbe", v)} />
        </Field>
      </Sect>

      <Sect title="Sanctions & PPE" sub="Gates absolues — L561-10, L561-15">
        {/* Outils de screening pré-remplis avec le nom du client */}
        <ScreeningTools form={form} set={set} dossierId={dossierId} screeningEnabled={screeningEnabled} />

        <BinaryField
          label="Personne sous gel des avoirs ?"
          value={form.gelAvoirs}
          onChange={(v) => set("gelAvoirs", v)}
          yesIsBad={true}
        />
        {form.gelAvoirs && (
          <Field label="Date de l'arrêté">
            <input type="date" className={inputStyle} value={form.gelDate} onChange={(e) => set("gelDate", e.target.value)} />
          </Field>
        )}
        <BinaryField
          label="Présence sur une liste de sanctions internationales (UE / ONU / Trésor) ?"
          value={form.sanctionsListe}
          onChange={(v) => set("sanctionsListe", v)}
          yesIsBad={true}
        />
        <BinaryField
          label="Le client lui-même est-il une Personne Politiquement Exposée (PPE) ?"
          value={form.ppe}
          onChange={(v) => set("ppe", v)}
          yesIsBad={true}
        />
        <BinaryField
          label="Un proche du client est-il PPE ? (conjoint, parent, enfant, fratrie, beau-parent — L561-10 1°)"
          value={form.ppeProcheDetecte}
          onChange={(v) => set("ppeProcheDetecte", v)}
          yesIsBad={true}
        />
      </Sect>
    </>
  );
}

/* ─── ScreeningTools : appel API OpenSanctions inline, résultats côté serveur ─
 *
 * Avant : un lien externe vers opensanctions.org/search → l'agent lisait visuellement.
 * Maintenant : appel /api/screening/sanctions, résultats inline avec score,
 * datasets et topic. Persistance dans screening_runs pour preuve d'audit.
 *
 * Les gates D1 (gel) et D2 (sanctions int.) sont SUGGÉRÉES par l'API ; la
 * validation finale reste manuelle (l'agent confirme via les BinaryField en
 * dessous) — un score 0.7 sur "Jean Dupont" peut être un faux positif.
 */

interface SanctionMatchUI {
  id: string;
  score: number;
  caption: string;
  topics: string[];
  datasets: string[];
  countries: string[];
  aliases: string[];
  url: string;
}

interface ScreeningResponse {
  runId: string;
  ranAt: string;
  matches: SanctionMatchUI[];
  topScore: number | null;
  suggestedGates: { d1: boolean; d2: boolean; reasoning: string[] };
}

/* ─── Repli criblage manuel (quand OpenSanctions n'est pas configuré) ───── */
function ManualScreeningFallback({ name, hasName }: { name: string; hasName: boolean }) {
  const openSanctions = `https://www.opensanctions.org/search/?q=${encodeURIComponent(name)}`;
  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "linear-gradient(180deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04) 60%, rgba(255,255,255,0.02))",
        border: "1px solid rgba(168,85,247,0.25)",
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#6d28d9" }}>
        Vérification des sanctions internationales
      </div>
      <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#475569" }}>
        {hasName
          ? <>Lancez une recherche pour <span className="font-semibold" style={{ color: "#0f172a" }}>«&nbsp;{name}&nbsp;»</span> sur les listes officielles agrégées (DGT Trésor · UE · ONU · OFAC · 200+ listes), puis renseignez les réponses ci-dessous.</>
          : <>Renseignez le nom du client à l&apos;étape 1 pour activer la vérification.</>}
      </p>
      <a
        href={hasName ? openSanctions : undefined}
        target="_blank"
        rel="noreferrer noopener"
        aria-disabled={!hasName}
        onClick={(e) => { if (!hasName) e.preventDefault(); }}
        className="flex items-center justify-center gap-2.5 rounded-lg px-4 py-3 transition-all w-full"
        style={{
          background: hasName ? "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.18)",
          cursor: hasName ? "pointer" : "not-allowed",
          opacity: hasName ? 1 : 0.5,
          color: "white", fontWeight: 600, fontSize: 13, textDecoration: "none",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        {hasName ? "Vérifier sur OpenSanctions" : "Nom du client requis"}
      </a>
    </div>
  );
}

function ScreeningTools({
  form,
  set,
  dossierId,
  screeningEnabled = false,
}: {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
  dossierId?: string;
  screeningEnabled?: boolean;
}) {
  const cleanedName = form.nomPrenom.trim();
  const hasName = cleanedName.length >= 2;
  const canScreen = hasName && !!dossierId;

  // ─── Repli : criblage automatique non activé (pas de clé OpenSanctions) ──
  // On présente le lien manuel vers OpenSanctions — l'agent vérifie lui-même,
  // comportement standard et conforme. Le criblage auto s'activera dès qu'une
  // clé API sera configurée.
  if (!screeningEnabled) {
    return <ManualScreeningFallback name={cleanedName} hasName={hasName} />;
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResponse | null>(null);

  const runScreening = async (manual: boolean) => {
    if (!canScreen) return;
    setLoading(true);
    setError(null);
    try {
      // Voie manuelle (POST /api/dossiers/[id]/rescreen) : rate-limit dédié,
      // utilise lib/rescreening pour comparer avec le dernier run et flagger
      // une alerte si nouveau hit. C'est la voie à utiliser pour vérifier sans
      // attendre le cron quotidien.
      // Voie initiale (POST /api/screening/sanctions) : premier screening sur
      // un dossier — appelée typiquement au moment de la création.
      const endpoint = manual ? `/api/dossiers/${dossierId}/rescreen` : "/api/screening/sanctions";
      const body = manual ? undefined : JSON.stringify({
        dossierId,
        name: cleanedName,
        birthDate: form.dateNaissance || undefined,
        nationality: form.nationalite || undefined,
        isOrganization: form.typeClient === "morale",
      });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? `HTTP ${res.status}`);
      }

      // La voie manuelle ne renvoie pas le payload "matches" complet (juste un
      // résumé) — on recharge si nécessaire. Pour la voie initiale, data est
      // déjà la ScreeningResponse complète.
      if (manual) {
        // Recharge le screening "frais" pour afficher les matches
        const refresh = await fetch("/api/screening/sanctions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dossierId,
            name: cleanedName,
            birthDate: form.dateNaissance || undefined,
            nationality: form.nationalite || undefined,
            isOrganization: form.typeClient === "morale",
          }),
        });
        if (refresh.ok) {
          setResult(await refresh.json());
        }
      } else {
        setResult(data as ScreeningResponse);
      }

      // Si l'API n'a renvoyé AUCUN match au-dessus du seuil de pertinence,
      // on pré-coche les deux gates à "non" (le client n'apparaît sur aucune
      // liste). L'agent peut toujours forcer manuellement.
      const r = manual ? null : (data as ScreeningResponse);
      if (r && r.matches.length === 0) {
        if (form.gelAvoirs === null) set("gelAvoirs", false);
        if (form.sanctionsListe === null) set("sanctionsListe", false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Application des suggestions de gates (le bouton "Appliquer la suggestion")
  const applySuggestion = () => {
    if (!result) return;
    set("gelAvoirs", result.suggestedGates.d1);
    set("sanctionsListe", result.suggestedGates.d2);
  };

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "linear-gradient(180deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04) 60%, rgba(255,255,255,0.02))",
        border: "1px solid rgba(168,85,247,0.25)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 30px -10px rgba(168,85,247,0.18)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#6d28d9" }}>
            Screening sanctions automatique
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#475569" }}>
            {hasName ? (
              <>Vérifie <span className="font-semibold" style={{ color: "#0f172a" }}>«&nbsp;{cleanedName}&nbsp;»</span> contre les listes agrégées (DGT Trésor FR · UE Consolidated · ONU · OFAC · 200+ autres). Résultats horodatés et conservés pour audit.</>
            ) : (
              <>Renseignez d&apos;abord le nom du client à l&apos;étape 1 pour activer le screening.</>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => runScreening(!!result)}
        disabled={!canScreen || loading}
        className="flex items-center justify-center gap-2.5 rounded-lg px-4 py-3 transition-all w-full"
        style={{
          background: canScreen && !loading
            ? "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)"
            : "rgba(255,255,255,0.04)",
          border: canScreen ? "1px solid rgba(255,255,255,0.20)" : "1px solid rgba(255,255,255,0.08)",
          cursor: canScreen && !loading ? "pointer" : "not-allowed",
          opacity: canScreen && !loading ? 1 : 0.5,
          boxShadow: canScreen && !loading
            ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 20px rgba(168,85,247,0.30)"
            : "none",
          color: "white",
          fontWeight: 600,
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-[13px]">Vérification en cours…</span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <span className="text-[13px]">
              {result ? "Relancer le screening" : canScreen ? "Lancer le screening" : !hasName ? "Nom du client requis" : "Dossier non sauvegardé"}
            </span>
          </>
        )}
      </button>

      {/* ─── Erreur ──────────────────────────────────────────────────── */}
      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.30)",
            color: "#b91c1c",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ─── Résultats ───────────────────────────────────────────────── */}
      {result && !error && (
        <div className="mt-4">
          {result.matches.length === 0 ? (
            <div
              className="rounded-lg px-3 py-3 text-[12.5px] flex items-start gap-2"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.30)",
                color: "#065f46",
              }}
            >
              <span className="text-[14px] leading-none mt-0.5">✓</span>
              <div>
                <div className="font-semibold mb-0.5">Aucune correspondance significative</div>
                <div className="text-[11.5px]" style={{ color: "#047857" }}>
                  Le client n&apos;apparaît sur aucune liste consultée
                  {result.topScore !== null && ` (meilleur score : ${(result.topScore * 100).toFixed(0)}%, en deçà du seuil 50%)`}.
                  Les gates D1 et D2 sont pré-cochées à <strong>Non</strong>.
                </div>
                <div className="text-[10.5px] mt-1.5" style={{ color: "#059669" }}>
                  Vérification du {new Date(result.ranAt).toLocaleString("fr-FR")} · ID {result.runId.slice(0, 8)}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="rounded-lg px-3 py-2 text-[12px] flex items-center justify-between gap-3 mb-2"
                style={{
                  background: "rgba(245,158,11,0.10)",
                  border: "1px solid rgba(245,158,11,0.30)",
                  color: "#92400e",
                }}
              >
                <span>
                  <strong>{result.matches.length} correspondance{result.matches.length > 1 ? "s" : ""} potentielle{result.matches.length > 1 ? "s" : ""}</strong> à examiner manuellement.
                </span>
                {(result.suggestedGates.d1 || result.suggestedGates.d2) && (
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "white",
                      border: "1px solid rgba(245,158,11,0.50)",
                    }}
                  >
                    Appliquer la suggestion (D{result.suggestedGates.d1 ? "1" : ""}{result.suggestedGates.d1 && result.suggestedGates.d2 ? "+" : ""}{result.suggestedGates.d2 ? "2" : ""})
                  </button>
                )}
              </div>

              {result.suggestedGates.reasoning.length > 0 && (
                <ul className="text-[11px] mb-2 pl-3 space-y-0.5" style={{ color: "#92400e" }}>
                  {result.suggestedGates.reasoning.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}

              <div className="space-y-2">
                {result.matches.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>

              <div className="text-[10.5px] mt-2" style={{ color: "#64748b" }}>
                Vérification du {new Date(result.ranAt).toLocaleString("fr-FR")} · ID {result.runId.slice(0, 8)} · Source : OpenSanctions.org
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: SanctionMatchUI }) {
  const scorePct = Math.round(match.score * 100);
  const isHigh = match.score >= 0.85;
  const isMedium = match.score >= 0.7 && match.score < 0.85;

  const colors = isHigh
    ? { fg: "#b91c1c", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.30)" }
    : isMedium
      ? { fg: "#b45309", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.30)" }
      : { fg: "#475569", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.25)" };

  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px]" style={{ color: "#0f172a" }}>
            {match.caption}
          </div>
          {match.aliases.length > 0 && (
            <div className="text-[10.5px] mt-0.5" style={{ color: "#64748b" }}>
              Alias : {match.aliases.slice(0, 3).join(" · ")}
              {match.aliases.length > 3 && ` +${match.aliases.length - 3}`}
            </div>
          )}
        </div>
        <div
          className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{
            background: colors.fg,
            color: "white",
          }}
        >
          {scorePct}%
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-1.5">
        {match.topics.slice(0, 4).map((t) => (
          <span
            key={t}
            className="text-[9.5px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(15,23,42,0.06)",
              color: "#334155",
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            {t}
          </span>
        ))}
        {match.countries.slice(0, 3).map((c) => (
          <span
            key={c}
            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(124,58,237,0.06)",
              color: "#6d28d9",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
          >
            {c.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-[10px]" style={{ color: "#94a3b8" }}>
          Datasets : {match.datasets.slice(0, 3).join(", ")}{match.datasets.length > 3 && " …"}
        </div>
        <a
          href={match.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[10.5px] font-semibold underline underline-offset-2"
          style={{ color: colors.fg }}
        >
          Détails ↗
        </a>
      </div>
    </div>
  );
}