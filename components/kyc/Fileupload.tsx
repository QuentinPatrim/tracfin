// components/kyc/Fileupload.tsx — Upload mobile-first (caméra native + galerie)
// Pour le KYC public : appel à /api/upload qui pousse vers Scaleway Paris.

"use client";

import { useState, useRef } from "react";
import { Camera, FolderOpen, FileText, Image as ImageIcon, X, Check, Loader2, RefreshCw } from "lucide-react";

interface Props {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  dossierId: string;
  kycToken?: string;
  accept?: string;
  /** Active le bouton "Prendre une photo" (caméra native sur mobile) */
  enableCamera?: boolean;
}

const ACCEPT_DEFAULT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
const ACCEPT_IMAGE_ONLY = "image/jpeg,image/png,image/webp,image/heic";

export default function FileUpload({
  label,
  required = false,
  hint,
  value,
  onChange,
  dossierId,
  kycToken,
  accept = ACCEPT_DEFAULT,
  enableCamera = true,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop lourd (max 10 Mo). Compressez l'image ou choisissez un PDF.");
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dossierId", dossierId);
    if (kycToken) formData.append("kycToken", kycToken);

    try {
      // Progress simulé (fetch ne donne pas d'avancement upload)
      let p = 0;
      const interval = window.setInterval(() => {
        p = Math.min(p + Math.random() * 18, 92);
        setProgress(p);
      }, 200);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      window.clearInterval(interval);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi échoué");
      setProgress(100);
      onChange(data.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 400);
    }
  };

  const handleFile = (file: File | null) => {
    if (file) upload(file);
  };

  // ─── État affiché ─────────────────────────────────────────────────────
  const isLegacyUrl = value.startsWith("http://") || value.startsWith("https://");
  const previewUrl = !value
    ? ""
    : isLegacyUrl
      ? value
      : `/api/files/${value}${kycToken ? `?token=${encodeURIComponent(kycToken)}` : ""}`;

  const lower = (isLegacyUrl ? value : previewUrl).toLowerCase();
  const isPdf = lower.endsWith(".pdf") || (!isLegacyUrl && /\.pdf(\?|$)/i.test(value));
  const isImage = !!value && !isPdf;
  const fileName = value.split("/").pop()?.split("?")[0] ?? "";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11.5px] font-semibold text-white/65 uppercase tracking-[0.10em]">
        {label} {required && <span className="text-pink-300">*</span>}
      </label>

      {!value && !uploading && (
        <div className="grid grid-cols-2 gap-2">
          {enableCamera && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border transition-all"
              style={{
                background: "linear-gradient(180deg, rgba(124,58,237,0.10), rgba(236,72,153,0.04))",
                borderColor: "rgba(124,58,237,0.28)",
              }}
            >
              <Camera className="w-5 h-5 text-violet-200" />
              <span className="text-[12.5px] font-semibold text-white">Prendre une photo</span>
              <span className="text-[10px] text-white/45">Avec votre appareil</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <FolderOpen className="w-5 h-5 text-white/70" />
            <span className="text-[12.5px] font-semibold text-white">Choisir un fichier</span>
            <span className="text-[10px] text-white/45">PDF, JPG, PNG · 10 Mo</span>
          </button>

          {/* Inputs cachés */}
          {enableCamera && (
            <input
              ref={cameraInputRef}
              type="file"
              accept={ACCEPT_IMAGE_ONLY}
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          )}
          <input
            ref={galleryInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {/* ─── Upload en cours ──────────────────────────────────── */}
      {uploading && (
        <div
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{
            background: "linear-gradient(180deg, rgba(124,58,237,0.08), rgba(236,72,153,0.03))",
            borderColor: "rgba(124,58,237,0.30)",
          }}
        >
          <Loader2 className="w-5 h-5 text-violet-200 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] text-white font-semibold mb-1">Envoi sécurisé…</div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${Math.round(progress)}%`,
                  background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                  boxShadow: "0 0 8px rgba(124,58,237,0.50)",
                }}
              />
            </div>
            <div className="text-[10px] text-white/45 mt-1">{Math.round(progress)} % · chiffré TLS 1.3</div>
          </div>
        </div>
      )}

      {/* ─── Fichier reçu ─────────────────────────────────────── */}
      {value && !uploading && (
        <div
          className="rounded-xl p-3 border flex items-center gap-3"
          style={{
            background: "rgba(16,185,129,0.06)",
            borderColor: "rgba(16,185,129,0.30)",
          }}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={label}
              className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-emerald-300" />
              ) : (
                <ImageIcon className="w-5 h-5 text-emerald-300" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-white font-medium truncate">
              {fileName || "Fichier envoyé"}
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-300 mt-0.5">
              <Check className="w-3 h-3" strokeWidth={3} />
              <span>Reçu · chiffré · Paris</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                onChange("");
                // Petit délai puis on relance la prise de photo si c'était par caméra
                setTimeout(() => cameraInputRef.current?.click(), 50);
              }}
              className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white flex items-center justify-center transition border border-white/[0.08]"
              aria-label="Reprendre"
              title="Reprendre"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-red-500/20 hover:text-red-300 text-white/60 flex items-center justify-center transition border border-white/[0.08]"
              aria-label="Supprimer"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {hint && !error && (
        <p className="text-[11px] text-white/40 leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-[11.5px] text-pink-300">{error}</p>
      )}
    </div>
  );
}
