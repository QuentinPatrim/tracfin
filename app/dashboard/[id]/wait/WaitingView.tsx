// app/dashboard/[id]/wait/WaitingView.tsx — Vue client "En attente"

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Mail, MessageCircle, Clock, Eye, Trash2, RefreshCw, Inbox,
} from "lucide-react";
import AmbientOrbs from "@/components/tracfin/AmbientOrbs";

interface Props {
  dossierId: string;
  nomPrenom: string;
  emailContact: string | null;
  token: string;
  linkStatus: string;
  openedAt: string | null;
  expiresAt: string;
}

export default function WaitingView({
  dossierId, nomPrenom, emailContact, token, linkStatus, openedAt, expiresAt,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/kyc/${token}` : `/kyc/${token}`;

  const message =
    `Bonjour ${nomPrenom},\n\n` +
    `Dans le cadre de notre relation et conformément aux obligations légales LCB-FT, je vous invite à remplir le formulaire suivant en y joignant les pièces justificatives demandées :\n\n` +
    `${link}\n\n` +
    `Ce lien est valable 30 jours. Vos données sont sécurisées et confidentielles.\n\n` +
    `Bien cordialement.`;

  const mailtoLink = `mailto:${encodeURIComponent(emailContact ?? "")}?subject=${encodeURIComponent("Vérification d'identité — KYC")}&body=${encodeURIComponent(message)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const cancelDossier = async () => {
    if (!confirm(`Annuler le dossier de ${nomPrenom} ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch {
      setDeleting(false);
    }
  };

  const expiresIn = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  const opened = !!openedAt;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#06070D", fontFamily: "Inter, sans-serif" }}>
      <AmbientOrbs />

      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <button
            onClick={refreshStatus}
            className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Icône principale animée */}
          <div className="flex justify-center mb-8">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.08))",
                boxShadow: "0 0 0 1px rgba(168,85,247,0.40), 0 0 50px rgba(168,85,247,0.30), 0 1px 0 rgba(255,255,255,0.20) inset",
              }}
            >
              {/* Anneau qui pulse */}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid rgba(168,85,247,0.40)",
                  animation: "pulse-ring 2s ease-out infinite",
                }}
              />
              <Inbox className="w-9 h-9 text-violet-200" strokeWidth={1.8} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.025em] mb-3">
              En attente du client
            </h1>
            <p className="text-white/55 leading-relaxed text-sm md:text-base max-w-md mx-auto">
              Le dossier de <span className="text-white font-medium">{nomPrenom}</span> est créé.
              Dès que la fiche KYC sera complétée, le formulaire d'analyse de risque s'ouvrira automatiquement avec les données pré-remplies.
            </p>
          </div>

          {/* Card statut */}
          <div
            className="relative rounded-3xl p-6 mb-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(168,85,247,0.30)",
            }}
          >
            <div className="absolute inset-x-6 top-0 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 50%, transparent)" }}
            />

            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-bold mb-4">
                Statut du lien
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <StatusItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Lien envoyé"
                  active
                />
                <StatusItem
                  icon={<Eye className="w-4 h-4" />}
                  label={opened ? "Ouvert par le client" : "Pas encore ouvert"}
                  active={opened}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Clock className="w-3.5 h-3.5" />
                <span>Expire dans {expiresIn} {expiresIn > 1 ? "jours" : "jour"}</span>
              </div>
            </div>
          </div>

          {/* Card lien partageable */}
          <div
            className="relative rounded-3xl p-6 mb-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-x-6 top-0 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20) 50%, transparent)" }}
            />

            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-3">
                Lien sécurisé à partager
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] mb-5"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.06) inset" }}
              >
                <input
                  readOnly
                  value={link}
                  onClick={(e) => e.currentTarget.select()}
                  className="flex-1 bg-transparent outline-none text-xs text-white/85 font-mono truncate"
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

              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3 font-bold">
                Renvoyer via
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ShareButton href={mailtoLink} icon={<Mail className="w-4 h-4 text-indigo-300" />} label="Email" />
                <ShareButton href={whatsappLink} target="_blank" icon={<MessageCircle className="w-4 h-4 text-emerald-300" />} label="WhatsApp" />
                <ShareButton onClick={copyMessage} icon={<Copy className="w-4 h-4 text-violet-300" />} label="Message" />
              </div>
            </div>
          </div>

          {/* Action danger */}
          <button
            onClick={cancelDossier}
            disabled={deleting}
            className="w-full py-3 rounded-full text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Suppression..." : "Annuler ce dossier"}
          </button>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function StatusItem({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(52,211,153,0.10), rgba(52,211,153,0.03))"
          : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        boxShadow: active
          ? "0 0 0 1px rgba(52,211,153,0.30), 0 1px 0 rgba(255,255,255,0.10) inset"
          : "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.06) inset",
      }}
    >
      <div className={active ? "text-emerald-300" : "text-white/30"}>
        {icon}
      </div>
      <div className={`text-xs font-medium ${active ? "text-white/85" : "text-white/40"}`}>
        {label}
      </div>
    </div>
  );
}

function ShareButton({
  href, target, onClick, icon, label,
}: {
  href?: string;
  target?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const className = "group flex flex-col items-center gap-2 py-3 rounded-xl transition";
  const style: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset",
  };

  if (href) {
    return (
      <a href={href} target={target} rel={target ? "noreferrer" : undefined} className={className} style={style}>
        {icon}
        <span className="text-[11px] text-white/70 font-medium">{label}</span>
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className} style={style}>
      {icon}
      <span className="text-[11px] text-white/70 font-medium">{label}</span>
    </button>
  );
}