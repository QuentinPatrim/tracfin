// app/dashboard/nouveau/NewDossierForm.tsx — Mini-formulaire création + modal

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Copy, Check, Mail, MessageCircle } from "lucide-react";
import AmbientOrbs from "@/components/tracfin/AmbientOrbs";

const inputStyle =
  "w-full bg-white/[0.04] border border-white/[0.12] rounded-xl px-4 py-[12px] text-white text-sm outline-none backdrop-blur-md placeholder:text-white/[0.30] transition-all focus:border-violet-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/10";

export default function NewDossierForm() {
  const router = useRouter();
  const [typeClient, setTypeClient] = useState<"physique" | "morale">("physique");
  const [nomPrenom, setNomPrenom] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // État après création réussie : on a le lien à partager
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
        body: JSON.stringify({ typeClient, nomPrenom, emailContact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCreated({ id: data.id, token: data.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setCreating(false);
    }
  };

  // Construction du lien partageable
  const link = created
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/kyc/${created.token}`
    : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const message =
    `Bonjour ${nomPrenom},\n\n` +
    `Dans le cadre de notre relation et conformément aux obligations légales LCB-FT, je vous invite à remplir le formulaire suivant en y joignant les pièces justificatives demandées :\n\n` +
    `${link}\n\n` +
    `Ce lien est valable 30 jours. Vos données sont sécurisées et confidentielles.\n\n` +
    `Bien cordialement.`;

  const mailtoLink = `mailto:${encodeURIComponent(emailContact)}?subject=${encodeURIComponent("Vérification d'identité — KYC")}&body=${encodeURIComponent(message)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  if (created) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#06070D", fontFamily: "Inter, sans-serif" }}>
        <AmbientOrbs />

        <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Retour au dashboard
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(180deg, rgba(52,211,153,0.20), rgba(52,211,153,0.08))",
                boxShadow: "0 0 0 1px rgba(52,211,153,0.40), 0 0 30px rgba(52,211,153,0.30), 0 1px 0 rgba(255,255,255,0.15) inset",
              }}
            >
              <Check className="w-7 h-7 text-emerald-300" strokeWidth={2.5} />
            </div>

            <h1 className="text-3xl font-extrabold tracking-[-0.025em] mb-3">
              Dossier créé ✨
            </h1>
            <p className="text-white/55 mb-8 leading-relaxed">
              Le lien KYC pour <span className="text-white font-medium">{nomPrenom}</span> est prêt.
              Partagez-le avec votre client par le moyen de votre choix.
            </p>

            <div
              className="rounded-2xl p-1 mb-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(168,85,247,0.30)",
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03]">
                <input
                  readOnly
                  value={link}
                  className="flex-1 bg-transparent outline-none text-xs text-white/85 font-mono truncate"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={copy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    copied ? "bg-emerald-500/20 text-emerald-300" : "bg-violet-500/20 text-violet-200 hover:bg-violet-500/30"
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
            </div>

            <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3 font-bold">
              Partager via
            </div>
            <div className="grid grid-cols-3 gap-3 mb-10">
              <a
                href={mailtoLink}
                className="group flex flex-col items-center gap-2 py-4 rounded-2xl transition"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset",
                }}
              >
                <Mail className="w-5 h-5 text-indigo-300" />
                <span className="text-xs text-white/70 font-medium">Email</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-2 py-4 rounded-2xl transition"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset",
                }}
              >
                <MessageCircle className="w-5 h-5 text-emerald-300" />
                <span className="text-xs text-white/70 font-medium">WhatsApp</span>
              </a>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="group flex flex-col items-center gap-2 py-4 rounded-2xl transition"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset",
                }}
              >
                <Copy className="w-5 h-5 text-violet-300" />
                <span className="text-xs text-white/70 font-medium">Message</span>
              </button>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-full text-white text-sm font-bold transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
                backgroundSize: "200% 200%",
                animation: "gradShift 6s ease infinite",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.30) inset, 0 10px 30px rgba(168,85,247,0.50)",
              }}
            >
              Retour au tableau de bord
            </button>

            <p className="text-[11px] text-white/35 mt-6 max-w-md mx-auto">
              Vous serez notifié dès que le client aura rempli sa fiche.
              Le formulaire d'analyse de risque s'ouvrira automatiquement avec les données pré-remplies.
            </p>
          </div>
        </main>

        <style jsx global>{`
          @keyframes gradShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#06070D", fontFamily: "Inter, sans-serif" }}>
      <AmbientOrbs />

      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Nouveau dossier</div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
              style={{
                background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.08))",
                boxShadow: "0 0 0 1px rgba(168,85,247,0.40), 0 0 24px rgba(168,85,247,0.30), 0 1px 0 rgba(255,255,255,0.15) inset",
              }}
            >
              <Send className="w-5 h-5 text-violet-200" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.025em] mb-3">
              Créer un dossier
            </h1>
            <p className="text-white/55 leading-relaxed text-sm">
              Renseignez quelques informations sur votre client.
              Un lien sécurisé sera généré pour qu'il complète sa fiche KYC.
            </p>
          </div>

          <div
            className="rounded-3xl p-7 mb-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(0,0,0,0.4)",
            }}
          >
            {/* Highlight top */}
            <div className="relative">
              <div className="flex flex-col gap-5">
                {/* Type de client */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-white/55 uppercase tracking-[0.12em]">
                    Type de client
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "physique", label: "Personne Physique" },
                      { value: "morale", label: "Personne Morale" },
                    ].map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTypeClient(o.value as "physique" | "morale")}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          typeClient === o.value ? "text-violet-200" : "text-white/45 hover:text-white/70"
                        }`}
                        style={
                          typeClient === o.value
                            ? {
                                background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.08))",
                                boxShadow: "0 0 0 1px rgba(168,85,247,0.40), 0 1px 0 rgba(255,255,255,0.10) inset, 0 0 16px -2px rgba(168,85,247,0.30)",
                              }
                            : {
                                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                                boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.06) inset",
                              }
                        }
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-white/55 uppercase tracking-[0.12em]">
                    {typeClient === "morale" ? "Dénomination sociale" : "Nom et prénom du client"}
                  </label>
                  <input
                    className={inputStyle}
                    value={nomPrenom}
                    onChange={(e) => setNomPrenom(e.target.value)}
                    placeholder={typeClient === "morale" ? "Ex: ACME SAS" : "Ex: Martin Claire"}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-white/55 uppercase tracking-[0.12em]">
                    Email du client
                  </label>
                  <input
                    type="email"
                    className={inputStyle}
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    placeholder="client@email.fr"
                  />
                  <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                    Cet email pré-remplira le bouton "Envoyer par mail" sur l'écran suivant.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!isValid || creating}
            className="w-full px-6 py-3.5 rounded-full text-white text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
              backgroundSize: "200% 200%",
              animation: "gradShift 6s ease infinite",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.30) inset, 0 10px 30px rgba(168,85,247,0.50)",
            }}
          >
            {creating ? "Création du dossier..." : "Créer le dossier et générer le lien"}
            {!creating && <Send className="w-4 h-4" />}
          </button>
        </div>
      </main>

      <style jsx global>{`
        @keyframes gradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}