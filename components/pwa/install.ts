// components/pwa/install.ts — Installer Klaris sur l'écran d'accueil
//
// Android et ordinateur (Chrome, Edge) : le navigateur fournit une invite native
// (événement « beforeinstallprompt ») qu'on garde de côté et qu'on déclenche au clic.
// iPhone et iPad : Apple ne permet pas d'invite ; on montre les deux gestes à faire
// (Partager, puis « Sur l'écran d'accueil »).

"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const CHANGED = "klaris:install-changed";

/** Appelé une seule fois (PwaRegister) : capte l'invite native dès qu'elle arrive. */
export function captureInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(CHANGED));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    window.dispatchEvent(new Event(CHANGED));
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** « installed » : déjà ouverte comme app. « native » : invite du navigateur prête.
 *  « ios » : gestes Safari à montrer. « manual » : autre navigateur, consignes génériques. */
export type InstallMode = "pending" | "installed" | "native" | "ios" | "manual";

export function useInstall() {
  const [mode, setMode] = useState<InstallMode>("pending");

  useEffect(() => {
    const read = () =>
      setMode(isStandalone() ? "installed" : deferred ? "native" : isIOS() ? "ios" : "manual");
    read();
    window.addEventListener(CHANGED, read);
    return () => window.removeEventListener(CHANGED, read);
  }, []);

  /** Lance l'invite native si elle existe. Renvoie false s'il faut montrer les consignes. */
  const prompt = useCallback(async () => {
    if (!deferred) return false;
    const e = deferred;
    deferred = null;
    await e.prompt();
    await e.userChoice.catch(() => null);
    window.dispatchEvent(new Event(CHANGED));
    return true;
  }, []);

  return { mode, prompt };
}
