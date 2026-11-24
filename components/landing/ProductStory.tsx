// components/landing/ProductStory.tsx — « Comment ça marche », en quatre étapes
//
// Le texte défile normalement ; à côté (ou au-dessus, sur téléphone), une scène
// reste épinglée et change de plan quand une étape passe au milieu de l'écran.
// Le défilement n'est jamais capté : un geste fait défiler la page, rien d'autre.
// Les écrans montrés reprennent ceux du produit, en version légère (pas d'iframe) :
// components/landing/DemoScreens.tsx.

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Link2, MessageCircle, Mail, MessageSquare, FileArchive, AlertCircle } from "lucide-react";
import { PhoneForm, AttestationMock } from "./DemoScreens";
import { LEVELS } from "./VigilanceScale";

const STEPS = [
  {
    t: "Vous créez le dossier, Klaris prépare le lien.",
    p: "Nom du client, rôle dans la vente, et c'est tout. Vous envoyez le lien par e-mail, WhatsApp ou message, depuis votre téléphone. Votre client n'a rien à installer.",
  },
  {
    t: "Votre client remplit sa fiche.",
    p: "Identité, situation, opération, pièces justificatives : un formulaire guidé, en quelques minutes, depuis son téléphone. Les pièces sont chiffrées dès leur arrivée.",
  },
  {
    t: "Vous complétez l'analyse, Klaris en déduit la vigilance.",
    p: "Risque géographique, origine des fonds, transaction, bénéficiaires effectifs, sanctions : les mêmes critères pour tous vos dossiers, et un niveau sur quatre, avec la conduite à tenir.",
  },
  {
    t: "L'attestation est prête pour le contrôle.",
    p: "Un PDF horodaté, avec son empreinte, rangé avec la fiche et les pièces dans une seule archive, conservée cinq ans.",
  },
] as const;

const DESIGN_W = 560;
const DESIGN_H = 660;

const narrowQuery = "(max-width: 1023px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(narrowQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Les quatre plans, dans l'ordre des étapes. */
function scene(i: number, on: boolean) {
  if (i === 0) return <SharePlane />;
  if (i === 1) return <div className="ps-phone"><PhoneForm playing={on} interval={1700} /></div>;
  if (i === 2) return <AnalysisPlane />;
  return <AttestationPlane />;
}

/* Téléphone : chaque étape avec son propre visuel juste dessous, sans scène
   épinglée (la scène collée en haut prenait la moitié de l'écran et les textes
   passaient dessous). Le visuel s'anime quand il arrive à l'écran. */
function MobileStep({ i, s }: { i: number; s: (typeof STEPS)[number] }) {
  const ref = useRef<HTMLLIElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [k, setK] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "-25% 0px -25% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setK(Math.min(1, entry.contentRect.width / DESIGN_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <li ref={ref} className="ps-m" data-on={on ? "" : undefined}>
      <div className="ps-m__head">
        <span className="ps-step__n kl-display" aria-hidden="true">{i + 1}</span>
        <h3 className="kl-display ps-step__t">{s.t}</h3>
      </div>
      <p className="kl-body ps-step__p">{s.p}</p>
      <div ref={boxRef} className="ps-m__stage" style={{ height: DESIGN_H * k }} aria-hidden="true">
        <div style={{ position: "absolute", left: "50%", top: 0, width: DESIGN_W, height: DESIGN_H, transform: `translateX(-50%) scale(${k})`, transformOrigin: "50% 0" }}>
          <Plane on={on}>{scene(i, on)}</Plane>
        </div>
      </div>
    </li>
  );
}

