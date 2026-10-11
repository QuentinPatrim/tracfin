// components/landing/ScrollStory.tsx — Haut de page animé, étape par étape
//
// La scène occupe un écran. Elle raconte les quatre étapes du produit, chacune
// avec son propre plan :
//   0. le titre, avec le téléphone posé en perspective ;
//   1. « Vous envoyez un lien » : l'écran « Dossier créé » au premier plan, le
//      téléphone du client au loin, le message part de l'un vers l'autre ;
//   2. « Il remplit sa fiche » : on entre dans le téléphone, le VRAI formulaire
//      client (/kyc/demo) avance tout seul ;
//   3. « Klaris classe le dossier » : le téléphone sort, l'étiquette de vigilance
//      se construit ;
//   4. « L'attestation est prête » : le VRAI gabarit PDF se relève, l'étiquette
//      vient s'y coller.
//
// Principes :
//   - UN GESTE = UNE ÉTAPE. Tant que la page est tout en haut, un glissement du
//     doigt, un coup de molette ou une flèche du clavier fait avancer d'une étape,
//     jamais de deux, même avec un grand geste. Après la dernière étape, la page
//     défile normalement ; revenu tout en haut, on remonte les étapes ;
//   - les transitions sont jouées dans le temps (et non accrochées au défilement) ;
//   - seuls transform et opacity sont animés, écrits directement sur les éléments
//     (pas de rendu React à chaque image) ;
//   - « réduire les animations » : rien n'est capté, tout est affiché à plat
//     (data-mode="static"), sans mouvement ;
//   - tout le texte est dans le DOM dès le départ (titre + liste ordonnée).

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Link2, MessageSquare, Play } from "lucide-react";
import { LEVELS } from "@/components/landing/VigilanceScale";

/* Dimensions naturelles des objets (px CSS, avant mise à l'échelle par la scène). */
const PHONE_W = 400;   // cadre : écran 384 + 2 × 8
const PHONE_H = 776;
const SCREEN_W = 384;
const SCREEN_H = 760;
const SHEET_W = 794;   // A4 @ 96 dpi
const SHEET_H = 1123;
const LABEL_W = 380;
const CARD_W = 420;
const CHIP_W = 236;
const CHIP_H = 46;
const NAV_H = 64;

/* Plans de la séquence : 0 = titre, 1 à 4 = étapes. */
const LAST = 4;
/* Durée de chaque transition vers l'avant (ms) ; le retour est plus vif. */
const DUR_FWD = [1700, 1250, 1650, 1450];
const DUR_BACK = 820;
/* Après un changement d'étape, les gestes sont ignorés pendant ce délai. */
const LOCK_MS = 620;

/* Étapes du formulaire jouées pendant le plan 2 (index dans STEPS de Kycpublicform). */
const FORM_PLAY = [0, 1, 2, 3, 5, 6];
const FORM_LAST = 6;

const CAPTIONS = [
  {
    title: "Vous envoyez un lien.",
    text: "Par e-mail ou WhatsApp, depuis votre tableau de bord. Votre client n'a rien à installer et aucun compte à créer.",
  },
  {
    title: "Il remplit sa fiche.",
    text: "Identité, situation, pièces justificatives : quelques minutes, depuis son téléphone.",
  },
  {
    title: "Klaris classe le dossier.",
    text: "Vous complétez l'analyse de risque ; Klaris en déduit un niveau de vigilance sur quatre, avec les mêmes critères pour tous vos dossiers.",
  },
  {
    title: "L'attestation est prête.",
    text: "Horodatée, rangée avec la fiche et les pièces dans une seule archive, pour le jour d'un contrôle.",
  },
] as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const bell = (t: number) => Math.sin(Math.PI * clamp(t));

