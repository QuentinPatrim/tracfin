// components/dashboard/dossier/DossierProgress.tsx — « Où en est ce dossier »
//
// Le fil en quatre étapes (voir dossierStage.ts) et, dessous, la seule chose à
// faire maintenant, avec un bouton qui y mène. Se met à jour quand l'agent coche
// une étape de la marche à suivre (événement klaris:marche-updated).

"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Check, FileDown } from "lucide-react";
import type { Niveau } from "@/lib/tracfin";
import { nextAction, STAGE_STEPS, type NextAction } from "../dossierStage";

interface Props {
  id: string;
  name: string;
  partie: "vendeur" | "acquereur";
  niveau: Niveau | null;
  receivedLabel: string | null;
}

export default function DossierProgress({ id, name, partie, niveau, receivedLabel }: Props) {
  const compute = () => nextAction({ id, name, partie, kycReceived: true, niveau });
  // 1er rendu sans localStorage (serveur) : on part de l'étape sans la marche.
  const [a, setA] = useState<NextAction>(() =>
    niveau && niveau !== "vigilance_standard" ? { stage: "suite", step: 3, label: "Suite à donner", hint: "" } : compute(),
  );
  useEffect(() => {
    setA(compute());
    const on = () => setA(compute());
    window.addEventListener("klaris:marche-updated", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("klaris:marche-updated", on);
      window.removeEventListener("storage", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, niveau]);

  const notes = ["", receivedLabel ?? "", niveau ? "Niveau calculé" : "", a.stage === "fait" ? "Terminé" : ""];

  return (
    <section className="kd-prog" data-stage={a.stage} aria-label="Où en est ce dossier">
      <ol className="kd-fil">
        {STAGE_STEPS.map((s, i) => {
          const state = i < a.step ? "done" : i === a.step ? "now" : "todo";
          return (
            <li key={s} data-state={state}>
              <span>{state === "done" ? <Check width={13} height={13} strokeWidth={3} /> : i + 1}</span>
              <b>{s}</b>
              {state === "done" && notes[i] && <small>{notes[i]}</small>}
            </li>
          );
        })}
      </ol>

      <div className="kd-next">
        <div>
          <small>{a.stage === "fait" ? "Dossier à jour" : "Prochaine étape"}</small>
          <b>{a.label}</b>
          {a.hint && <p>{a.hint}</p>}
        </div>
        {a.stage === "verifier" && <a href="#analyse" className="kd-btn kd-btn--pri">Aller à l&apos;analyse<ArrowDown width={16} height={16} /></a>}
        {a.stage === "suite" && <a href="#suite" className="kd-btn kd-btn--pri">Voir la suite à donner<ArrowDown width={16} height={16} /></a>}
        {a.stage === "fait" && <a href={`/api/dossiers/${id}/pdf`} download className="kd-btn kd-btn--pri"><FileDown width={16} height={16} />Attestation PDF</a>}
      </div>
    </section>
  );
}
