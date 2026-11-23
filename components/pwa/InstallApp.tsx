// components/pwa/InstallApp.tsx — Bouton « Installer l'app » et ses consignes
//
// Un clic lance l'invite du navigateur quand elle existe (Android, Chrome, Edge).
// Sinon, une feuille explique les gestes : sur iPhone, Partager puis « Sur l'écran
// d'accueil » ; ailleurs, le menu du navigateur. Sur ordinateur, la feuille propose
// aussi de scanner un QR code pour installer sur le téléphone.
// Déjà installée (ouverte depuis l'écran d'accueil) : rien n'est affiché.

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share, SquarePlus, Smartphone, X, MoreVertical, Check } from "lucide-react";
import { useInstall } from "./install";

interface Props {
  className?: string;
  label?: string;
  /** Contenu du bouton : par défaut une icône de téléphone et le libellé. */
  children?: React.ReactNode;
  onOpen?: () => void;
}

export default function InstallApp({ className = "kl-btn kl-btn--ghost", label = "Installer l'app", children, onOpen }: Props) {
  const { mode, prompt } = useInstall();
  const [sheet, setSheet] = useState(false);

  if (mode === "installed" || mode === "pending") return null;

  const onClick = async () => {
    onOpen?.();
    // Sur ordinateur, on vise le téléphone : QR code plutôt que l'installation sur le PC.
    if (mode === "native" && isPhone() && (await prompt())) return;
    setSheet(true);
  };

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        {children ?? (<><Smartphone width={17} height={17} /> {label}</>)}
      </button>
      {sheet && <InstallSheet ios={mode === "ios"} onClose={() => setSheet(false)} />}
    </>
  );
}

function isPhone() {
  return window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
}

export function InstallSheet({ ios, onClose }: { ios: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState(true);

  useEffect(() => {
    setMounted(true);
    setPhone(isPhone());
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="kl-inst" role="dialog" aria-modal="true" aria-labelledby="kl-inst-t">
      <button type="button" className="kl-inst__veil" aria-label="Fermer" onClick={onClose} />
      <div className="kl-inst__box">
        <button type="button" className="kl-inst__x" onClick={onClose} aria-label="Fermer">
          <X width={18} height={18} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="kl-inst__icon" src="/pwa/icon-192.png" alt="" width={64} height={64} />
        <h2 id="kl-inst-t" className="kl-inst__t">Klaris sur votre écran d&apos;accueil</h2>
        <p className="kl-inst__p">
          Une icône comme une application : Klaris s&apos;ouvre en plein écran, directement sur vos dossiers.
        </p>

        {phone ? (
          ios ? (
            <ol className="kl-inst__steps">
              <li><span className="kl-inst__n">1</span><span>Touchez <b>Partager</b> <i className="kl-inst__ico"><Share width={15} height={15} /></i> dans la barre de Safari.</span></li>
              <li><span className="kl-inst__n">2</span><span>Choisissez <b>Sur l&apos;écran d&apos;accueil</b> <i className="kl-inst__ico"><SquarePlus width={15} height={15} /></i>.</span></li>
              <li><span className="kl-inst__n">3</span><span>Touchez <b>Ajouter</b>. L&apos;icône Klaris apparaît avec vos applications.</span></li>
            </ol>
          ) : (
            <ol className="kl-inst__steps">
              <li><span className="kl-inst__n">1</span><span>Ouvrez le menu du navigateur <i className="kl-inst__ico"><MoreVertical width={15} height={15} /></i>.</span></li>
              <li><span className="kl-inst__n">2</span><span>Choisissez <b>Installer l&apos;application</b> ou <b>Ajouter à l&apos;écran d&apos;accueil</b>.</span></li>
              <li><span className="kl-inst__n">3</span><span>Confirmez. L&apos;icône Klaris apparaît avec vos applications.</span></li>
            </ol>
          )
        ) : (
          <div className="kl-inst__qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pwa/qr-app.svg" alt="QR code vers klaris-app.fr/app" width={148} height={148} />
            <div>
              <b>Scannez avec votre téléphone</b>
              <p>L&apos;appareil photo ouvre Klaris. Suivez ensuite les consignes affichées pour l&apos;ajouter à l&apos;écran d&apos;accueil.</p>
              <span className="kl-inst__url">klaris-app.fr/app</span>
            </div>
          </div>
        )}

        <ul className="kl-inst__perks">
          <li><Check width={14} height={14} strokeWidth={3} /> Rien à télécharger dans un store</li>
          <li><Check width={14} height={14} strokeWidth={3} /> Toujours à jour</li>
          <li><Check width={14} height={14} strokeWidth={3} /> Vos dossiers restent hébergés en UE</li>
        </ul>
      </div>
    </div>,
    document.body
  );
}
