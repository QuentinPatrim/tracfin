// app/dashboard/[id]/wait/WaitingView.tsx — Vue client "En attente"

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Mail, MessageCircle, Clock, Eye, Trash2, RefreshCw, Inbox,
} from "lucide-react";
import { useOrigin } from "@/lib/use-origin";
import "@/components/dashboard/dossier/dossier.css";

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

  const origin = useOrigin();
  const link = `${origin}/kyc/${token}`;

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
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FF", color: "#0B1435", fontFamily: "var(--font-sans-face), system-ui, sans-serif" }}>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pt-6 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="kd-back">
          <ArrowLeft width={15} height={15} /> Dossiers
        </Link>
        <button type="button" onClick={refreshStatus} className="kd-back" style={{ border: 0, cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 650 }}>
          <RefreshCw width={14} height={14} className={refreshing ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-10 pb-16">
        <div className="w-full max-w-2xl">
          {/* Icône principale animée */}
          <div className="flex justify-center mb-8">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, rgba(47,91,255,0.20), rgba(47,91,255,0.08))",
                boxShadow: "0 0 0 1px rgba(11,20,53,0.12), 0 0 50px rgba(11,20,53,0.12), 0 1px 0 rgba(255,255,255,0.20) inset",
              }}
            >
              {/* Anneau qui pulse */}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid rgba(47,91,255,0.40)",
                  animation: "pulse-ring 2s ease-out infinite",
                }}
              />
              <Inbox className="w-9 h-9 text-violet-600" strokeWidth={1.8} />
            </div>
          </div>

          <div className="text-center mb-10">
            {/* Couleur explicite : sans elle le titre héritait du texte sombre de la page et restait illisible sur le fond d'encre. */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3" style={{ color: "#0B1435" }}>
              En attente du client
            </h1>
            <p className="text-slate-500 leading-relaxed text-sm md:text-base max-w-md mx-auto">
              Le dossier de <span className="text-slate-900 font-semibold">{nomPrenom}</span> est créé.
              Dès que la fiche KYC sera complétée, le formulaire d'analyse de risque s'ouvrira automatiquement avec les données pré-remplies.
            </p>
          </div>

          {/* Card statut */}
          <div
            className="relative rounded-3xl p-6 mb-5 overflow-hidden"
            style={{
              background: "#FFFFFF",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: "0 0 0 1px rgba(11,20,53,0.07), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(11,20,53,0.12)",
            }}
          >
            <div className="absolute inset-x-6 top-0 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 50%, transparent)" }}
            />

            <div className="relative">
              <div className="text-[11.5px] text-violet-600 font-bold mb-4">
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

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Expire dans {expiresIn} {expiresIn > 1 ? "jours" : "jour"}</span>
              </div>
            </div>
          </div>

          {/* Card lien partageable */}
          <div
            className="relative rounded-3xl p-6 mb-5 overflow-hidden"
            style={{
              background: "#FFFFFF",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: "0 0 0 1px rgba(11,20,53,0.07), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-x-6 top-0 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20) 50%, transparent)" }}
            />

            <div className="relative">
              <div className="text-[11.5px] text-slate-500 font-bold mb-3">
                Lien sécurisé à partager
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[#F5F7FF] mb-5"
                style={{ boxShadow: "0 0 0 1px rgba(11,20,53,0.07), 0 1px 0 rgba(255,255,255,0.06) inset" }}
              >
                <input
                  readOnly
                  value={link}
                  onClick={(e) => e.currentTarget.select()}
                  className="flex-1 bg-transparent outline-none text-xs text-slate-700 font-mono truncate"
                />
                <button
                  onClick={copy}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    copied ? "bg-emerald-500/20 text-emerald-600" : "bg-violet-500 text-white hover:bg-violet-600"
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>

              <div className="text-[12px] text-slate-500 mb-3 font-bold">
                Renvoyer via
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ShareButton href={mailtoLink} icon={<Mail className="w-4 h-4 text-indigo-500" />} label="Email" />
                <ShareButton href={whatsappLink} target="_blank" icon={<MessageCircle className="w-4 h-4 text-emerald-600" />} label="WhatsApp" />
                <ShareButton onClick={copyMessage} icon={<Copy className="w-4 h-4 text-violet-500" />} label="Message" />
              </div>
            </div>
          </div>

          {/* Action danger */}
          <button
            onClick={cancelDossier}
            disabled={deleting}
            className="w-full py-3 rounded-full text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(61,190,139,0.10), rgba(61,190,139,0.03))"
          : "#FFFFFF",
        boxShadow: active
          ? "0 0 0 1px rgba(61,190,139,0.30), 0 1px 0 rgba(255,255,255,0.10) inset"
          : "0 0 0 1px rgba(11,20,53,0.07), 0 1px 0 rgba(255,255,255,0.06) inset",
      }}
    >
      <div className={active ? "text-emerald-600" : "text-slate-500"}>
        {icon}
      </div>
      <div className={`text-xs font-medium ${active ? "text-slate-700" : "text-slate-500"}`}>
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
  const className = "group flex flex-col items-center gap-2 py-3 rounded-2xl transition";
  const style: React.CSSProperties = {
    background: "#FFFFFF",
    boxShadow: "0 0 0 1px rgba(11,20,53,0.07), 0 1px 0 rgba(255,255,255,0.10) inset",
  };

  if (href) {
    return (
      <a href={href} target={target} rel={target ? "noreferrer" : undefined} className={className} style={style}>
        {icon}
        <span className="text-[11px] text-slate-700 font-medium">{label}</span>
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className} style={style}>
      {icon}
      <span className="text-[11px] text-slate-700 font-medium">{label}</span>
    </button>
  );
}