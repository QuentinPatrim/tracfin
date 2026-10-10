// components/landing/ScrollStory.tsx — Haut de page animé au défilement
//
// Une scène « épinglée » raconte les quatre étapes du produit pendant que l'on
// fait défiler la page :
//   0. le titre, avec le téléphone posé en perspective ;
//   1. le téléphone se redresse et vient vers nous : on entre dans le VRAI
//      formulaire client (/kyc/demo), dont les étapes avancent avec le défilement ;
//   2. le téléphone s'éloigne, l'étiquette de vigilance du dossier se construit ;
//   3. l'attestation (le VRAI gabarit PDF) se relève, l'étiquette vient s'y coller.
//
// Principes :
//   - le défilement n'est jamais détourné : la position de la page pilote la scène,
//     avec un léger lissage, rien de plus ;
//   - seuls transform et opacity sont animés, écrits directement sur les éléments
//     (pas de rendu React à chaque image) ;
//   - « réduire les animations » : la scène n'est pas épinglée, tout est affiché à
//     plat (data-static), sans mouvement ;
//   - tout le texte est dans le DOM dès le départ (titre + liste ordonnée).

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { LEVELS } from "@/components/landing/VigilanceScale";

/* Dimensions naturelles des objets (px CSS, avant mise à l'échelle par la scène). */
const PHONE_W = 400;   // cadre : écran 384 + 2 × 8
const PHONE_H = 776;
const SCREEN_W = 384;
const SCREEN_H = 760;
const SHEET_W = 794;   // A4 @ 96 dpi
const SHEET_H = 1123;
const LABEL_W = 380;
const NAV_H = 64;

/* Longueur de la séquence, en hauteurs d'écran. */
const LENGTH_VH = 520;

/* Étape du formulaire affichée selon l'avancement (index dans STEPS de Kycpublicform). */
function formStep(p: number): number {
  if (p < 0.345) return 0; // Vous (légende 1 : le client ouvre le lien)
  if (p < 0.41) return 1;  // Identité
  if (p < 0.455) return 2; // Pièce d'identité
  if (p < 0.495) return 3; // Situation
  if (p < 0.53) return 5;  // Pièces justificatives
  return 6;                // Récapitulatif
}

