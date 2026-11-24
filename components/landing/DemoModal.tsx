// components/landing/DemoModal.tsx — Démo guidée : les cinq barres du K
//
// Cinq chapitres, un par obligation LCB-FT et par barre du logo (identifier, évaluer,
// conserver, déclarer, justifier). Chaque chapitre est un plein cadre dans la couleur
// de sa barre : le texte en blanc à gauche, une seule grande carte du produit à
// droite (au-dessus sur téléphone), qui s'anime. Entre deux chapitres, le volet aux
// couleurs du K. Fin : le panneau cobalt d'appel à l'essai.
//  - Tout est en HTML/CSS (pas d'iframe, pas de 3D) : fluide sur un téléphone modeste.
//  - Le temps est porté par l'animation CSS de la barre de progression : la pause la
//    fige (et fige les animations de la carte), sa fin passe au chapitre suivant.
//  - Commandes : boutons, toucher à gauche / à droite, flèches, espace, Échap.

"use client";

import "./demo.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ArrowRight, Check, Mail, MessageCircle,
  MessageSquare, FileArchive, Lock, ShieldCheck, MapPin, FileWarning, FileDown, Send, Clock, Fingerprint,
} from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";
import { AttestationMock } from "./DemoScreens";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;
}

/* bg : la couleur de la barre, assombrie pour que le texte blanc reste lisible. */
const CHAPTERS = [
  { k: "Identifier le client", c: "#2F5BFF", bg: "#2F5BFF", t: "Vous créez le dossier, votre client remplit sa fiche.", p: "Rôle, type de client, nom, e-mail : le lien part par e-mail, WhatsApp ou message. Votre client remplit sa fiche sur son téléphone, sans compte ni application.", dur: 10000 },
  { k: "Évaluer le risque", c: "#5468FF", bg: "#4350E0", t: "Klaris en déduit le niveau de vigilance.", p: "Vous complétez l'analyse de risque. Klaris applique les mêmes critères à chaque dossier et donne un niveau sur quatre, avec la conduite à tenir.", dur: 7500 },
  { k: "Conserver cinq ans", c: "#9A6BEB", bg: "#7A4CD9", t: "Tout est rangé, chiffré, gardé cinq ans.", p: "Fiche, pièces et attestation dans une seule archive, hébergée dans l'UE. La suppression est bloquée jusqu'au terme légal.", dur: 7000 },
  { k: "Déclarer un soupçon", c: "#EC6A93", bg: "#C53B72", t: "Si un dossier pose problème, le brouillon est prêt.", p: "Pour un dossier en examen renforcé ou en interdiction, Klaris prépare le brouillon de déclaration avec les faits du dossier, à déposer sur ERMES.", dur: 7500 },
  { k: "Justifier au contrôle", c: "#FF6A4D", bg: "#CC4024", t: "Le jour d'un contrôle, vous montrez tout.", p: "L'attestation horodatée avec son empreinte, et l'archive complète du dossier, prêtes à présenter.", dur: 7000 },
] as const;
const K_COLORS = ["#2F5BFF", "#5468FF", "#9A6BEB", "#EC6A93", "#FF6A4D"];
const K_OFF = [30, 18, 5, 18, 30];

const DESIGN_W = 560;
const DESIGN_H = 640;
const WIPE_MS = 760;

