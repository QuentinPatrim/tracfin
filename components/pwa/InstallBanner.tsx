// components/pwa/InstallBanner.tsx — Rappel discret, sur téléphone, dans l'application :
// « Installez Klaris ». Masqué une fois installé ou fermé (mémorisé sur l'appareil).

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import InstallApp from "./InstallApp";
import { useInstall } from "./install";

const KEY = "klaris-install-banner";

export default function InstallBanner() {
  const { mode } = useInstall();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try { setHidden(localStorage.getItem(KEY) === "off"); } catch { setHidden(false); }
  }, []);

  if (hidden || mode === "installed" || mode === "pending") return null;

  const close = () => {
    setHidden(true);
    try { localStorage.setItem(KEY, "off"); } catch {}
  };

  return (
    <div className="k-inst-banner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pwa/icon-192.png" alt="" width={40} height={40} />
      <div className="k-inst-banner__t">
        <b>Installer l&apos;app Klaris</b>
        <span>Sur l&apos;écran d&apos;accueil, en deux gestes</span>
      </div>
      <InstallApp className="k-inst-banner__go">Installer</InstallApp>
      <button type="button" className="k-inst-banner__x" onClick={close} aria-label="Ne plus afficher">
        <X width={15} height={15} />
      </button>
    </div>
  );
}
