// app/dashboard/integrations/IntegrationsClient.tsx — UI gestion clés API CRM

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Copy, Check, Trash2, AlertTriangle, Plug, Code, Loader2 } from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  label: string;
  api_key_prefix: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  use_count: number;
  created_at: string;
}

const PROVIDERS: Array<{ value: string; label: string; hint?: string }> = [
  { value: "hektor", label: "Hektor", hint: "CRM immobilier majeur" },
  { value: "apimo", label: "Apimo", hint: "CRM SeLoger / AVIV" },
  { value: "adapt", label: "Adapt Immo" },
  { value: "netty", label: "Netty" },
  { value: "zapier", label: "Zapier", hint: "Automation cross-CRM" },
  { value: "make", label: "Make.com", hint: "ex-Integromat" },
  { value: "generic", label: "Webhook générique", hint: "Pour tout autre outil" },
  { value: "custom", label: "Custom (script maison)" },
];

export default function IntegrationsClient() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState<{ apiKey: string; label: string; provider: string; callbackUrl: string | null; callbackSecret: string | null } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ? Le CRM qui l'utilise ne pourra plus créer de dossiers.")) return;
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  };

  const activeCount = integrations.filter((i) => i.status === "active").length;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://klaris-app.fr";

  return (
    <div style={{ padding: "24px 28px 80px" }}>
      <Link
        href="/dashboard"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", marginBottom: 10 }}
      >
        <ArrowLeft size={14} /> Retour au dashboard
      </Link>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#6d28d9", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 10 }}>
        <Plug size={11} /> Intégrations CRM
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, background: "linear-gradient(135deg, #0F172A, #6d28d9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Connecter votre CRM
          </h1>
          <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 720 }}>
            Créez une clé API pour que votre CRM immobilier (Hektor, Apimo, Adapt, Netty…) déclenche automatiquement la création d&apos;un dossier KYC Klaris dès qu&apos;un mandat est signé.
            Plus de double-saisie : l&apos;agent reçoit le lien KYC à envoyer au client en quelques secondes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", fontWeight: 600, fontSize: 13, border: 0, cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.25)", whiteSpace: "nowrap" }}
        >
          <Plus size={14} /> Nouvelle clé API
        </button>
      </div>

      {/* Endpoint réutilisable affiché en haut */}
      <EndpointCard baseUrl={baseUrl} />

      {/* Modal "clé créée" */}
      {newlyCreated && (
        <NewKeyModal newlyCreated={newlyCreated} onClose={() => { setNewlyCreated(null); load(); }} baseUrl={baseUrl} />
      )}

      {/* Modal création */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(k) => { setShowCreate(false); setNewlyCreated(k); }}
        />
      )}

      {/* Liste */}
      <section style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#6d28d9", marginBottom: 12 }}>
          Vos intégrations ({activeCount} active{activeCount > 1 ? "s" : ""})
        </div>

        {loading && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}><Loader2 size={14} className="animate-spin inline" /> Chargement…</div>}
        {error && <div style={{ padding: 12, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.30)", borderRadius: 8, color: "#b91c1c", fontSize: 13 }}>⚠️ {error}</div>}

        {!loading && integrations.length === 0 && (
          <div style={{ padding: 32, background: "rgba(124,58,237,0.04)", border: "1px dashed rgba(124,58,237,0.30)", borderRadius: 12, textAlign: "center", fontSize: 13.5, color: "#475569" }}>
            Aucune intégration pour l&apos;instant. Cliquez sur <strong>Nouvelle clé API</strong> pour connecter votre premier CRM.
          </div>
        )}

        {!loading && integrations.length > 0 && (
          <div style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "rgba(15,23,42,0.03)" }}>
                <tr>
                  <Th>Intégration</Th>
                  <Th>Provider</Th>
                  <Th>Clé</Th>
                  <Th>Utilisations</Th>
                  <Th>Dernier appel</Th>
                  <Th>Statut</Th>
                  <Th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {integrations.map((i) => (
                  <tr key={i.id} style={{ borderTop: "1px solid rgba(15,23,42,0.05)", opacity: i.status === "revoked" ? 0.55 : 1 }}>
                    <Td style={{ fontWeight: 500, color: "#0f172a" }}>
                      {i.label}
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        Créée le {new Date(i.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </Td>
                    <Td style={{ color: "#475569" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 6, background: "rgba(124,58,237,0.08)", color: "#6d28d9" }}>
                        {PROVIDERS.find((p) => p.value === i.provider)?.label ?? i.provider}
                      </span>
                    </Td>
                    <Td style={{ fontFamily: "monospace", color: "#64748b", fontSize: 12 }}>{i.api_key_prefix}…</Td>
                    <Td style={{ color: "#64748b" }}>{i.use_count}</Td>
                    <Td style={{ color: "#64748b" }}>
                      {i.last_used_at ? new Date(i.last_used_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </Td>
                    <Td>
                      <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: i.status === "active" ? "rgba(16,185,129,0.10)" : "rgba(148,163,184,0.15)", color: i.status === "active" ? "#047857" : "#64748b" }}>
                        {i.status === "active" ? "Active" : "Révoquée"}
                      </span>
                    </Td>
                    <Td>
                      {i.status === "active" && (
                        <button onClick={() => revoke(i.id)} style={{ background: "transparent", border: 0, color: "#dc2626", cursor: "pointer", padding: 4 }} title="Révoquer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DocSection baseUrl={baseUrl} />
    </div>
  );
}

/* ─── Endpoint visible en haut ─────────────────────────────────────────── */
function EndpointCard({ baseUrl }: { baseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${baseUrl}/api/webhooks/crm`;
  return (
    <div style={{ background: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <Plug size={18} style={{ color: "#6d28d9" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 2 }}>URL de webhook Klaris</div>
        <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "#0f172a", wordBreak: "break-all" }}>{url}</div>
      </div>
      <button
        onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", color: "#6d28d9", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copiée" : "Copier"}
      </button>
    </div>
  );
}

/* ─── Modale création ──────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (k: { apiKey: string; label: string; provider: string; callbackUrl: string | null; callbackSecret: string | null }) => void }) {
  const [provider, setProvider] = useState("hektor");
  const [label, setLabel] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, label: label.trim(), callbackUrl: callbackUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onCreated({ apiKey: data.apiKey, label: data.label, provider: data.provider, callbackUrl: data.callbackUrl, callbackSecret: data.callbackSecret });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 22 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Nouvelle clé API</h2>
        <div style={{ marginBottom: 14 }}>
          <label style={modalLabel}>Outil / CRM</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} style={modalInput}>
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}{p.hint ? ` — ${p.hint}` : ""}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={modalLabel}>Libellé interne</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Hektor prod — agence Paris 9"
            style={modalInput}
            maxLength={80}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Pour vous repérer si vous avez plusieurs clés. Affiché uniquement à vous.</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={modalLabel}>URL de callback <span style={{ textTransform: "none", letterSpacing: 0, color: "#94a3b8", fontWeight: 400 }}>(optionnel)</span></label>
          <input
            type="url"
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder="https://votre-crm.fr/webhooks/klaris"
            style={modalInput}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            Klaris y enverra les changements de statut (KYC reçu, verdict, déclaration, signature). Un secret HMAC sera généré pour vérifier l&apos;authenticité. Laissez vide pour ne recevoir aucun webhook sortant.
          </div>
        </div>
        {err && <div style={{ padding: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 6, color: "#b91c1c", fontSize: 12, marginBottom: 12 }}>⚠️ {err}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={creating} style={modalCancel}>Annuler</button>
          <button onClick={submit} disabled={creating || !label.trim()} style={{ ...modalPrimary, opacity: creating || !label.trim() ? 0.5 : 1 }}>
            {creating ? "Création…" : "Générer la clé"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Modale "clé créée" — affichée UNE SEULE FOIS ─────────────────────── */
function NewKeyModal({ newlyCreated, onClose, baseUrl }: { newlyCreated: { apiKey: string; label: string; provider: string; callbackUrl: string | null; callbackSecret: string | null }; onClose: () => void; baseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(newlyCreated.apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copySecret = async () => { if (!newlyCreated.callbackSecret) return; await navigator.clipboard.writeText(newlyCreated.callbackSecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 6, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)", color: "#047857", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>
          <Check size={11} /> Clé générée
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{newlyCreated.label}</h2>
        <p style={{ fontSize: 12.5, color: "#475569", margin: "0 0 14px", lineHeight: 1.55 }}>
          <strong style={{ color: "#b91c1c" }}>Copiez cette clé maintenant.</strong> Pour des raisons de sécurité, elle ne sera <strong>plus jamais affichée</strong>.
          Si vous la perdez, vous devrez en créer une nouvelle.
        </p>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <pre style={{ background: "#0f172a", color: "#a78bfa", padding: 12, borderRadius: 8, margin: 0, fontFamily: "monospace", fontSize: 13, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{newlyCreated.apiKey}</pre>
          <button onClick={copy} style={{ position: "absolute", top: 8, right: 8, padding: "5px 10px", background: copied ? "#10b981" : "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)", color: "white", borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {copied ? <><Check size={11} /> Copiée</> : <><Copy size={11} /> Copier</>}
          </button>
        </div>

        <div style={{ padding: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, fontSize: 12, color: "#92400e", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Sécurité.</strong> Cette clé donne les droits de créer des dossiers KYC sur votre compte. Conservez-la dans le coffre-fort sécurisé de votre CRM ou de votre outil d&apos;automation (Zapier, Make). Ne la committez jamais dans un repo Git.
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 6 }}>Configuration côté CRM (entrant) :</div>
        <pre style={{ background: "#FAF8FE", border: "1px solid #c4b5fd", color: "#0f172a", padding: 10, borderRadius: 6, margin: 0, fontSize: 11.5, overflow: "auto" }}>{`URL    : ${baseUrl}/api/webhooks/crm
Méthode: POST
Header : Authorization: Bearer ${newlyCreated.apiKey.slice(0, 16)}...`}</pre>

        {/* Secret HMAC sortant si callback configuré */}
        {newlyCreated.callbackSecret && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 6 }}>
              Secret de vérification des webhooks <strong>sortants</strong> (Klaris → {newlyCreated.callbackUrl}) :
            </div>
            <div style={{ position: "relative" }}>
              <pre style={{ background: "#0f172a", color: "#6ee7b7", padding: 12, borderRadius: 8, margin: 0, fontFamily: "monospace", fontSize: 12.5, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{newlyCreated.callbackSecret}</pre>
              <button onClick={copySecret} style={{ position: "absolute", top: 8, right: 8, padding: "5px 10px", background: copiedSecret ? "#10b981" : "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)", color: "white", borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {copiedSecret ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              Chaque webhook sortant porte l&apos;en-tête <code style={{ background: "#FAF8FE", padding: "1px 5px", borderRadius: 3 }}>X-Klaris-Signature-256: sha256=&lt;hmac&gt;</code>. Vérifiez-le côté CRM avec ce secret pour garantir l&apos;authenticité.
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button onClick={onClose} style={modalPrimary}>J&apos;ai copié {newlyCreated.callbackSecret ? "la clé et le secret" : "la clé"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Doc / snippets ───────────────────────────────────────────────────── */
function DocSection({ baseUrl }: { baseUrl: string }) {
  const curl = `curl -X POST "${baseUrl}/api/webhooks/crm" \\
  -H "Authorization: Bearer klr_VOTRE_CLE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client": {
      "type": "physique",
      "nom": "Dupont Jean",
      "email": "jean.dupont@example.com",
      "telephone": "+33612345678"
    },
    "operation": {
      "partie": "acquereur",
      "type": "vente",
      "montant_eur": 350000
    },
    "externalId": "HEKTOR-12345"
  }'`;

  const response = `{
  "ok": true,
  "dossierId": "f4a9c1b2-...",
  "kycLink": "${baseUrl}/kyc/aB3cD4eF...",
  "kycLinkExpiresAt": "2026-06-24T12:00:00Z",
  "idempotent": false
}`;

  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#6d28d9", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <Code size={12} /> Documentation API
      </div>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14, lineHeight: 1.55 }}>
        Voici comment configurer votre CRM pour qu&apos;il déclenche automatiquement la création d&apos;un dossier Klaris.
        Si votre CRM n&apos;a pas de webhook natif, utilisez <strong>Zapier</strong> ou <strong>Make.com</strong> comme intermédiaire (un trigger « nouveau mandat » → une action « POST HTTP »).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Requête (exemple curl)</div>
          <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, fontSize: 11, overflow: "auto", margin: 0, lineHeight: 1.5 }}>{curl}</pre>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Réponse (HTTP 201)</div>
          <pre style={{ background: "#FAF8FE", border: "1px solid #c4b5fd", color: "#0f172a", padding: 12, borderRadius: 8, fontSize: 11, overflow: "auto", margin: 0, lineHeight: 1.5 }}>{response}</pre>
        </div>
      </div>

      <div style={{ marginTop: 18, padding: 14, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, fontSize: 12.5, color: "#065f46" }}>
        <strong>💡 Idempotence.</strong> Si vous envoyez plusieurs fois le même <code style={{ background: "#0f172a", color: "#a7f3d0", padding: "1px 5px", borderRadius: 3 }}>externalId</code>, Klaris ne crée pas de doublon — le dossier existant est renvoyé avec son lien KYC.
      </div>

      <div style={{ marginTop: 14, padding: 14, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.20)", borderRadius: 10, fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>
        <strong style={{ color: "#6d28d9" }}>🔁 Webhooks sortants (Klaris → votre CRM).</strong> Si vous renseignez une <em>URL de callback</em> à la création de la clé, Klaris y enverra automatiquement les événements suivants :
        <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3, margin: "0 3px" }}>dossier.kyc_received</code>,
        <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3, margin: "0 3px" }}>dossier.scored</code>,
        <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3, margin: "0 3px" }}>dossier.declaration_submitted</code>,
        <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3, margin: "0 3px" }}>dossier.signed</code>.
        Chaque appel est signé (en-tête <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3 }}>X-Klaris-Signature-256</code>) et porte un <code style={{ background: "#0f172a", color: "#c4b5fd", padding: "1px 5px", borderRadius: 3 }}>X-Klaris-Event-Id</code> unique pour la déduplication. Votre CRM reste ainsi synchronisé avec le statut LCB-FT en temps quasi-réel.
      </div>
    </section>
  );
}

/* ─── Primitives UI ────────────────────────────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(580px, 100%)", background: "white", border: "1px solid rgba(124,58,237,0.20)", borderRadius: 16, boxShadow: "0 30px 80px rgba(15,23,42,0.18)", maxHeight: "90vh", overflow: "auto" }}>{children}</div>
    </div>
  );
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#64748b", ...style }}>{children}</th>;
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 14px", verticalAlign: "top", ...style }}>{children}</td>;
}

const modalLabel: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.12em" };
const modalInput: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 7, fontSize: 13, background: "white", fontFamily: "inherit" };
const modalCancel: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", color: "#334155", fontSize: 12.5, fontWeight: 500, cursor: "pointer" };
const modalPrimary: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", border: 0, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