export default function DemoModal({ open, onClose, onCta }: Props) {
  const [idx, setIdx] = useState(0);        // chapitre visé (barres de progression)
  const [shown, setShown] = useState(0);    // chapitre affiché (change au milieu du volet)
  const [wipe, setWipe] = useState(0);      // relance le volet
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const N = CHAPTERS.length;
  const end = shown >= N;

  const idxRef = useRef(0);
  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(N, i));
    const cur = idxRef.current;
    setPaused(false);
    if (next === cur) return;
    idxRef.current = next;
    setIdx(next);
    setDir(next > cur ? 1 : -1);
    setWipe((w) => w + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(next), WIPE_MS / 2);
  }, [N]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* Clavier et défilement de la page bloqué pendant la démo. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go, idx]);

  /* La carte est dessinée à 560 × 640 et mise à l'échelle de son cadre. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(1.12, (width - 32) / DESIGN_W, (height - 32) / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  if (!open) return null;

  const ch = CHAPTERS[Math.min(shown, N - 1)];

  return (
    <div className="dg" role="dialog" aria-modal="true" aria-label="Démo guidée de Klaris" data-paused={paused ? "" : undefined}>
      <button type="button" className="dg-veil" aria-label="Fermer la démo" onClick={onClose} />

      <div className="dg-box" style={{ "--bg": end ? "#2F5BFF" : ch.bg, "--c": end ? "#2F5BFF" : ch.c } as React.CSSProperties}>
        <div className="dg-glow" aria-hidden="true" />

        <div className="dg-side">
          <div className="dg-head">
            <span className="dg-logo"><KlarisLogo size={26} /></span>
            <b>Démo guidée</b>
            <button type="button" className="dg-x" onClick={onClose} aria-label="Fermer la démo">
              <X width={18} height={18} />
            </button>
          </div>

          <div className="dg-segs">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.k}
                type="button"
                className="dg-seg"
                aria-label={`Chapitre ${i + 1} : ${c.k}`}
                data-state={i < idx ? "done" : i === idx ? "run" : "todo"}
                style={{ "--dur": `${c.dur}ms`, "--c": K_COLORS[i] } as React.CSSProperties}
                onClick={() => go(i)}
              >
                <span key={i === idx ? `run-${idx}-${wipe}` : `s-${i}`} onAnimationEnd={i === idx ? () => go(idx + 1) : undefined} />
              </button>
            ))}
          </div>

          <div className="dg-bottom">
            <div className="dg-txt" aria-live="polite">
              {!end ? (
                <div key={shown} className="dg-swap">
                  <span className="dg-k"><i style={{ background: CHAPTERS[shown].c }} /><b>{String(shown + 1).padStart(2, "0")}</b>{ch.k}</span>
                  <h2 className="dg-t">{ch.t}</h2>
                  <p className="dg-p">{ch.p}</p>
                </div>
              ) : (
                <div key="end" className="dg-swap">
                  <span className="dg-k"><i style={{ background: "#fff" }} /><b>5/5</b>Obligations couvertes</span>
                  <h2 className="dg-t">Prêt à essayer sur un vrai dossier&nbsp;?</h2>
                  <p className="dg-p">14 jours gratuits, aucun prélèvement avant le 14ᵉ jour, sans engagement.</p>
                </div>
              )}
            </div>

            <div className="dg-ctl">
              <button type="button" className="dg-btn" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Chapitre précédent">
                <ChevronLeft width={20} height={20} />
              </button>
              {!end ? (
                <button type="button" className="dg-btn dg-btn--play" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Reprendre" : "Mettre en pause"}>
                  {paused ? <Play width={17} height={17} fill="currentColor" /> : <Pause width={17} height={17} fill="currentColor" />}
                </button>
              ) : (
                <button type="button" className="dg-btn dg-btn--play" onClick={() => go(0)} aria-label="Revoir la démo">
                  <RotateCcw width={17} height={17} />
                </button>
              )}
              <button type="button" className="dg-btn" onClick={() => go(idx + 1)} disabled={idx >= N} aria-label="Chapitre suivant">
                <ChevronRight width={20} height={20} />
              </button>
              <span className="dg-hint">Espace : pause · ← → : naviguer</span>
            </div>
          </div>
        </div>

        <div ref={stageRef} className="dg-stage">
          {!end && (
            <>
              <button type="button" className="dg-tap dg-tap--prev" aria-label="Chapitre précédent" onClick={() => go(idx - 1)} />
              <button type="button" className="dg-tap dg-tap--next" aria-label="Chapitre suivant" onClick={() => go(idx + 1)} />
              <div className="dg-design" style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})` }} aria-hidden="true">
                <div key={shown} className="dq" style={{ "--d": `${ch.dur}ms` } as React.CSSProperties}>
                  {shown === 0 && <Identify />}
                  {shown === 1 && <Evaluate />}
                  {shown === 2 && <Keep />}
                  {shown === 3 && <Declare />}
                  {shown === 4 && <Prove />}
                </div>
              </div>
            </>
          )}
          {end && (
            <div className="dg-end">
              <div>
                <span className="dg-end__icon"><KlarisLogo size={64} animated /></span>
                <h3>Vos dossiers LCB&#8209;FT, en ordre.</h3>
                <p>Créez votre compte et envoyez votre premier lien en quelques minutes.</p>
                <div className="dg-end__btns">
                  <button type="button" onClick={() => { onClose(); onCta?.(); }}>
                    Essayer 14 jours gratuits <ArrowRight width={16} height={16} />
                  </button>
                  <button type="button" onClick={() => go(0)}>
                    <RotateCcw width={15} height={15} /> Revoir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Le volet aux couleurs du K, entre deux chapitres */}
        {wipe > 0 && (
          <div key={wipe} className="dg-wipe" data-dir={dir < 0 ? "back" : undefined} aria-hidden="true">
            {K_COLORS.map((c, i) => <i key={c} style={{ background: c, animationDelay: `${(K_OFF[i] / 30) * 70}ms` }} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Cartes animées (une par chapitre). Délais en secondes via --t. ─────────── */
const at = (t: number) => ({ "--t": `${t}s` }) as React.CSSProperties;

function Identify() {
  return (
    <div className="dq-card">
      {/* 1. l'agent crée le dossier */}
      <div className="dq-layer dq-l1">
        <div className="dq-top"><span>← Dossiers</span><span>Nouveau dossier</span></div>
        <div className="dq-title">Créer un dossier</div>
        <div className="dq-lab dq-lab--c">Rôle dans la transaction</div>
        <div className="dq-two">
          <div className="dq-tile"><b>Vendeur</b><small>Cède le bien</small></div>
          <div className="dq-tile dq-sel" style={at(0.7)}><b>Acquéreur</b><small>Achète le bien</small></div>
        </div>
        <div className="dq-lab">Nom et prénom du client</div>
        <div className="dq-in dq-focus" style={at(1.1)}><span className="dq-type" style={{ ...at(1.2), "--n": 16 } as React.CSSProperties}>Camille Rousseau</span></div>
        <div className="dq-lab">E-mail du client</div>
        <div className="dq-in dq-focus" style={at(2.1)}><span className="dq-type" style={{ ...at(2.2), "--n": 27 } as React.CSSProperties}>camille.rousseau@exemple.fr</span></div>
        <div className="dq-btn dq-press" style={at(3.2)}>Créer le dossier et générer le lien</div>
        <span className="dq-tapfx" style={{ ...at(0.7), left: 392, top: 196 }} />
        <span className="dq-tapfx" style={{ ...at(3.2), left: 280, top: 548 }} />
      </div>
      {/* 2. le lien part */}
      <div className="dq-layer dq-l2">
        <span className="dq-ok"><i><Check width={15} height={15} strokeWidth={3} /></i>Dossier créé</span>
        <div className="dq-title" style={{ marginTop: 18 }}>Le lien pour Camille Rousseau est prêt.</div>
        <div className="dq-link"><span>klaris-app.fr/kyc/7f3a…</span><b>Copier</b></div>
        <div className="dq-lab">Envoyer le lien par</div>
        <div className="dq-share">
          <span><i><Mail width={18} height={18} /></i>E-mail</span>
          <span className="dq-on" style={at(4.6)}><i><MessageCircle width={18} height={18} /></i>WhatsApp</span>
          <span><i><MessageSquare width={18} height={18} /></i>Message</span>
        </div>
        <span className="dq-tapfx" style={{ ...at(4.6), left: 280, top: 403 }} />
      </div>
      {/* 3. le client remplit sa fiche */}
      <div className="dq-layer dq-l3">
        <div className="dq-top"><span>Fiche client · Camille Rousseau</span><span>sans compte</span></div>
        <div className="dq-title">Votre fiche client</div>
        <div className="dq-steps">
          {["Identité", "Pièce d'identité", "Situation", "Opération immobilière", "Pièces justificatives", "Récapitulatif & envoi"].map((s, i) => (
            <div key={s} className="dq-step" style={at(6.3 + i * 0.36)}><i><Check width={14} height={14} strokeWidth={3} /></i>{s}</div>
          ))}
        </div>
        <span className="dq-done" style={at(8.6)}><Check width={16} height={16} strokeWidth={3} />Fiche envoyée, pièces chiffrées</span>
      </div>
    </div>
  );
}

function Evaluate() {
  const rows: Array<[string, string]> = [["Risque géographique", "France"], ["Origine des fonds", "Prêt bancaire et apport"], ["Transaction", "Prix cohérent avec le marché"], ["Sanctions et PPE", "Aucune correspondance"]];
  const lv: Array<[string, string, number]> = [["Vigilance standard", "#138A5B", 54], ["Vigilance renforcée", "#E3A008", 66], ["Examen renforcé", "#E8692A", 78], ["Interdiction", "#D93A2F", 90]];
  return (
    <div className="dq-card">
      <div className="dq-top"><span>Analyse de risque</span><span>Acquéreur</span></div>
      <div className="dq-title">Camille Rousseau</div>
      <div className="dq-rows">
        {rows.map(([a, b], i) => (
          <div key={a} className="dq-row dq-pop" style={at(0.3 + i * 0.3)}><i><Check width={14} height={14} strokeWidth={3} /></i><div><b>{a}</b><small>{b}</small></div></div>
        ))}
      </div>
      <div className="dq-lab">Niveau de vigilance</div>
      <div className="dq-scale">
        {lv.map(([l, c, w], i) => (
          <div key={l} className={`dq-lv ${i ? "dq-dim" : ""}`} style={at(3.3)}>
            <span className="dq-grow" style={{ ...at(1.7 + i * 0.12), width: `${w}%`, background: c }}>{l}</span>
            {i === 0 && <b className="dq-pin" style={at(2.9)}>1</b>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Keep() {
  return (
    <div className="dq-card">
      <div className="dq-zip">
        <span><FileArchive width={30} height={30} /></span>
        <div><b>Dossier-Rousseau-2026.zip</b><small>4 éléments · chiffrés</small></div>
      </div>
      <div className="dq-rows">
        {["Fiche client", "Pièces justificatives (3)", "Analyse de risque", "Attestation horodatée"].map((s, i) => (
          <div key={s} className="dq-row dq-row--s dq-pop" style={at(0.4 + i * 0.25)}><i style={{ background: "#9A6BEB" }}><Check width={14} height={14} strokeWidth={3} /></i><div><b>{s}</b></div></div>
        ))}
      </div>
      <div className="dq-years">
        <div><span>Aujourd&apos;hui</span><span>Conservation · 5 ans</span><span>+ 5 ans</span></div>
        <p><i className="dq-fill" style={at(1.6)} /></p>
        <span className="dq-lock dq-pop" style={at(2.8)}><i><Lock width={14} height={14} /></i>Suppression bloquée jusqu&apos;au terme légal</span>
      </div>
      <div className="dq-chips">
        <span className="dq-pop" style={at(3.4)}><ShieldCheck width={18} height={18} />Chiffré AES-256</span>
        <span className="dq-pop" style={at(3.6)}><MapPin width={18} height={18} />Hébergé dans l&apos;UE</span>
      </div>
    </div>
  );
}

function Declare() {
  return (
    <div className="dq-card">
      <div className="dq-who">
        <span>HV</span>
        <div><b>Holding Varteg Ltd</b><small>Personne morale · Acquéreur</small></div>
        <em>Interdiction</em>
      </div>
      <div className="dq-lab dq-lab--r">Déclaration de soupçon · Tracfin</div>
      <div className="dq-layer dq-d1">
        <div className="dq-outline dq-press" style={at(1.1)}><FileWarning width={20} height={20} />Préparer une déclaration de soupçon</div>
        <span className="dq-tapfx" style={{ ...at(1.1), left: 280, top: 211 }} />
      </div>
      <div className="dq-layer dq-d2">
        <span className="dq-status"><b>Brouillon</b><b className="dq-sub" style={at(3.9)}>Soumise à TRACFIN</b></span>
        <div className="dq-lab">Faits (pré-remplis depuis le dossier)</div>
        <div className="dq-facts">Bénéficiaire effectif non identifié.<br />Origine des fonds non justifiée.<i /><i style={{ width: "68%" }} /></div>
        <div className="dq-btn dq-btn--ink dq-press" style={at(3.6)}><FileDown width={18} height={18} />Télécharger le PDF et marquer soumise</div>
        <span className="dq-tapfx" style={{ ...at(3.6), left: 280, top: 437 }} />
        <span className="dq-ermes dq-pop" style={at(4.3)}><Send width={16} height={16} />À déposer sur ERMES, la plateforme de Tracfin</span>
      </div>
    </div>
  );
}

function Prove() {
  return (
    <div className="dq-prove">
      <div className="dq-sheet"><div><AttestationMock /></div></div>
      <span className="dq-chip dq-pop" style={{ ...at(1.0), left: -8, top: 462 }}><i><Clock width={16} height={16} /></i>Horodatée</span>
      <span className="dq-chip dq-pop" style={{ ...at(1.4), right: -10, top: 418 }}><i style={{ background: "#FFE6E0", color: "#D93A2F" }}><Fingerprint width={16} height={16} /></i><code>SHA-256 · 9f2c…e41b</code></span>
      <span className="dq-zipchip dq-pop" style={{ ...at(1.9), left: 40, bottom: 24 }}><i><FileArchive width={20} height={20} /></i><span><b>Dossier-Rousseau-2026.zip</b><small>Prêt à présenter en cas de contrôle</small></span></span>
    </div>
  );
}
