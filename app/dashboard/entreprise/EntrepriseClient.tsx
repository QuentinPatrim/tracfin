// app/dashboard/entreprise/EntrepriseClient.tsx — UI du profil de conformité
//
// Parcours : rechercher son entreprise au registre officiel → fiche pré-remplie
// (SIREN, forme, dirigeants, CA…) → déclarer activités + clientèles → le moteur
// de vigilance dérive obligations & points à surveiller → enregistrer.

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Building2, Search, Loader2, Check, ShieldAlert, ShieldCheck,
  Users, Landmark, PenLine, AlertTriangle, Plus, X,
} from "lucide-react";
import type { RegistryResult } from "@/lib/entreprise";
import {
  ACTIVITES, CLIENTELES, OBLIGATIONS_SOCLE, buildVigilance, suggestActivitesFromNaf,
} from "@/lib/vigilance";

interface Profile {
  id?: string;
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

const EMPTY: Profile = {
  siren: "", raisonSociale: "", formeJuridique: "", nafCode: "", nafLibelle: "",
  dateCreation: "", effectif: "", categorie: "", adresse: "",
  dirigeants: [], finances: [], activites: [], clienteles: [], notes: "",
};

const fmtEuro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
};

export default function EntrepriseClient() {
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [dirty, setDirty] = useState(false);

  // Recherche registre
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RegistryResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/entreprise/profile");
        const data = await res.json();
        if (data.needsMigration) setNeedsMigration(true);
        if (data.profile) {
          setProfile(data.profile);
          setDraft(data.profile);
        }
      } catch {
        /* réseau — la page reste sur l'état recherche */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const search = async () => {
    if (query.trim().length < 2 || searching) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/entreprise/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResults(data.results ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  const pick = (r: RegistryResult) => {
    setDraft({
      ...EMPTY,
      ...r,
      activites: suggestActivitesFromNaf(r.nafCode),
      clienteles: ["particuliers_fr"],
      notes: "",
    });
    setDirty(true);
    setResults(null);
  };

  const manual = () => {
    setDraft({ ...EMPTY, raisonSociale: query.trim() || "" });
    setDirty(true);
    setResults(null);
  };

  const toggle = (field: "activites" | "clienteles", key: string) => {
    if (!draft) return;
    const cur = draft[field];
    setDraft({ ...draft, [field]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] });
    setDirty(true);
  };

  /* ── Édition des dirigeants ── */
  const setDirigeant = (i: number, field: "nom" | "qualite", value: string) => {
    if (!draft) return;
    const next = draft.dirigeants.map((d, j) => (j === i ? { ...d, [field]: value } : d));
    setDraft({ ...draft, dirigeants: next });
    setDirty(true);
  };
  const addDirigeant = () => {
    if (!draft) return;
    setDraft({ ...draft, dirigeants: [...draft.dirigeants, { nom: "", qualite: "" }] });
    setDirty(true);
  };
  const removeDirigeant = (i: number) => {
    if (!draft) return;
    setDraft({ ...draft, dirigeants: draft.dirigeants.filter((_, j) => j !== i) });
    setDirty(true);
  };

  /* ── Édition du chiffre d'affaires ── */
  const setFinance = (i: number, field: "annee" | "ca", value: string) => {
    if (!draft) return;
    const next = draft.finances.map((f, j) => {
      if (j !== i) return f;
      if (field === "annee") return { ...f, annee: value.replace(/[^\d]/g, "").slice(0, 4) };
      const n = parseInt(value.replace(/[^\d]/g, ""), 10);
      return { ...f, ca: isNaN(n) ? null : n };
    });
    setDraft({ ...draft, finances: next });
    setDirty(true);
  };
  const addFinance = () => {
    if (!draft) return;
    setDraft({ ...draft, finances: [{ annee: "", ca: null, resultatNet: null }, ...draft.finances] });
    setDirty(true);
  };
  const removeFinance = (i: number) => {
    if (!draft) return;
    setDraft({ ...draft, finances: draft.finances.filter((_, j) => j !== i) });
    setDirty(true);
  };

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/entreprise/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setProfile(data.profile);
      setDraft(data.profile);
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const vigilance = useMemo(
    () => (draft ? buildVigilance(draft.activites, draft.clienteles) : []),
    [draft],
  );

  return (
    <div style={{ padding: "24px 28px 80px", maxWidth: 1060 }}>
      <Link
        href="/dashboard"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 10 }}
      >
        <ArrowLeft size={14} /> Retour au dashboard
      </Link>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#6d28d9", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
        <Building2 size={11} /> Mon entreprise
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", margin: "0 0 6px" }}>
        Profil de conformité
      </h1>
      <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 22px", maxWidth: 640, lineHeight: 1.55 }}>
        Klaris analyse votre entreprise (registre officiel INSEE/INPI) et vos activités pour établir
        vos obligations LCB-FT et les points à surveiller en priorité — la base de votre
        classification des risques (CMF L.561-4-1).
      </p>

      {needsMigration && (
        <Banner tone="warn" icon={AlertTriangle}>
          La table du profil n&apos;existe pas encore en base. Lancez la migration :
          <code style={{ display: "block", marginTop: 6, fontSize: 12, background: "rgba(15,23,42,0.05)", padding: "6px 10px", borderRadius: 6 }}>
            node --env-file=.env.local _migration/apply-vague1.mjs
          </code>
        </Banner>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13, padding: 40 }}>
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : !draft ? (
        /* ─── Étape 1 : recherche au registre ─── */
        <div style={card()}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            Trouvez votre entreprise
          </div>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px" }}>
            Nom commercial, raison sociale ou SIREN — nous récupérons vos informations officielles.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Ex. : Agence Dupont Immobilier, ou 104 908 934"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.14)", fontSize: 13.5, outline: "none", color: "#0f172a", background: "#fff" }}
            />
            <button onClick={search} disabled={searching || query.trim().length < 2} style={btnPrimary(searching || query.trim().length < 2)}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Rechercher
            </button>
          </div>

          {searchError && <p style={{ color: "#b91c1c", fontSize: 12.5, marginTop: 10 }}>{searchError}</p>}

          {results && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {results.length === 0 && (
                <p style={{ fontSize: 13, color: "#64748b" }}>Aucun résultat au registre.</p>
              )}
              {results.map((r) => (
                <button
                  key={r.siren}
                  onClick={() => pick(r)}
                  style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "#fff", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", display: "grid", placeItems: "center", color: "#6d28d9", flexShrink: 0 }}>
                    <Building2 size={15} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{r.raisonSociale}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                      SIREN {r.siren} · {r.formeJuridique || "—"} · {r.nafLibelle || r.nafCode || "activité n.c."}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>{r.adresse}</span>
                  </span>
                </button>
              ))}
              <button onClick={manual} style={{ alignSelf: "flex-start", marginTop: 4, fontSize: 12.5, color: "#6d28d9", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <PenLine size={12} /> Mon entreprise n&apos;apparaît pas — saisir manuellement
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ─── Étape 2 : fiche + déclaratif + vigilance ─── */
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", gap: 16, alignItems: "start" }} className="entreprise-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Identité */}
            <div style={card()}>
              <SectionTitle icon={Landmark} title="Identité (registre officiel)" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                <Field label="Raison sociale">
                  <input
                    value={draft.raisonSociale}
                    onChange={(e) => { setDraft({ ...draft, raisonSociale: e.target.value }); setDirty(true); }}
                    style={inputStyle()}
                  />
                </Field>
                <Field label="SIREN"><ReadOnly>{draft.siren || "—"}</ReadOnly></Field>
                <Field label="Forme juridique"><ReadOnly>{draft.formeJuridique || "—"}</ReadOnly></Field>
                <Field label="Création"><ReadOnly>{fmtDate(draft.dateCreation)}</ReadOnly></Field>
                <Field label="Activité (NAF)"><ReadOnly>{draft.nafLibelle || "—"}</ReadOnly></Field>
                <Field label="Effectif"><ReadOnly>{draft.effectif || "—"}</ReadOnly></Field>
                <Field label="Adresse" full><ReadOnly>{draft.adresse || "—"}</ReadOnly></Field>
              </div>

              {/* Dirigeants — pré-remplis depuis le registre, entièrement éditables */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 6px" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8" }}>Dirigeants</span>
                <button onClick={addDirigeant} style={addBtn()}>
                  <Plus size={11} /> Ajouter
                </button>
              </div>
              {draft.dirigeants.length === 0 ? (
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Aucun dirigeant renseigné.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {draft.dirigeants.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={d.nom}
                        onChange={(e) => setDirigeant(i, "nom", e.target.value)}
                        placeholder="Nom et prénom"
                        style={{ ...inputStyle(), flex: 1.2 }}
                      />
                      <input
                        value={d.qualite}
                        onChange={(e) => setDirigeant(i, "qualite", e.target.value)}
                        placeholder="Fonction (Gérant, Président…)"
                        style={{ ...inputStyle(), flex: 1 }}
                      />
                      <button onClick={() => removeDirigeant(i)} aria-label="Supprimer ce dirigeant" style={delBtn()}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chiffre d'affaires — valeurs publiées éditables + saisie manuelle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 6px" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8" }}>Chiffre d&apos;affaires</span>
                <button onClick={addFinance} style={addBtn()}>
                  <Plus size={11} /> Ajouter une année
                </button>
              </div>
              {draft.finances.length === 0 ? (
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Aucun CA renseigné (non publié au registre).</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {draft.finances.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={f.annee}
                        onChange={(e) => setFinance(i, "annee", e.target.value)}
                        placeholder="Année"
                        inputMode="numeric"
                        style={{ ...inputStyle(), width: 74, flex: "none", textAlign: "center" }}
                      />
                      <input
                        value={f.ca != null ? new Intl.NumberFormat("fr-FR").format(f.ca) : ""}
                        onChange={(e) => setFinance(i, "ca", e.target.value)}
                        placeholder="CA en € (ex. 450 000)"
                        inputMode="numeric"
                        style={{ ...inputStyle(), flex: 1 }}
                      />
                      <span style={{ fontSize: 11.5, color: "#047857", minWidth: 86, textAlign: "right" }}>
                        {f.ca != null ? fmtEuro(f.ca) : "—"}
                      </span>
                      <button onClick={() => removeFinance(i)} aria-label="Supprimer cette année" style={delBtn()}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activités */}
            <div style={card()}>
              <SectionTitle icon={Building2} title="Vos activités" hint="Cochez tout ce que vous exercez" />
              <CheckGrid items={ACTIVITES} selected={draft.activites} onToggle={(k) => toggle("activites", k)} />
            </div>

            {/* Clientèles */}
            <div style={card()}>
              <SectionTitle icon={Users} title="Votre clientèle" hint="Typologies rencontrées" />
              <CheckGrid items={CLIENTELES} selected={draft.clienteles} onToggle={(k) => toggle("clienteles", k)} />
            </div>

            {/* Enregistrer */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={save} disabled={saving || !dirty} style={btnPrimary(saving || !dirty)}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : savedFlash ? <Check size={14} /> : null}
                {savedFlash ? "Enregistré" : "Enregistrer le profil"}
              </button>
              {profile && (
                <button onClick={() => { setDraft(null); setResults(null); setQuery(""); }} style={{ fontSize: 12.5, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                  Changer d&apos;entreprise
                </button>
              )}
              {saveError && <span style={{ color: "#b91c1c", fontSize: 12.5 }}>{saveError}</span>}
            </div>
          </div>

          {/* Colonne droite : obligations + vigilance */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card("rgba(124,58,237,0.03)")}>
              <SectionTitle icon={ShieldAlert} title="Vos points de vigilance prioritaires" hint="Dérivés de vos activités & clientèles" />
              {vigilance.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "#64748b" }}>Cochez vos activités et clientèles : les points à surveiller apparaîtront ici.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {vigilance.map((p) => (
                    <div key={p.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#fff", border: `1px solid ${p.priorite === "haute" ? "rgba(220,38,38,0.25)" : "rgba(245,158,11,0.30)"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "2px 7px", borderRadius: 999, background: p.priorite === "haute" ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.10)", color: p.priorite === "haute" ? "#b91c1c" : "#b45309" }}>
                          {p.priorite === "haute" ? "Priorité haute" : "À surveiller"}
                        </span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.ref}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.titre}</div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>{p.detail}</div>
                      <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 5 }}>Déclenché par : {p.declencheurs.join(", ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card()}>
              <SectionTitle icon={ShieldCheck} title="Vos obligations LCB-FT (socle)" hint="Applicables à toute votre activité" />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {OBLIGATIONS_SOCLE.map((o) => (
                  <div key={o.titre} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <Check size={13} strokeWidth={3} style={{ color: "#047857", marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{o.titre}</span>
                      <span style={{ fontSize: 10.5, color: "#94a3b8", marginLeft: 6 }}>{o.ref}</span>
                      <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.45, marginTop: 1 }}>{o.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive : une colonne sous 900px */}
      <style>{`@media (max-width: 900px) { .entreprise-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ── Petits composants ── */

function card(bg = "#fff"): React.CSSProperties {
  return { background: bg, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 2px rgba(15,23,42,0.03)" };
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10,
    border: "none", cursor: disabled ? "default" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff",
    background: disabled ? "rgba(124,58,237,0.35)" : "linear-gradient(135deg, #7c3aed, #ec4899)",
    boxShadow: disabled ? "none" : "0 6px 16px rgba(124,58,237,0.30)",
  };
}

function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.14)", fontSize: 13, color: "#0f172a", background: "#fff", outline: "none" };
}

function addBtn(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999,
    border: "1px solid rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.06)",
    color: "#6d28d9", fontSize: 11, fontWeight: 700, cursor: "pointer",
  };
}

function delBtn(): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
    border: "1px solid rgba(15,23,42,0.10)", background: "#fff", color: "#94a3b8", cursor: "pointer",
  };
}

function SectionTitle({ icon: Icon, title, hint }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
      <Icon size={15} style={{ color: "#6d28d9", transform: "translateY(2px)" }} />
      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{title}</span>
      {hint && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94a3b8", marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function ReadOnly({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{children}</div>;
}

function CheckGrid({ items, selected, onToggle }: { items: Array<{ key: string; label: string; desc: string }>; selected: string[]; onToggle: (k: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {items.map((it) => {
        const on = selected.includes(it.key);
        return (
          <button
            key={it.key}
            onClick={() => onToggle(it.key)}
            style={{
              textAlign: "left", padding: "10px 12px", borderRadius: 10, cursor: "pointer",
              border: `1px solid ${on ? "rgba(124,58,237,0.40)" : "rgba(15,23,42,0.10)"}`,
              background: on ? "rgba(124,58,237,0.06)" : "#fff",
              display: "flex", gap: 9, alignItems: "flex-start",
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center", background: on ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "#fff", border: on ? "none" : "1.5px solid rgba(15,23,42,0.25)" }}>
              {on && <Check size={11} strokeWidth={3.5} style={{ color: "#fff" }} />}
            </span>
            <span>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{it.label}</span>
              <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 1 }}>{it.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Banner({ tone, icon: Icon, children }: { tone: "warn"; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; children: React.ReactNode }) {
  void tone;
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.30)", color: "#92400e", fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}
