// components/kyc/SendKycModal.tsx — Modal pour générer un lien KYC à envoyer

"use client";

import { useState } from "react";
import { Copy, Check, Send, Mail, MessageCircle, X } from "lucide-react";

interface Props {
  dossierId: string;
  nomPrenom: string;
  onClose: () => void;
}

export default function SendKycModal({ dossierId, nomPrenom, onClose }: Props) {
  const [step, setStep] = useState<"intro" | "link">("intro");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/kyc-link`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const url = `${window.location.origin}/kyc/${data.token}`;
      setLink(url);
      setStep("link");
    } catch {
      alert("Erreur lors de la génération du lien");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const message = `Bonjour ${nomPrenom},\n\nDans le cadre de notre relation et conformément aux obligations légales LCB-FT, je vous invite à remplir le formulaire suivant en y joignant les pièces justificatives demandées :\n\n${link}\n\nCe lien est valable 30 jours. Vos données sont sécurisées et confidentielles.\n\nBien cordialement.`;

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = `mailto:?subject=${encodeURIComponent("Vérification d'identité — KYC")}&body=${encodeURIComponent(message)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(7,8,15,0.85)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900/90 border border-white/[0.12] rounded-2xl p-7 max-w-lg w-full backdrop-blur-2xl"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/40 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {step === "intro" && (
          <>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-5">
              <Send className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 tracking-tight">Envoyer une fiche KYC</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Un lien unique sécurisé sera généré pour <span className="text-white font-medium">{nomPrenom}</span>.
              Vous pourrez le partager par email, WhatsApp ou SMS. Le client n'aura pas besoin de créer un compte.
            </p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6 text-xs text-white/50 leading-relaxed">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Bon à savoir</div>
              Le lien expire après 30 jours. Vous serez notifié dès que le client aura complété sa fiche, et les données rempliront automatiquement votre formulaire Tracfin.
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="w-full px-6 py-3 rounded-full text-white text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-wait"
              style={{
                background: "linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
              }}
            >
              {generating ? "Génération..." : "Générer le lien sécurisé"}
            </button>
          </>
        )}

        {step === "link" && (
          <>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 tracking-tight">Lien généré</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              Partagez ce lien avec <span className="text-white font-medium">{nomPrenom}</span> par le moyen de votre choix.
            </p>

            <div className="bg-white/[0.04] border border-white/[0.12] rounded-xl p-3 mb-5 flex items-center gap-2">
              <input readOnly value={link} className="flex-1 bg-transparent outline-none text-xs text-white/80 font-mono truncate" />
              <button
                onClick={copy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  copied ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>

            <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3 font-bold">Partager via</div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <a
                href={mailtoLink}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] border border-white/[0.10] hover:bg-white/[0.07] transition"
              >
                <Mail className="w-5 h-5 text-indigo-400" />
                <span className="text-xs text-white/70 font-medium">Email</span>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] border border-white/[0.10] hover:bg-white/[0.07] transition"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-white/70 font-medium">WhatsApp</span>
              </a>
              <button
                onClick={copyMessage}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.04] border border-white/[0.10] hover:bg-white/[0.07] transition"
              >
                <Copy className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-white/70 font-medium">Message</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-full bg-white/[0.06] border border-white/[0.12] text-white/80 text-sm font-medium hover:bg-white/[0.10] transition"
            >
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  );
}