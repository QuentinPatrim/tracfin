// app/kyc/[token]/StepFooter.tsx — Footer sticky du wizard KYC

"use client";

import { ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

interface Props {
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
  submitting?: boolean;
  validationMessage?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
}

export default function StepFooter({
  isFirst, isLast, canProceed, submitting, validationMessage, onPrev, onNext, onSubmit,
}: Props) {
  return (
    <div
      className="sticky bottom-0 z-40 border-t border-white/[0.06]"
      style={{
        background: "rgba(6,7,13,0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
        {/* Message de validation */}
        {!canProceed && validationMessage && (
          <p className="text-[11.5px] text-pink-300/85 mb-2 text-center">
            {validationMessage}
          </p>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl text-[14px] font-semibold text-white/80 border border-white/[0.10] bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/[0.07]"
            aria-label="Étape précédente"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Précédent</span>
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[14px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canProceed
                  ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                  : "rgba(124,58,237,0.30)",
                boxShadow: canProceed
                  ? "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 22px rgba(124,58,237,0.40)"
                  : "none",
              }}
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canProceed || submitting}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[14px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canProceed && !submitting
                  ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                  : "rgba(124,58,237,0.30)",
                boxShadow: canProceed && !submitting
                  ? "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 22px rgba(124,58,237,0.40)"
                  : "none",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi sécurisé…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Transmettre mon dossier
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
