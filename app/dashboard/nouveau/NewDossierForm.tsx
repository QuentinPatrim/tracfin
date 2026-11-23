// app/dashboard/nouveau/NewDossierForm.tsx — Création de dossier (light, cohérent dashboard)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Copy, Check, Mail, MessageCircle, Home, KeyRound } from "lucide-react";

const inputStyle =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm outline-none placeholder:text-slate-400 transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15";

type Partie = "vendeur" | "acquereur";

export default function NewDossierForm() {
  const router = useRouter();
  const [typeClient, setTypeClient] = useState<"physique" | "morale">("physique");
  const [partie, setPartie] = useState<Partie>("acquereur");
  const [nomPrenom, setNomPrenom] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // État après création réussie
  const [created, setCreated] = useState<{ id: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isValid = nomPrenom.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContact);

  const submit = async () => {
    if (!isValid) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeClient, partie, nomPrenom, emailContact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCreated({ id: data.id, token: data.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setCreating(false);
    }
  };

  const link = created
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/kyc/${created.token}`
    : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabel = partie === "vendeur" ? "vendeur" : "acquéreur";
  const message =
    `Bonjour ${nomPrenom},\n\n` +
    `Dans le cadre de votre projet immobilier en qualité de ${roleLabel}, et conformément aux obligations légales LCB-FT, je vous invite à remplir le formulaire suivant en y joignant les pièces justificatives demandées :\n\n` +
    `${link}\n\n` +
    `Ce lien est valable 30 jours. Vos données sont sécurisées et confidentielles.\n\n` +
    `Bien cordialement.`;

  const mailtoLink = `mailto:${encodeURIComponent(emailContact)}?subject=${encodeURIComponent("Vérification d'identité — KYC")}&body=${encodeURIComponent(message)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  /* ─── Écran "dossier créé" ─── */
  if (created) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FF", fontFamily: "var(--font-sans-face), system-ui, sans-serif", color: "#0B1435" }}>
        <BackgroundHalos />
        <Header />

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(180deg, rgba(30,158,106,0.18), rgba(30,158,106,0.08))",
                border: "1px solid rgba(30,158,106,0.40)",
                boxShadow: "0 0 0 4px rgba(30,158,106,0.10), 0 12px 30px rgba(30,158,106,0.20), 0 1px 0 rgba(255,255,255,0.50) inset",
              }}
            >
              <Check className="w-7 h-7" style={{ color: "#0F7A4F" }} strokeWidth={2.5} />
            </div>

            <h1
              className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-3"
              style={{
                color: "#0B1435",
              }}
            >
              Dossier créé ✨
            </h1>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Le lien KYC pour <span className="font-semibold text-slate-900">{nomPrenom}</span> est prêt.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold mb-7"
              style={{
                background: partie === "vendeur" ? "rgba(47,91,255,0.08)" : "rgba(47,91,255,0.08)",
                border: `1px solid ${partie === "vendeur" ? "rgba(47,91,255,0.25)" : "rgba(47,91,255,0.25)"}`,
                color: partie === "vendeur" ? "#1F45E0" : "#1F45E0",
              }}
            >
              {partie === "vendeur" ? <Home className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
              Côté {roleLabel}
            </div>

            {/* Lien */}
            <div
              className="rounded-2xl p-1 mb-6"
              style={{
                background: "white",
                border: "1px solid rgba(47,91,255,0.18)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 28px rgba(11,20,53,0.12)",
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(47,91,255,0.04)" }}>
                <input
                  readOnly
                  value={link}
                  className="flex-1 bg-transparent outline-none text-[12px] font-mono truncate"
                  style={{ color: "#47507A" }}
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={copy}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition inline-flex items-center gap-1.5"
                  style={
                    copied
                      ? { background: "rgba(30,158,106,0.12)", color: "#0F7A4F", border: "1px solid rgba(30,158,106,0.35)" }
                      : { background: "#2F5BFF", color: "white", boxShadow: "0 4px 12px rgba(11,20,53,0.12)" }
                  }
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
            </div>

            <div className="text-[12px] mb-3 font-bold" style={{ color: "#98A0BD" }}>
              Partager via
            </div>
            <div className="grid grid-cols-3 gap-3 mb-10">
              <ShareButton href={mailtoLink} icon={Mail} label="Email" />
              <ShareButton href={whatsappLink} icon={MessageCircle} label="WhatsApp" external />
              <ShareButton
                onClick={async () => {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                icon={Copy}
                label="Message"
              />
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-[10px] text-white text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{
                background: "#2F5BFF",
                boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 12px 30px rgba(11,20,53,0.12)",
              }}
            >
              Retour au tableau de bord
            </button>

            <p className="text-[11.5px] mt-6 max-w-md mx-auto leading-relaxed" style={{ color: "#98A0BD" }}>
              Vous serez notifié dès que le client aura rempli sa fiche. Le formulaire d&apos;analyse s&apos;ouvrira automatiquement avec les données pré-remplies.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ─── Écran "créer un dossier" ─── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FF", fontFamily: "var(--font-sans-face), system-ui, sans-serif", color: "#0B1435" }}>
      <BackgroundHalos />
      <Header />

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(47,91,255,0.18), rgba(47,91,255,0.10))",
                border: "1px solid rgba(47,91,255,0.30)",
                boxShadow: "0 6px 18px rgba(11,20,53,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
              }}
            >
              <Send className="w-5 h-5" style={{ color: "#1F45E0" }} />
            </div>
            <h1
              className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-3"
              style={{
                color: "#0B1435",
              }}
            >
              Créer un dossier
            </h1>
            <p className="text-slate-600 leading-relaxed text-sm">
              Renseignez quelques informations sur votre client. Un lien sécurisé sera généré pour qu&apos;il complète sa fiche KYC.
            </p>
          </div>

          <div
            className="rounded-3xl p-6 sm:p-7 mb-6"
            style={{
              background: "white",
              border: "1px solid rgba(47,91,255,0.10)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 38px rgba(11,20,53,0.12), 0 4px 12px rgba(11,20,53,0.04)",
            }}
          >
            <div className="flex flex-col gap-5">
              {/* Rôle (vendeur / acquéreur) — NOUVEAU */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold" style={{ color: "#1F45E0" }}>
                  Rôle dans la transaction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <PartieButton
                    active={partie === "vendeur"}
                    onClick={() => setPartie("vendeur")}
                    icon={Home}
                    label="Vendeur"
                    sub="Cède le bien"
                  />
                  <PartieButton
                    active={partie === "acquereur"}
                    onClick={() => setPartie("acquereur")}
                    icon={KeyRound}
                    label="Acquéreur"
                    sub="Achète le bien"
                  />
                </div>
                <p className="text-[11.5px] leading-relaxed mt-1" style={{ color: "#5B6487" }}>
                  La vigilance LCB-FT s&apos;applique aux 2 parties (Décret 2018-284). Les questions seront adaptées selon le rôle.
                </p>
              </div>

              {/* Type de client */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold" style={{ color: "#47507A" }}>
                  Type de client
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "physique", label: "Personne physique" },
                    { value: "morale", label: "Personne morale" },
                  ].map((o) => {
                    const active = typeClient === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTypeClient(o.value as "physique" | "morale")}
                        className="h-12 rounded-xl text-sm font-semibold transition-all border"
                        style={{
                          background: active
                            ? "linear-gradient(180deg, rgba(47,91,255,0.08), rgba(47,91,255,0.04))"
                            : "white",
                          borderColor: active ? "rgba(47,91,255,0.40)" : "rgba(11,20,53,0.10)",
                          color: active ? "#1F45E0" : "#47507A",
                          boxShadow: active ? "0 4px 12px rgba(47,91,255,0.12)" : "none",
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nom */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold" style={{ color: "#47507A" }}>
                  {typeClient === "morale" ? "Dénomination sociale" : "Nom et prénom du client"}
                </label>
                <input
                  className={inputStyle}
                  value={nomPrenom}
                  onChange={(e) => setNomPrenom(e.target.value)}
                  placeholder={typeClient === "morale" ? "Ex: ACME SAS" : "Ex: Martin Claire"}
                  autoComplete={typeClient === "morale" ? "organization" : "name"}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold" style={{ color: "#47507A" }}>
                  Email du client
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputStyle}
                  value={emailContact}
                  onChange={(e) => setEmailContact(e.target.value)}
                  placeholder="client@email.fr"
                />
                <p className="text-[11.5px] leading-relaxed mt-1" style={{ color: "#5B6487" }}>
                  Cet email pré-remplira le bouton « Envoyer par mail » sur l&apos;écran suivant.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-4 rounded-xl text-sm text-center"
              style={{
                background: "rgba(197,48,44,0.06)",
                border: "1px solid rgba(197,48,44,0.30)",
                color: "#A3241F",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!isValid || creating}
            className="w-full px-6 py-3.5 rounded-full text-white text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2"
            style={{
              background: "#2F5BFF",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 12px 30px rgba(11,20,53,0.12)",
            }}
          >
            {creating ? "Création du dossier..." : "Créer le dossier et générer le lien"}
            {!creating && <Send className="w-4 h-4" />}
          </button>
        </div>
      </main>
    </div>
  );
}

/* ─── Sous-composants ─── */

function Header() {
  return (
    <header
      className="relative z-10"
      style={{ borderBottom: "1px solid rgba(11,20,53,0.08)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 transition text-sm font-medium"
          style={{ color: "#5B6487" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
        <div className="text-[11.5px]" style={{ color: "#98A0BD" }}>
          Nouveau dossier
        </div>
      </div>
    </header>
  );
}

function BackgroundHalos() {
  return (
    <>
    </>
  );
}

function PartieButton({
  active, onClick, icon: Icon, label, sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[20px] px-4 py-3 text-left transition-all border"
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(47,91,255,0.10), rgba(47,91,255,0.04))"
          : "white",
        borderColor: active ? "rgba(47,91,255,0.45)" : "rgba(11,20,53,0.10)",
        boxShadow: active
          ? "0 8px 22px rgba(47,91,255,0.18), 0 1px 0 rgba(255,255,255,0.8) inset"
          : "0 1px 2px rgba(11,20,53,0.04)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-lg grid place-items-center"
          style={{
            background: active ? "rgba(47,91,255,0.14)" : "rgba(11,20,53,0.04)",
            border: `1px solid ${active ? "rgba(47,91,255,0.30)" : "rgba(11,20,53,0.08)"}`,
          }}
        >
          <Icon className={active ? "w-3.5 h-3.5" : "w-3.5 h-3.5"} />
        </div>
        <span className="font-bold text-[14px]" style={{ color: active ? "#1F45E0" : "#0B1435" }}>
          {label}
        </span>
      </div>
      <div className="text-[11.5px]" style={{ color: "#5B6487" }}>
        {sub}
      </div>
    </button>
  );
}

function ShareButton({
  href, onClick, icon: Icon, label, external,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  const styles = {
    background: "white",
    border: "1px solid rgba(11,20,53,0.10)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 12px rgba(11,20,53,0.04)",
    transition: "all .15s",
  };

  if (href) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="flex flex-col items-center gap-2 py-4 rounded-2xl transition hover:-translate-y-0.5"
        style={styles}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium" style={{ color: "#47507A" }}>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-4 rounded-2xl transition hover:-translate-y-0.5"
      style={styles}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium" style={{ color: "#47507A" }}>{label}</span>
    </button>
  );
}