type Pose = { cx: number; cy: number; s: number; ry: number; rx: number; rz: number };
const mix = (a: Pose, b: Pose, t: number): Pose => ({
  cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: lerp(a.s, b.s, t),
  ry: lerp(a.ry, b.ry, t), rx: lerp(a.rx, b.rx, t), rz: lerp(a.rz, b.rz, t),
});
const tf = (p: Pose) =>
  `rotateY(${p.ry.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;

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
  const lockRef = useRef<HTMLDivElement>(null);
  const lockInRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardBtnRef = useRef<HTMLSpanElement>(null);
  const cardSentRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Commandes exposées par le moteur aux boutons (repères, « Passer »).
  const goRef = useRef<(n: number) => void>(() => {});
  const skipRef = useRef<() => void>(() => {});

  // "pending" avant montage, puis "live" (animé) ou "static" (animations réduites).
  const [mode, setMode] = useState<"pending" | "live" | "static">("pending");
  const [phoneReady, setPhoneReady] = useState(false);
  const [stage, setStage] = useState(0);
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

  /* ── Le formulaire avance tout seul : pendant le plan 2, ou en mode statique ── */
  useEffect(() => {
    if (mode === "static") {
      let i = 0;
      const id = window.setInterval(() => { i = (i + 1) % FORM_PLAY.length; setStep(FORM_PLAY[i]); }, 4200);
      return () => window.clearInterval(id);
    }
    if (mode !== "live") return;
    if (stage !== 2) {
      // Avant : la première page. Après : le récapitulatif, là où le client s'est arrêté.
      const id = window.setTimeout(() => setStep(stage < 2 ? FORM_PLAY[0] : FORM_LAST), stage < 2 ? 500 : 0);
      return () => window.clearTimeout(id);
    }
    let i = 0;
    let id = 0;
    const next = () => {
      i += 1;
      setStep(FORM_PLAY[i]);
      if (i < FORM_PLAY.length - 1) id = window.setTimeout(next, 1500);
    };
    // On laisse le téléphone arriver avant de tourner les pages.
    id = window.setTimeout(next, 1700);
    return () => window.clearTimeout(id);
  }, [mode, stage]);

  /* ── Moteur de la scène ── */
  useEffect(() => {
    if (mode !== "live") return;
    const root = rootRef.current, stageEl = stageRef.current;
    if (!root || !stageEl) return;

    let raf = 0;
    let u = 0;             // position sur la ligne de temps (0 → LAST), continue
    let goal = 0;          // plan visé (entier)
    let lastTs = 0;
    let lockUntil = 0;
    let visible = true;
    let skipPending = false;

    /* Mesures (refaites au redimensionnement, pas à chaque image). */
    const M = {
      W: 0, H: 0, desktop: false, slotCx: 0, slotW: 0,
      capH: [0, 0, 0, 0], labelH: 250, cardH: 300, btnDx: 0, btnDy: 0,
    };
    const measure = () => {
      M.W = stageEl.clientWidth; M.H = stageEl.clientHeight;
      M.desktop = M.W >= 1024;
      const sr = stageEl.getBoundingClientRect();
      const slot = slotRef.current?.getBoundingClientRect();
      M.slotCx = M.desktop && slot ? slot.left - sr.left + slot.width / 2 : M.W / 2;
      M.slotW = M.desktop && slot ? slot.width : M.W;
      M.capH = CAPTIONS.map((_, i) => capRefs.current[i]?.offsetHeight ?? 170);
      M.labelH = labelRef.current?.offsetHeight ?? 250;
      const card = cardRef.current, btn = cardBtnRef.current;
      M.cardH = card?.offsetHeight ?? 300;
      if (card && btn) {
        // Position du bouton « WhatsApp » par rapport au centre de la carte (px naturels).
        M.btnDx = btn.offsetLeft + btn.offsetWidth / 2 - CARD_W / 2;
        M.btnDy = btn.offsetTop + btn.offsetHeight / 2 - M.cardH / 2;
      }
    };

    const place = (el: HTMLElement | null, cx: number, cy: number, w: number, h: number, t: string, o: number) => {
      if (!el) return;
      el.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0) ${t}`;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };

    const render = (now: number) => {
      const { W, H, desktop, slotCx, slotW } = M;
      const mid = NAV_H / 2 + H / 2;
      // Zone libre au-dessus de la légende (mobile) pour un plan donné.
      const freeBottom = (k: number) => H - 14 - M.capH[k - 1] - 12;

      /* Titre */
      const out = easeInOut(seg(u, 0.02, 0.36));
      const copy = copyRef.current;
      if (copy) {
        copy.style.opacity = (1 - out).toFixed(3);
        copy.style.transform = `translate3d(0, ${(-48 * out).toFixed(1)}px, 0)`;
        copy.style.visibility = out > 0.99 ? "hidden" : "visible";
      }

      /* Légendes (une à la fois) */
      CAPTIONS.forEach((_, i) => {
        const el = capRefs.current[i];
        if (!el) return;
        const k = i + 1;
        const tin = easeOut(seg(u, k - 0.5, k - 0.1));
        const tout = k === LAST ? 0 : easeInOut(seg(u, k + 0.04, k + 0.32));
        const o = Math.min(tin, 1 - tout);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - tin) * 26 - tout * 26).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });

      /* Léger flottement des objets tant qu'on n'est pas « dans » le téléphone. */
      const fw = 1 - seg(u, 1.05, 1.4);
      const fy = Math.sin(now / 1150) * 6 * fw;
      const fr = Math.sin(now / 1800) * 0.55 * fw;

      /* Téléphone : posé en perspective → au loin → face à nous, en grand → sort */
      let p0: Pose, p1: Pose, p2: Pose;
      if (desktop) {
        const sIn = Math.min((H - NAV_H - 48) / PHONE_H, (slotW * 0.92) / PHONE_W, 1.25);
        p0 = { cx: slotCx, cy: mid + H * 0.03, s: sIn * 0.8, ry: -27, rx: 11, rz: 2.5 };
        p1 = { cx: slotCx + slotW * 0.2, cy: mid - H * 0.09, s: sIn * 0.6, ry: -29, rx: 9, rz: 4 };
        p2 = { cx: slotCx, cy: mid, s: sIn, ry: 0, rx: 0, rz: 0 };
      } else {
        // « Entrer dans le téléphone » : l'écran prend toute la largeur, le cadre sort du champ.
        const sIn = W / SCREEN_W;
        const s0 = (W * 0.72) / PHONE_W;
        const top = NAV_H + 10, bottom = freeBottom(1);
        const s1 = clamp(((bottom - top) * 0.6) / PHONE_H, 0.26, 0.52);
        p0 = { cx: W / 2, cy: H * 0.63 + (PHONE_H * s0) / 2, s: s0, ry: -9, rx: 17, rz: -4 };
        p1 = { cx: W * 0.7, cy: bottom - (PHONE_H * s1) / 2 + 8, s: s1, ry: -21, rx: 11, rz: 6 };
        p2 = { cx: W / 2, cy: NAV_H + (PHONE_H * sIn) / 2 - 8 * sIn, s: sIn, ry: 0, rx: 0, rz: 0 };
      }
      const away = easeInOut(seg(u, 0.05, 0.78));
      const dive = easeInOut(seg(u, 1.1, 1.86));
      const leave = easeInOut(seg(u, 2.0, 2.5));
      const ph = mix(mix(p0, p1, away), p2, dive);
      ph.cy += fy; ph.rz += fr;
      if (desktop) { ph.cx += leave * W * 0.16; ph.s *= 1 - 0.32 * leave; ph.ry += 42 * leave; }
      else { ph.cy -= leave * H * 0.1; ph.s *= 1 - 0.4 * leave; }
      place(phoneRef.current, ph.cx, ph.cy, PHONE_W, PHONE_H, tf(ph), 1 - leave);

      /* Écran verrouillé : il recouvre le formulaire pendant le plan 1, puis s'ouvre. */
      const lock = lockRef.current;
      if (lock) {
        const open = seg(u, 1.36, 1.6);
        const o = seg(u, 0.2, 0.48) * (1 - open);
        lock.style.opacity = o.toFixed(3);
        lock.style.visibility = o < 0.01 ? "hidden" : "visible";
        // À l'ouverture, le contenu grossit légèrement (le cadre, lui, ne bouge pas).
        if (lockInRef.current) lockInRef.current.style.transform = `scale(${(1 + 0.12 * open).toFixed(4)})`;
      }
      const notif = notifRef.current;
      if (notif) {
        const a = easeOut(seg(u, 0.88, 1));
        const tap = bell(seg(u, 1.12, 1.34));
        notif.style.opacity = a.toFixed(3);
        notif.style.transform = `translate3d(0, ${((1 - a) * -22).toFixed(1)}px, 0) scale(${(1 - 0.05 * tap).toFixed(4)})`;
      }

      /* Écran « Dossier créé » : entre par le bas, repart sur le côté */
      const cIn = easeOut(seg(u, 0.16, 0.66));
      const cOut = easeInOut(seg(u, 1.0, 1.46));
      const sc = desktop ? Math.min(1.05, (slotW * 0.74) / CARD_W) : Math.min(0.86, (W * 0.84) / CARD_W);
      const cardHome = desktop
        ? { cx: slotCx - slotW * 0.15, cy: mid + H * 0.17 }
        : { cx: W * 0.455, cy: NAV_H + 14 + (M.cardH * sc) / 2 };
      const card: Pose = {
        cx: cardHome.cx - cOut * W * (desktop ? 0.12 : 0.45),
        cy: cardHome.cy + (1 - cIn) * H * 0.34 - fy * 0.7,
        s: sc * lerp(0.86, 1, cIn) * (1 - 0.18 * cOut),
        ry: (desktop ? 15 : 9) + cOut * 38,
        rx: (desktop ? 5 : 4) + (1 - cIn) * 36,
        rz: (desktop ? -1.5 : -2) - fr,
      };
      place(cardRef.current, card.cx, card.cy, CARD_W, M.cardH, tf(card), cIn * (1 - cOut));
      const btn = cardBtnRef.current;
      if (btn) btn.style.transform = `scale(${(1 - 0.07 * bell(seg(u, 0.54, 0.68))).toFixed(4)})`;
      const sent = cardSentRef.current;
      if (sent) sent.style.opacity = seg(u, 0.84, 0.98).toFixed(3);

      /* Le message : du bouton « WhatsApp » jusqu'au téléphone, en cloche */
      const fly = seg(u, 0.62, 0.93);
      const e = easeInOut(fly);
      const ax = card.cx + M.btnDx * card.s, ay = card.cy + M.btnDy * card.s;
      const bx = ph.cx, by = ph.cy - PHONE_H * ph.s * 0.24;
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - H * 0.12;
      const qx = (1 - e) * (1 - e) * ax + 2 * (1 - e) * e * mx + e * e * bx;
      const qy = (1 - e) * (1 - e) * ay + 2 * (1 - e) * e * my + e * e * by;
      const chipS = (desktop ? 1 : 0.82) * lerp(0.7, 1.08, bell(e)) * lerp(1, 0.6, seg(fly, 0.75, 1));
      place(
        chipRef.current, qx, qy, CHIP_W, CHIP_H,
        `rotateZ(${lerp(-10, 6, e).toFixed(2)}deg) scale(${chipS.toFixed(4)})`,
        Math.min(seg(fly, 0, 0.14), 1 - seg(fly, 0.82, 1)),
      );

      /* Attestation : couchée → relevée */
      const rise = easeOut(seg(u, 3.08, 3.8));
      const sheetW = desktop ? Math.min(slotW * 0.9, 580) : W * 0.84;
      const sS = sheetW / SHEET_W;
      const sheetTop = NAV_H + (desktop ? Math.max(28, (H - NAV_H - SHEET_H * sS) / 2) : 20);
      const sheetCx = slotCx;
      const sheetCy = sheetTop + (SHEET_H * sS) / 2;
      place(
        sheetRef.current, sheetCx, sheetCy + (1 - rise) * H * 0.42, SHEET_W, SHEET_H,
        `rotateX(${lerp(58, 0, rise).toFixed(2)}deg) scale(${(sS * lerp(0.92, 1, rise)).toFixed(4)})`,
        seg(u, 3.08, 3.36),
      );

      /* Étiquette : arrive de côté, se construit, puis vient se coller sur l'attestation */
      const arrive = easeOut(seg(u, 2.22, 2.64));
      const stick = easeInOut(seg(u, 3.04, 3.86));
      const sL = desktop ? Math.min(1.3, (slotW * 0.78) / LABEL_W) : Math.min(1.05, (W * 0.86) / LABEL_W);
      const labelH = M.labelH;
      const sStick = desktop ? 0.6 : 0.56;
      const homeCx = slotCx;
      const homeCy = desktop ? mid : (NAV_H + freeBottom(3)) / 2 + 6;
      const stuckCx = sheetCx - sheetW / 2 + (LABEL_W * sStick) / 2 - (desktop ? 56 : 8);
      const stuckCy = Math.min(sheetTop + SHEET_H * sS, desktop ? H - 40 : freeBottom(4) + 4) - (labelH * sStick) / 2 - (desktop ? 36 : 6);
      place(
        labelRef.current,
        lerp(homeCx - (1 - arrive) * W * (desktop ? 0.1 : 0), stuckCx, stick),
        lerp(homeCy + (desktop ? 0 : (1 - arrive) * H * 0.2), stuckCy, stick),
        LABEL_W, labelH,
        `rotateY(${(desktop ? lerp(-38, 0, arrive) : 0).toFixed(2)}deg) rotateX(${(desktop ? 0 : lerp(24, 0, arrive)).toFixed(2)}deg) scale(${lerp(sL * lerp(0.86, 1, arrive), sStick, stick).toFixed(4)})`,
        arrive,
      );
      // Les barres se déploient l'une après l'autre, puis le repère se pose sur le niveau 1.
      const grow = seg(u, 2.46, 2.88);
      const dim = easeInOut(seg(u, 2.86, 2.97));
      barRefs.current.forEach((b, i) => {
        if (!b) return;
        const g = easeOut(clamp((grow * 1.5 - i * 0.14) / 0.6));
        b.style.transform = `scaleX(${lerp(0.12, 1, g).toFixed(3)})`;
        // Le libellé n'apparaît qu'une fois la barre déployée (sinon il est écrasé).
        const txt = b.firstElementChild as HTMLElement | null;
        if (txt) txt.style.opacity = clamp((g - 0.72) / 0.28).toFixed(3);
        b.style.opacity = (i === 0 ? 1 : lerp(1, 0.34, dim)).toFixed(3);
      });
      const pt = pointerRef.current;
      if (pt) {
        const a = easeOut(seg(u, 2.84, 2.98));
        pt.style.opacity = a.toFixed(3);
        pt.style.transform = `translate3d(${((1 - a) * 18).toFixed(1)}px, 0, 0)`;
      }
    };

    /* Boucle : avance la ligne de temps vers le plan visé, à vitesse constante par transition. */
    const frame = (now: number) => {
      raf = 0;
      const dt = lastTs ? Math.min(64, now - lastTs) : 16;
      lastTs = now;
      if (u !== goal) {
        const dir = goal > u ? 1 : -1;
        const k = dir > 0 ? Math.min(LAST - 1, Math.floor(u + 1e-6)) : 0;
        const dur = dir > 0 ? DUR_FWD[k] : DUR_BACK;
        // Plus d'un plan de retard (repère cliqué, « Passer ») : on rattrape plus vite.
        const boost = Math.abs(goal - u) > 1 ? 2.2 : 1;
        u += (dir * dt * boost) / dur;
        if ((goal - u) * dir <= 0) u = goal;
      }
      render(now);
      const floating = visible && !document.hidden && u < 1.4;
      if (u !== goal || floating) raf = requestAnimationFrame(frame);
      else lastTs = 0;
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const go = (n: number, force = false) => {
      n = clamp(Math.round(n), 0, LAST);
      if (n === goal) return;
      if (!force && performance.now() < lockUntil) return;
      goal = n;
      lockUntil = performance.now() + LOCK_MS;
      setStage(n);
      // Le PDF de l'attestation n'est chargé qu'à l'approche de son plan.
      if (n >= 2) setSheetOn(true);
      request();
    };
    goRef.current = (n) => go(n, true);
    // « Passer » : la page descend ; une fois la scène hors champ, on la range sur son
    // dernier plan pour que le défilement reprenne normalement au retour.
    skipRef.current = () => { skipPending = true; };

    /* ── Gestes : un geste = une étape ── */
    const locked = () => performance.now() < lockUntil;
    // La scène ne capte les gestes que si la page est tout en haut, sans zoom, et si
    // aucune fenêtre n'est ouverte par-dessus (menu, démo, connexion). Un geste qui
    // part du bandeau cookies ou de la barre de navigation compte aussi : c'est là
    // que le pouce se pose.
    const overlayOpen = (t: EventTarget | null) =>
      document.body.style.overflow === "hidden" ||
      (t instanceof Element && !!t.closest("[aria-modal='true'], [class*='cl-modal']"));
    const capturable = (t: EventTarget | null) => {
      if (window.scrollY > 2) return false;
      if ((window.visualViewport?.scale ?? 1) > 1.02) return false;
      return !overlayOpen(t);
    };
    // Sens demandé (+1 vers la suite, -1 retour) : la scène a-t-elle encore un plan à montrer ?
    const hasNext = (dir: number) => (dir > 0 ? goal < LAST : goal > 0);

    // Doigt
    let tOk = false, tCaptured = false, tDone = false, tX = 0, tY = 0, tDy = 0;
    const onTouchStart = (e: TouchEvent) => {
      tCaptured = false; tDone = false; tDy = 0;
      tOk = e.touches.length === 1 && capturable(e.target);
      if (tOk) { tX = e.touches[0].clientX; tY = e.touches[0].clientY; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tOk || e.touches.length !== 1) { tOk = false; return; }
      const dx = tX - e.touches[0].clientX;
      tDy = tY - e.touches[0].clientY;
      if (!tCaptured) {
        // Le premier mouvement décide : horizontal ou sortie de la séquence → la page reprend la main.
        if (Math.abs(dx) > Math.abs(tDy)) { tOk = false; return; }
        const dir = tDy > 0 ? 1 : -1;
        if (!hasNext(dir) && !locked()) { tOk = false; return; }
        tCaptured = true;
      }
      if (e.cancelable) e.preventDefault();
      if (!tDone && Math.abs(tDy) > 22) { tDone = true; go(goal + (tDy > 0 ? 1 : -1)); }
    };
    const onTouchEnd = () => {
      // Petit geste vif, terminé avant le seuil : il compte quand même.
      if (tOk && tCaptured && !tDone && Math.abs(tDy) > 8) go(goal + (tDy > 0 ? 1 : -1));
      tOk = false;
    };

    // Molette et pavé tactile : l'inertie d'un même geste ne déclenche qu'une étape.
    let wLast = 0, wPrev = 0, wFired = false, wAcc = 0, wOk = false;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // zoom
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * M.H : e.deltaY;
      if (Math.abs(e.deltaX) > Math.abs(dy) || dy === 0) return;
      // L'heure de l'évènement, pas celle du traitement : une image lente ne doit pas
      // être prise pour une pause entre deux gestes.
      const now = e.timeStamp;
      const abs = Math.abs(dy);
      const gap = now - wLast;
      // Pause franche : nouveau geste. Courte pause suivie d'un mouvement plus faible :
      // c'est l'inertie du même geste qui continue.
      if (gap > 400 || (gap > 180 && abs >= wPrev)) { wFired = false; wAcc = 0; wOk = capturable(e.target); }
      // Nouvelle impulsion nette pendant l'inertie de la précédente : nouveau geste.
      else if (wFired && !locked() && abs > wPrev * 1.6 + 10) { wFired = false; wAcc = 0; }
      wLast = now; wPrev = abs;
      if (!wOk) return;
      if (window.scrollY > 2) { wOk = false; return; }
      const dir = dy > 0 ? 1 : -1;
      if (!hasNext(dir) && !wFired && !locked()) return; // la page défile normalement
      e.preventDefault();
      if (wFired || locked()) return;
      wAcc += dy;
      if (Math.abs(wAcc) >= 18) { wFired = true; go(goal + dir); }
    };

    // Clavier
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (window.scrollY > 2) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (overlayOpen(t)) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else if (e.key === " " && !(t && /^(BUTTON|A)$/.test(t.tagName))) dir = e.shiftKey ? -1 : 1;
      if (!dir || (!hasNext(dir) && !locked())) return;
      e.preventDefault();
      go(goal + dir);
    };

    const onScroll = () => {
      if (skipPending && window.scrollY > M.H * 0.9) {
        skipPending = false;
        u = goal = LAST;
        setStage(LAST);
        setSheetOn(true);
        request();
      }
    };
    const onResize = () => { measure(); request(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) request(); });
    io.observe(root);
    const onVis = () => { if (!document.hidden) request(); };

    measure();
    request();
    // Les polices changent la hauteur des légendes : on remesure une fois chargées.
    document.fonts?.ready.then(() => { measure(); request(); }).catch(() => {});
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      goRef.current = () => {};
      skipRef.current = () => {};
    };
  }, [mode]);

  return (
    <section
      ref={rootRef}
      id="how"
      className="st kl-field"
      data-mode={mode}
      data-stage={stage}
      data-nav-field=""
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
                  {/* « 2/4 » : on sait toujours où l'on en est, et que la séquence a une fin. */}
                  <span className="st-cap__n kl-display" aria-hidden="true">
                    {i + 1}<span className="st-cap__of">/{CAPTIONS.length}</span>
                  </span>
                  <h2 className="kl-display st-cap__t">{c.title}</h2>
                  {i < CAPTIONS.length - 1 && (
                    <a href="#vigilance" className="st-cap__skip" onClick={() => skipRef.current()}>
                      Passer<span className="st-cap__skip-long"> la présentation</span>
                    </a>
                  )}
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

        {/* Les objets de la scène, placés et animés par le moteur. */}
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
              {/* Le téléphone du client, verrouillé : le message de l'agent arrive. */}
              <div ref={lockRef} className="st-lock">
                <div ref={lockInRef} className="st-lock__in">
                <div className="st-lock__time kl-display">9:41</div>
                <div ref={notifRef} className="st-lock__notif">
                  <span className="st-lock__app"><MessageSquare width={22} height={22} strokeWidth={2.2} /></span>
                  <div className="st-lock__body">
                    <div className="st-lock__from"><b>Marie Lefort</b><span>maintenant</span></div>
                    <p>Bonjour, pour votre projet immobilier, je vous invite à remplir ce formulaire : klaris-app.fr/kyc/…</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* L'écran « Dossier créé » du tableau de bord (mêmes libellés que le produit). */}
          <div ref={cardRef} className="st-obj st-card" style={{ width: CARD_W }}>
            <div className="st-card__ok"><span><Check width={15} height={15} strokeWidth={3} /></span>Dossier créé</div>
            <p className="st-card__t kl-display">Le lien KYC pour Camille Rousseau est prêt.</p>
            <div className="st-card__link">
              <Link2 width={16} height={16} />
              <span>klaris-app.fr/kyc/…</span>
              <b>Copier</b>
            </div>
            <div className="st-card__via">Partager via</div>
            <div className="st-card__btns">
              <span>Email</span>
              <span ref={cardBtnRef} data-on="">WhatsApp</span>
              <span>Message</span>
            </div>
            <div ref={cardSentRef} className="st-card__sent"><Check width={14} height={14} strokeWidth={3} />Lien envoyé à votre client</div>
          </div>

          <div ref={chipRef} className="st-obj st-chip" style={{ width: CHIP_W, height: CHIP_H }}>
            <Link2 width={17} height={17} />
            <span>klaris-app.fr/kyc/…</span>
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

        {/* Repères : où l'on en est, et un accès direct à chaque étape. */}
        <nav className="st-rail" aria-label="Étapes de la présentation">
          {["Accueil", ...CAPTIONS.map((c) => c.title)].map((t, i) => (
            <button
              key={t}
              type="button"
              className="st-rail__dot"
              aria-label={i === 0 ? "Revenir au titre" : `Étape ${i} : ${t}`}
              aria-current={stage === i ? "step" : undefined}
              onClick={() => goRef.current(i)}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}