const CAPTIONS = [
  {
    title: "Vous envoyez un lien.",
    text: "Par e-mail ou WhatsApp, depuis votre tableau de bord. Votre client n'a rien à installer et aucun compte à créer.",
    win: [0.16, 0.22, 0.33, 0.37],
  },
  {
    title: "Il remplit sa fiche.",
    text: "Identité, situation, pièces justificatives : quelques minutes, depuis son téléphone.",
    win: [0.37, 0.41, 0.555, 0.595],
  },
  {
    title: "Klaris classe le dossier.",
    text: "Quatre niveaux de vigilance, les mêmes critères pour tous vos dossiers. La décision reste la vôtre.",
    win: [0.6, 0.66, 0.77, 0.81],
  },
  {
    title: "L'attestation est prête.",
    text: "Horodatée, rangée avec la fiche et les pièces dans une seule archive, pour le jour d'un contrôle.",
    win: [0.82, 0.88, 2, 3],
  },
] as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function ScrollStory({
  isSignedIn,
  onSignUp,
  onSignIn,
  onDemo,
}: {
  isSignedIn: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
  onDemo: () => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLLIElement | null)[]>([]);
  const phoneRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // "pending" avant montage, puis "live" (animé) ou "static" (animations réduites).
  const [mode, setMode] = useState<"pending" | "live" | "static">("pending");
  const [phoneReady, setPhoneReady] = useState(false);
  const [step, setStep] = useState(0);
  const [sheetOn, setSheetOn] = useState(false);

  /* ── Mode : animé, sauf si l'utilisateur demande moins d'animations ── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(mq.matches ? "static" : "live");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* ── Dialogue avec l'iframe du formulaire (prêt, étape, thème) ── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "klaris-demo-ready") setPhoneReady(true);
    };
    window.addEventListener("message", onMsg);
    // Si l'iframe était prête avant nous, son signal est déjà passé : on le redemande.
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-ping" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-step", step }, "*");
  }, [step, phoneReady]);

  useEffect(() => {
    if (!phoneReady) return;
    const postTheme = () => {
      const t = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-theme", theme: t }, "*");
    };
    postTheme();
    const obs = new MutationObserver(postTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [phoneReady]);

  /* En mode statique, le formulaire défile tout seul, lentement. */
  useEffect(() => {
    if (mode !== "static") return;
    const order = [0, 1, 2, 3, 5, 6];
    let i = 0;
    const id = window.setInterval(() => { i = (i + 1) % order.length; setStep(order[i]); }, 4200);
    return () => window.clearInterval(id);
  }, [mode]);

  /* ── Moteur de la scène ── */
  useEffect(() => {
    if (mode !== "live") return;
    const root = rootRef.current, stage = stageRef.current;
    if (!root || !stage) return;

    let raf = 0;
    let shown = -1;        // avancement affiché (lissé)
    let target = 0;        // avancement réel
    let lastStep = -1;
    let sheetRequested = false;

    const readTarget = () => {
      const travel = root.offsetHeight - stage.offsetHeight;
      target = travel > 0 ? clamp(-root.getBoundingClientRect().top / travel) : 0;
    };

    const place = (el: HTMLElement | null, cx: number, cy: number, w: number, h: number, t: string, o: number) => {
      if (!el) return;
      el.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0) ${t}`;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };

    const render = (p: number) => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const desktop = W >= 1024;
      const sr = stage.getBoundingClientRect();
      const slot = slotRef.current?.getBoundingClientRect();
      // Colonne de droite sur ordinateur, toute la scène sur mobile.
      const slotCx = desktop && slot ? slot.left - sr.left + slot.width / 2 : W / 2;
      const slotW = desktop && slot ? slot.width : W;

      /* Titre */
      const out = easeInOut(seg(p, 0.05, 0.16));
      const copy = copyRef.current;
      if (copy) {
        copy.style.opacity = (1 - out).toFixed(3);
        copy.style.transform = `translate3d(0, ${(-48 * out).toFixed(1)}px, 0)`;
        copy.style.visibility = out > 0.99 ? "hidden" : "visible";
      }

      /* Légendes (une à la fois) */
      CAPTIONS.forEach((c, i) => {
        const el = capRefs.current[i];
        if (!el) return;
        const tin = easeOut(seg(p, c.win[0], c.win[1]));
        const tout = easeInOut(seg(p, c.win[2], c.win[3]));
        const o = Math.min(tin, 1 - tout);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - tin) * 26 - tout * 26).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });

      /* Téléphone : posé en perspective → face à nous, en grand → s'éloigne */
      const enter = easeInOut(seg(p, 0.06, 0.22));
      const leave = easeInOut(seg(p, 0.55, 0.63));
      if (desktop) {
        const sIn = Math.min((H - NAV_H - 48) / PHONE_H, (slotW * 0.92) / PHONE_W, 1.25);
        const s = lerp(sIn * 0.8, sIn, enter) * (1 - 0.32 * leave);
        const cx = slotCx + leave * W * 0.16;
        const cy = NAV_H / 2 + H / 2 + lerp(H * 0.03, 0, enter);
        const t = `rotateY(${(lerp(-27, 0, enter) + 42 * leave).toFixed(2)}deg) rotateX(${lerp(11, 0, enter).toFixed(2)}deg) rotateZ(${lerp(2.5, 0, enter).toFixed(2)}deg) scale(${s.toFixed(4)})`;
        place(phoneRef.current, cx, cy, PHONE_W, PHONE_H, t, 1 - leave);
      } else {
        // « Entrer dans le téléphone » : l'écran prend toute la largeur, le cadre sort du champ.
        const sIn = W / SCREEN_W;
        const s0 = (W * 0.72) / PHONE_W;
        const s = lerp(s0, sIn, enter) * (1 - 0.4 * leave);
        const cy0 = H * 0.63 + (PHONE_H * s0) / 2;
        const cyIn = NAV_H + (PHONE_H * sIn) / 2 - 8 * sIn;
        const cy = lerp(cy0, cyIn, enter) - leave * H * 0.1;
        const t = `rotateX(${lerp(17, 0, enter).toFixed(2)}deg) rotateY(${lerp(-9, 0, enter).toFixed(2)}deg) rotateZ(${lerp(-4, 0, enter).toFixed(2)}deg) scale(${s.toFixed(4)})`;
        place(phoneRef.current, W / 2, cy, PHONE_W, PHONE_H, t, 1 - leave);
      }

      /* Attestation : couchée → relevée */
      const rise = easeOut(seg(p, 0.8, 0.92));
      const sheetW = desktop ? Math.min(slotW * 0.9, 580) : W * 0.84;
      const sS = sheetW / SHEET_W;
      const sheetTop = NAV_H + (desktop ? Math.max(28, (H - NAV_H - SHEET_H * sS) / 2) : 20);
      const sheetCx = slotCx;
      const sheetCy = sheetTop + (SHEET_H * sS) / 2;
      place(
        sheetRef.current, sheetCx, sheetCy + (1 - rise) * H * 0.42, SHEET_W, SHEET_H,
        `rotateX(${lerp(58, 0, rise).toFixed(2)}deg) scale(${(sS * lerp(0.92, 1, rise)).toFixed(4)})`,
        seg(p, 0.8, 0.86),
      );

      /* Étiquette : arrive de côté, se construit, puis vient se coller sur l'attestation */
      const arrive = easeOut(seg(p, 0.6, 0.69));
      const stick = easeInOut(seg(p, 0.79, 0.91));
      const sL = desktop ? Math.min(1.3, (slotW * 0.78) / LABEL_W) : Math.min(1.05, (W * 0.86) / LABEL_W);
      const label = labelRef.current;
      const labelH = label ? label.offsetHeight : 250;
      const sStick = desktop ? 0.6 : 0.56;
      const homeCx = slotCx, homeCy = desktop ? NAV_H / 2 + H / 2 : H * 0.4;
      const stuckCx = sheetCx - sheetW / 2 + (LABEL_W * sStick) / 2 - (desktop ? 56 : 8);
      const stuckCy = Math.min(sheetTop + SHEET_H * sS, H - (desktop ? 40 : 190)) - (labelH * sStick) / 2 - (desktop ? 36 : 6);
      place(
        label,
        lerp(homeCx - (1 - arrive) * W * (desktop ? 0.1 : 0), stuckCx, stick),
        lerp(homeCy + (desktop ? 0 : (1 - arrive) * H * 0.2), stuckCy, stick),
        LABEL_W, labelH,
        `rotateY(${(desktop ? lerp(-38, 0, arrive) : 0).toFixed(2)}deg) rotateX(${(desktop ? 0 : lerp(24, 0, arrive)).toFixed(2)}deg) scale(${lerp(sL * lerp(0.86, 1, arrive), sStick, stick).toFixed(4)})`,
        arrive,
      );
      // Les barres se déploient l'une après l'autre, puis le repère se pose sur le niveau 1.
      const grow = seg(p, 0.64, 0.74);
      barRefs.current.forEach((b, i) => {
        if (!b) return;
        const g = easeOut(clamp((grow * 1.5 - i * 0.14) / 0.6));
        b.style.transform = `scaleX(${lerp(0.12, 1, g).toFixed(3)})`;
        // Le libellé n'apparaît qu'une fois la barre déployée (sinon il est écrasé).
        const txt = b.firstElementChild as HTMLElement | null;
        if (txt) txt.style.opacity = clamp((g - 0.72) / 0.28).toFixed(3);
        b.style.opacity = (i === 0 ? 1 : lerp(1, 0.34, easeInOut(seg(p, 0.735, 0.775)))).toFixed(3);
      });
      const pt = pointerRef.current;
      if (pt) {
        const a = easeOut(seg(p, 0.725, 0.765));
        pt.style.opacity = a.toFixed(3);
        pt.style.transform = `translate3d(${((1 - a) * 18).toFixed(1)}px, 0, 0)`;
      }

      /* Effets discrets : étape du formulaire, chargement tardif du PDF */
      const st = formStep(p);
      if (st !== lastStep) { lastStep = st; setStep(st); }
      if (!sheetRequested && p > 0.3) { sheetRequested = true; setSheetOn(true); }
    };

    const tick = () => {
      raf = 0;
      readTarget();
      if (shown < 0) shown = target;
      const diff = target - shown;
      shown = Math.abs(diff) < 0.0004 ? target : shown + diff * 0.2;
      render(shown);
      if (shown !== target) raf = requestAnimationFrame(tick);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { shown = -1; request(); };

    request();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <section
      ref={rootRef}
      id="how"
      className="st kl-field"
      data-mode={mode}
      data-nav-field=""
      style={mode === "live" ? { height: `${LENGTH_VH}svh` } : undefined}
    >
      <div ref={stageRef} className="st-stage">
        <div className="st-inner kl-wrap">
          <div className="st-text">
            <div ref={copyRef} className="st-copy">
              <h1 className="kl-display kl-h1 kl-enter">Vos dossiers LCB-FT en ordre, sans stress.</h1>
              <p className="kl-lede kl-enter mt-5 sm:mt-6" style={{ "--d": "70ms" } as React.CSSProperties}>
                Klaris aide les agences immobilières à identifier leurs clients, évaluer le
                niveau de vigilance et conserver les pièces cinq ans. Le jour d&apos;un contrôle,
                tout est déjà au même endroit.
              </p>
              <div className="kl-enter mt-7 flex flex-wrap items-center gap-3 sm:mt-9" style={{ "--d": "140ms" } as React.CSSProperties}>
                {isSignedIn ? (
                  <Link href="/dashboard" className="kl-btn kl-btn--onfield">Mon tableau de bord</Link>
                ) : (
                  <button type="button" onClick={onSignUp} className="kl-btn kl-btn--onfield">
                    Essayer 14 jours gratuits
                  </button>
                )}
                <button type="button" onClick={onDemo} className="kl-btn kl-btn--ghost">
                  <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
                  Voir la démo guidée
                </button>
              </div>
              <p className="kl-enter mt-4 text-[0.9rem] sm:mt-5" style={{ color: "var(--kl-on-field-2)", "--d": "200ms" } as React.CSSProperties}>
                Aucun prélèvement avant le 14ᵉ jour.
                {!isSignedIn && (
                  <>
                    {" "}Déjà un compte ?{" "}
                    <button type="button" onClick={onSignIn} className="kl-link">Se connecter</button>
                  </>
                )}
              </p>
            </div>

            <ol className="st-caps">
              {CAPTIONS.map((c, i) => (
                <li key={c.title} ref={(el) => { capRefs.current[i] = el; }} className="st-cap">
                  <span className="st-cap__n kl-display" aria-hidden="true">{i + 1}</span>
                  <h2 className="kl-display st-cap__t">{c.title}</h2>
                  <p className="st-cap__p">{c.text}</p>
                  {i === CAPTIONS.length - 1 && !isSignedIn && (
                    <button type="button" onClick={onSignUp} className="kl-btn kl-btn--onfield st-cap__cta">
                      Essayer 14 jours gratuits
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Emplacement de la colonne de droite : sert uniquement de repère de mesure. */}
          <div ref={slotRef} className="st-slot" aria-hidden="true" />
        </div>

        {/* Les trois objets de la scène, placés et animés par le moteur. */}
        <div className="st-objs" aria-hidden="true">
          <div ref={sheetRef} className="st-obj st-sheet kl-sheet" style={{ width: SHEET_W, height: SHEET_H }}>
            {sheetOn && (
              <iframe
                src="/pdf-render/attestation/demo"
                title="Attestation générée par Klaris (exemple fictif)"
                tabIndex={-1}
                scrolling="no"
                style={{ width: SHEET_W, height: SHEET_H, border: 0, pointerEvents: "none" }}
              />
            )}
          </div>

          <div ref={phoneRef} className="st-obj st-phone" style={{ width: PHONE_W, height: PHONE_H }}>
            <div className="st-phone__screen" style={{ width: SCREEN_W, height: SCREEN_H }}>
              <iframe
                ref={iframeRef}
                src="/kyc/demo"
                title="Le formulaire reçu par le client (exemple fictif)"
                tabIndex={-1}
                scrolling="no"
                style={{ width: SCREEN_W, height: SCREEN_H, border: 0, pointerEvents: "none" }}
              />
            </div>
          </div>

          <div ref={labelRef} className="st-obj st-label" style={{ width: LABEL_W }}>
            <div className="st-label__k">Niveau de vigilance du dossier</div>
            <div className="kl-display st-label__v">{LEVELS[0].name}</div>
            <div className="kl-scale st-label__bars">
              {LEVELS.map((l, i) => (
                <div key={l.n} className="kl-scale__row">
                  <div ref={(el) => { barRefs.current[i] = el; }} className="kl-scale__bar" data-level={l.n}>
                    <span>{l.name}</span>
                  </div>
                  {i === 0 && <span ref={pointerRef} className="kl-scale__pointer">1</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
