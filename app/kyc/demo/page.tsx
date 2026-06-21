// app/kyc/demo/page.tsx — Aperçu du parcours client (mode démonstration)
//
// Rend le VRAI formulaire KYC (KycPublicForm) en mode démo : pré-rempli, aucun
// appel réseau, aucune sauvegarde. Conçu pour être affiché dans un iframe par le
// tutoriel cinématique du dashboard. L'étape visible est pilotée par le parent
// via postMessage { type: "klaris-demo-step", step }.
//
// Route publique (cf. proxy.ts → /kyc/(.*)). Aucune donnée réelle.

"use client";

import { useEffect, useState } from "react";
import KycPublicForm from "@/app/kyc/[token]/Kycpublicform";

export default function DemoKycPage() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "klaris-demo-step" && typeof e.data.step === "number") {
        setStep(e.data.step);
      }
    };
    window.addEventListener("message", onMsg);
    // Signale au parent (le film) qu'on est prêt à recevoir l'étape.
    try { window.parent?.postMessage({ type: "klaris-demo-ready" }, "*"); } catch { /* noop */ }
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <KycPublicForm
      token="demo"
      dossierId="demo"
      partie="acquereur"
      demo
      controlledStep={step}
    />
  );
}