export default function ProductStory() {
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(narrowQuery).matches, () => false);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1);

  /* Étape active : celle qui croise la ligne de lecture (au milieu de l'écran sur
     ordinateur, plus bas sur téléphone, sous la scène épinglée). */
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: mobile ? "-74% 0px -24% 0px" : "-50% 0px -50% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  /* La scène est dessinée à 560 × 660 et mise à l'échelle de son cadre. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(1.12, width / DESIGN_W, height / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section ref={rootRef} id="how" className="ps kl-section">
      <div className="kl-wrap">
        <div className="fx-head max-w-[44rem]" data-fx="">
          <p className="kl-kicker" style={{ "--kc": "#2F5BFF" } as React.CSSProperties}>Comment ça marche</p>
          <h2 className="kl-display kl-h2 mt-5">
            Quatre étapes, <em>un dossier complet.</em>
          </h2>
        </div>

        {narrow ? (
          <ol className="ps-mlist">
            {STEPS.map((s, i) => <MobileStep key={s.t} i={i} s={s} />)}
          </ol>
        ) : (
        <div className="ps-grid">
          <div className="ps-stage-wrap">
            <div ref={stageRef} className="ps-stage" aria-hidden="true">
              <div className="ps-design" style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})` }}>
                <Plane on={active === 0}><SharePlane /></Plane>
                <Plane on={active === 1}>
                  <div className="ps-phone"><PhoneForm playing={active === 1} interval={1700} /></div>
                </Plane>
                <Plane on={active === 2}><AnalysisPlane /></Plane>
                <Plane on={active === 3}><AttestationPlane /></Plane>
              </div>
            </div>
            <div className="ps-dots" aria-hidden="true">
              {STEPS.map((s, i) => <span key={s.t} data-on={i === active ? "" : undefined} />)}
            </div>
          </div>

          <ol className="ps-steps">
            {STEPS.map((s, i) => (
              <li
                key={s.t}
                ref={(el) => { stepRefs.current[i] = el; }}
                data-i={i}
                className="ps-step"
                data-on={i === active ? "" : undefined}
              >
                <span className="ps-step__n kl-display" aria-hidden="true">{i + 1}</span>
                <h3 className="kl-display ps-step__t">{s.t}</h3>
                <p className="kl-body ps-step__p">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
        )}
      </div>
    </section>
  );
}

function Plane({ on, children }: { on: boolean; children: React.ReactNode }) {
  return <div className="ps-plane" data-on={on ? "" : undefined}>{children}</div>;
}

/* 1 — L'écran « Dossier créé » (mêmes libellés que app/dashboard/nouveau) et le
   message qui arrive chez le client. */
export function SharePlane() {
  return (
    <div className="ps-share">
      <div className="ps-card">
        <div className="ps-card__ok"><span><Check size={13} strokeWidth={3} /></span>Dossier créé</div>
        <p className="ps-card__t kl-display">Le lien pour Camille Rousseau est prêt.</p>
        <div className="ps-card__link"><Link2 size={15} /><span>klaris-app.fr/kyc/7f3a…</span><b>Copier</b></div>
        <div className="ps-card__via">Partager via</div>
        <div className="ps-card__btns">
          <span><Mail size={15} />E-mail</span>
          <span data-on=""><MessageCircle size={15} />WhatsApp</span>
          <span><MessageSquare size={15} />Message</span>
        </div>
      </div>
      <div className="ps-notif">
        <span className="ps-notif__app"><MessageCircle size={18} /></span>
        <div>
          <div className="ps-notif__from"><b>Marie Lefort · Agence du Capitole</b><span>maintenant</span></div>
          <p>Bonjour, pour votre projet d&apos;achat, merci de remplir ce formulaire : klaris-app.fr/kyc/…</p>
        </div>
      </div>
    </div>
  );
}

/* 3 — L'analyse de risque (sections de components/tracfin/Step2) et l'étiquette. */
export function AnalysisPlane() {
  const rows: Array<[string, string, boolean]> = [
    ["Risque géographique", "France", true],
    ["Origine des fonds", "Prêt bancaire et apport personnel", true],
    ["Transaction", "Prix cohérent avec le marché", true],
    ["Bénéficiaires effectifs", "Acquisition via une SCI, deux associés", false],
    ["Sanctions & PPE", "Aucune correspondance", true],
  ];
  return (
    <div className="ps-analysis">
      <div className="ps-an__h">
        <span>Analyse de risque</span>
        <b>SCI Les Tilleuls</b>
      </div>
      <ul className="ps-an__list">
        {rows.map(([k, v, ok]) => (
          <li key={k} data-warn={ok ? undefined : ""}>
            <span className="ps-an__ico">{ok ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={13} strokeWidth={2.5} />}</span>
            <span className="ps-an__k">{k}</span>
            <span className="ps-an__v">{v}</span>
          </li>
        ))}
      </ul>
      <div className="ps-an__res">
        <div className="ps-an__lbl">Niveau de vigilance</div>
        <div className="kl-scale">
          {LEVELS.map((l) => (
            <div key={l.n} className="kl-scale__row">
              <div className="kl-scale__bar" data-level={l.n} style={l.n === 2 ? undefined : { opacity: 0.35 }}>
                <span>{l.name}</span>
              </div>
              {l.n === 2 && <span className="kl-scale__pointer">2</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 4 — La vraie attestation, et l'archive du dossier. */
export function AttestationPlane() {
  return (
    <div className="ps-att">
      <div className="ps-att__sheet kl-sheet">
        <AttestationMock />
      </div>
      <div className="ps-att__zip">
        <span className="ps-att__zipico"><FileArchive size={18} /></span>
        <div>
          <b>Dossier-Rousseau-2026.zip</b>
          <small>Fiche, pièces, analyse, attestation</small>
        </div>
      </div>
      <div className="ps-att__hash">
        <span>SHA-256</span>
        <code>9f2c…e41b</code>
      </div>
    </div>
  );
}
