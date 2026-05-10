// components/kyc/FileUpload.tsx — Upload via /api/upload (Scaleway Object Storage Paris)

"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, X, Check, Loader2 } from "lucide-react";

interface Props {
  label: string;
  required?: boolean;
  value: string; // storage_key Scaleway, OU ancienne URL https:// (rétro-compat)
  onChange: (value: string) => void;
  dossierId: string;
  kycToken?: string; // si présent → mode public (KYC client), sinon Clerk
  accept?: string;
}

const ACCEPT_DEFAULT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

export default function FileUpload({
  label,
  required = false,
  value,
  onChange,
  dossierId,
  kycToken,
  accept = ACCEPT_DEFAULT,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop lourd (max 10 Mo)");
      return;
    }
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dossierId", dossierId);
    if (kycToken) formData.append("kycToken", kycToken);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      onChange(data.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File | null) => {
    if (file) upload(file);
  };

  // ─── Aperçu : URL legacy (https://...) OU /api/files/<key> ────────────────
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
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {!value ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all px-6 py-8 flex flex-col items-center gap-3 backdrop-blur-md ${
            dragOver
              ? "border-indigo-400/60 bg-indigo-500/10"
              : "border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.20]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <div className="text-sm text-white/60">Envoi sécurisé en cours...</div>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-white/40" />
              <div className="text-sm text-white/60 text-center">
                <span className="text-indigo-400 font-medium">Cliquez pour choisir</span> ou glissez-déposez
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-widest">PDF, JPG, PNG — max 10 Mo</div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-md flex items-center gap-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className="w-14 h-14 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
              {isPdf ? <FileText className="w-6 h-6 text-emerald-400" /> : <ImageIcon className="w-6 h-6 text-emerald-400" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{fileName || "Fichier envoyé"}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5">
              <Check className="w-3 h-3" />
              <span>Reçu (chiffré, hébergement Paris)</span>
              <span className="text-white/30 mx-1">•</span>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="hover:underline">Voir</a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-red-500/20 hover:text-red-400 text-white/40 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
