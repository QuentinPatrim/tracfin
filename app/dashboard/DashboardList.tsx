// app/dashboard/DashboardList.tsx — Liste avec routage conditionnel selon kyc_status

"use client";

import Link from "next/link";
import { ChevronRight, Mail, Send, Clock, FileCheck, FileDown, User } from "lucide-react";
import { STATUS_CFG, NIVEAU_CFG, type StatutKey, type Niveau } from "@/lib/tracfin";

interface DossierListItem {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  algo_version: "v1" | "v2";
  niveau: Niveau | null;
  statut: StatutKey | null;
  score_pct: number;
  date_detection: string;
  created_at: string;
  updated_at: string;
  kyc_status: string;
}

// Affichage : préfère niveau v2 quand dispo, fallback statut v1
function badgeFromDossier(d: DossierListItem) {
  if (d.algo_version === "v2" && d.niveau) {
    const n = NIVEAU_CFG[d.niveau];
    return { color: n.color, bg: n.bg, border: n.border, label: n.label };
  }
  if (d.statut) {
    const s = STATUS_CFG[d.statut];
    return { color: s.color, bg: s.bg, border: s.border, label: s.title };
  }
  return null;
}

export default function DashboardList({ dossiers }: { dossiers: DossierListItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dossiers.map((d) => {
        // Détermine la route cible selon l'état
        const href =
          d.kyc_status === "received" ? `/dashboard/${d.id}` : `/dashboard/${d.id}/wait`;

        // Détermine la couleur d'accent (v2 niveau prioritaire, v1 statut en fallback)
        const cfg = badgeFromDossier(d);
        const accentColor =
          d.kyc_status === "received" && cfg
            ? cfg.color
            : d.kyc_status === "sent"
            ? "#A855F7"
            : "#6366F1";

        return (
          <Link
            key={d.id}
            href={href}
            className="group relative rounded-3xl p-5 overflow-hidden transition-all"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              boxShadow: [
                "0 0 0 1px rgba(255,255,255,0.06)",
                "0 1px 0 rgba(255,255,255,0.10) inset",
                "0 20px 40px -12px rgba(0,0,0,0.4)",
              ].join(", "),
            }}
            onMouseEnter={(e) => {
              const rgb = hexToRgb(accentColor);
              e.currentTarget.style.boxShadow = [
                `0 0 0 1px ${rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)` : "rgba(255,255,255,0.15)"}`,
                "0 1px 0 rgba(255,255,255,0.15) inset",
                "0 20px 40px -12px rgba(0,0,0,0.4)",
                rgb ? `0 0 40px -8px rgba(${rgb.r},${rgb.g},${rgb.b},0.35)` : "",
              ].join(", ");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = [
                "0 0 0 1px rgba(255,255,255,0.06)",
                "0 1px 0 rgba(255,255,255,0.10) inset",
                "0 20px 40px -12px rgba(0,0,0,0.4)",
              ].join(", ");
            }}
          >
            {/* Highlight courbe top */}
            <div
              className="absolute inset-x-6 top-0 h-px rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20) 50%, transparent)" }}
            />

            {/* Glow accent corner */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"
              style={{ background: accentColor }}
            />

            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  {d.type_client === "morale" ? "Personne morale" : "Personne physique"}
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  {d.kyc_status === "received" && (
                    <>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/api/dossiers/${d.id}/kyc-pdf`); }}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/50 hover:text-white"
                        title="Télécharger Fiche KYC"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/api/dossiers/${d.id}/pdf`); }}
                        className="w-7 h-7 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center justify-center transition-colors text-indigo-300 hover:text-indigo-200"
                        title="Télécharger Attestation LCB-FT"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all ml-1" />
                </div>
              </div>

              <div className="text-lg font-bold mb-3 truncate">{d.nom_prenom}</div>

              {/* Badge d'état */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Cas 1 : KYC reçu + score calculé */}
                {d.kyc_status === "received" && cfg && (
                  <Badge color={cfg.color} bg={cfg.bg} border={cfg.border}>
                    <FileCheck className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                )}

                {/* Cas 2 : KYC reçu mais score pas encore calculé */}
                {d.kyc_status === "received" && !cfg && (
                  <Badge color="#34D399" bg="rgba(52,211,153,0.10)" border="rgba(52,211,153,0.35)">
                    <Mail className="w-3 h-3" />
                    KYC reçu — à analyser
                  </Badge>
                )}

                {/* Cas 3 : En attente du KYC client */}
                {d.kyc_status !== "received" && (
                  <Badge color="#C4B5FD" bg="rgba(168,85,247,0.12)" border="rgba(168,85,247,0.40)">
                    <Clock className="w-3 h-3" />
                    En attente du KYC
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>
                  {new Date(d.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
                {d.kyc_status === "received" && cfg && (
                  <span className="font-bold" style={{ color: cfg.color }}>
                    {d.score_pct}% conforme
                  </span>
                )}
                {d.kyc_status !== "received" && (
                  <span className="text-violet-300 font-bold inline-flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    Lien actif
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Badge({
  children, color, bg, border,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}) {
  const rgb = hexToRgb(color);
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
      style={{
        background: bg,
        color,
        boxShadow: `0 0 0 1px ${border}, 0 0 12px -2px ${rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.30)` : "transparent"}`,
      }}
    >
      {children}
    </span>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}