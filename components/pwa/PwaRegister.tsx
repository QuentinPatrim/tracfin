// components/pwa/PwaRegister.tsx — Enregistre le service worker et capte l'invite
// d'installation. Rien n'est affiché. En développement, on n'enregistre rien (le
// service worker gênerait le rechargement à chaud).

"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "./install";

captureInstallPrompt();

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
