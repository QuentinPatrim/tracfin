// components/landing/DemoScreens.tsx — Écrans légers du produit, pour le site
//
// Reproductions fidèles mais légères (pas d'iframe, pas de page chargée en plus) :
//  - PhoneForm : le formulaire client dans un téléphone, ses étapes défilent seules.
//    Libellés repris de app/kyc/[token]/Kycpublicform.tsx (STEPS) ;
//  - AttestationMock : l'attestation PDF, en miniature.
// Données fictives (Camille Rousseau), comme components/dashboard/demoData.ts.

"use client";

import { useEffect, useState } from "react";
import { Check, Upload, ShieldCheck, FileText, Camera } from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";
import "./demo.css";

const STEPS = ["Vous", "Identité", "Pièce d'identité", "Situation", "Opération immobilière", "Pièces justificatives", "Récapitulatif & envoi"];

/* Écrans montrés (index dans STEPS) : un par étape-clé du parcours. */
const SCREENS = [0, 1, 2, 3, 5, 6];

export function PhoneForm({ playing = true, interval = 2200 }: { playing?: boolean; interval?: number }) {
  const [k, setK] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setK((v) => (v + 1) % SCREENS.length), interval);
    return () => window.clearInterval(t);
  }, [playing, interval]);

  const step = SCREENS[k];

  return (
    <div className="kl-phone" aria-hidden="true">
      <div className="kl-phone__screen pf">
        <span className="kl-phone__island" />
        <div className="pf-top">
          <div className="pf-brand"><KlarisLogo size={22} /><b>Klaris</b><span>Étape {step + 1} / {STEPS.length}</span></div>
          <div className="pf-prog">{STEPS.map((s, i) => <i key={s} data-on={i <= step ? "" : undefined} />)}</div>
          <div className="pf-step">{STEPS[step]}</div>
        </div>
        <div className="pf-body">
          {SCREENS.map((s, i) => (
            <div key={s} className="pf-scr" data-on={i === k ? "" : undefined}>
              <Screen step={s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, select }: { label: string; value: string; select?: boolean }) {
  return (
    <div className="pf-f">
      <label>{label} <em>*</em></label>
      <div className="pf-in">{value}{select && <span className="pf-chev" />}</div>
    </div>
  );
}

function Screen({ step }: { step: number }) {
  switch (step) {
    case 0:
      return (
        <>
          <span className="pf-chip">Vous êtes l&apos;acquéreur du bien</span>
          <h4>Commençons par vous</h4>
          <p className="pf-sub">Votre conseiller doit identifier formellement le client de la transaction. Cela prend environ 5 minutes.</p>
          <div className="pf-f"><label>Vous êtes <em>*</em></label>
            <div className="pf-two"><span data-on="">Particulier</span><span>Société</span></div></div>
          <Field label="Email" value="camille.rousseau@example.com" />
          <Field label="Téléphone" value="+33 6 12 34 56 78" />
        </>
      );
    case 1:
      return (
        <>
          <h4>Votre identité</h4>
          <p className="pf-sub">Identification réglementaire.</p>
          <Field label="Nom et prénom" value="Rousseau Camille" />
          <Field label="Date de naissance" value="12/04/1985" />
          <Field label="Lieu de naissance" value="Lyon" />
          <Field label="Nationalité" value="Française" />
        </>
      );
    case 2:
      return (
        <>
          <h4>Pièce d&apos;identité</h4>
          <p className="pf-sub">Informations de votre pièce officielle.</p>
          <Field label="Type de pièce" value="Carte nationale d'identité" select />
          <Field label="Numéro" value="123456789012" />
          <Field label="Date d'expiration" value="15/06/2031" />
          <div className="pf-note"><Camera size={13} /> La photo de la pièce est demandée à l&apos;étape suivante.</div>
        </>
      );
    case 3:
      return (
        <>
          <h4>Personne politiquement exposée</h4>
          <p className="pf-sub">Toutes les réponses restent confidentielles.</p>
          <div className="pf-f"><label>Exercez-vous une fonction politique importante&nbsp;? <em>*</em></label>
            <div className="pf-two"><span data-ok="">Non</span><span>Oui</span></div></div>
          <div className="pf-f"><label>Un proche exerce-t-il une telle fonction&nbsp;? <em>*</em></label>
            <div className="pf-two"><span data-ok="">Non</span><span>Oui</span></div></div>
          <Field label="Pays de résidence fiscale" value="France / Union Européenne" select />
        </>
      );
    case 5:
      return (
        <>
          <h4>Pièces justificatives</h4>
          <p className="pf-sub">En photo depuis votre téléphone, chiffrées à l&apos;arrivée.</p>
          {["Pièce d'identité", "Justificatif de domicile", "Origine des fonds"].map((d, i) => (
            <div key={d} className="pf-doc" style={{ "--i": i } as React.CSSProperties}>
              <span className="pf-doc__ico"><FileText size={15} /></span>
              <span>{d}</span>
              <span className="pf-doc__ok"><Check size={12} strokeWidth={3} /></span>
            </div>
          ))}
          <div className="pf-drop"><Upload size={15} /> Ajouter une pièce</div>
        </>
      );
    default:
      return (
        <>
          <h4>Récapitulatif</h4>
          <p className="pf-sub">Vérifiez que tout est correct avant l&apos;envoi.</p>
          <div className="pf-recap">
            <div><span>Identité</span><b>Rousseau Camille</b></div>
            <div><span>Pièce</span><b>CNI · 2031</b></div>
            <div><span>Situation</span><b>PPE : non</b></div>
            <div><span>Pièces</span><b>3 fichiers</b></div>
          </div>
          <div className="pf-consent"><span><Check size={11} strokeWidth={3} /></span>J&apos;accepte le traitement de mes données (RGPD)</div>
          <div className="pf-send"><ShieldCheck size={15} /> Envoyer ma fiche</div>
        </>
      );
  }
}

/* L'attestation, en miniature : en-tête, niveau, identification, empreinte. */
export function AttestationMock() {
  return (
    <div className="am" aria-hidden="true">
      <div className="am-band" />
      <div className="am-head">
        <div className="am-brand"><KlarisLogo size={26} /><b>klaris</b><span>Attestation</span></div>
        <div className="am-meta"><small>Dossier</small><b>#0A1F7B2C</b></div>
      </div>
      <h5>Attestation de diligences LCB-FT</h5>
      <p className="am-sub">Analyse documentée sur 12 critères (CMF L.561-1 et suivants). Client analysé en qualité d&apos;acquéreur.</p>
      <div className="am-lvl">
        <span className="am-lvl__n">1</span>
        <div><small>Niveau de vigilance · 1 / 4</small><b>Vigilance standard</b><p>Traiter normalement. Archivage cinq ans (L.561-12).</p></div>
      </div>
      <div className="am-sec">Identification du client</div>
      <div className="am-grid">
        {[["Nom et prénom", "Rousseau Camille"], ["Rôle", "Acquéreur"], ["Date de naissance", "12/04/1985"], ["Nationalité", "Française"], ["Profession", "Cadre administratif"], ["Résidence fiscale", "France / UE"]].map(([k, v]) => (
          <div key={k}><small>{k}</small><b>{v}</b></div>
        ))}
      </div>
      <div className="am-lines"><i /><i /><i style={{ width: "62%" }} /></div>
      <div className="am-foot"><span>Émis le 20 nov. 2026</span><code>SHA-256 · 9f2c…e41b</code></div>
    </div>
  );
}
