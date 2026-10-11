// components/landing/DemoModal.tsx — Démo guidée : un film en 3D, joué dans le navigateur
//
// Quatre chapitres, un seul décor. Les écrans du produit sont posés dans un espace
// en trois dimensions et une caméra vole de l'un à l'autre :
//   1. le tableau de bord : on crée le dossier, le lien est généré ;
//   2. le téléphone du client : le VRAI formulaire (/kyc/demo) avance étape par étape ;
//   3. l'analyse de risque, puis l'étiquette de vigilance ;
//   4. la VRAIE attestation (/pdf-render/attestation/demo) et l'archive du dossier.
//
// Fonctionnement :
//   - une seule horloge (le temps du film, en millisecondes). Tout l'affichage s'en
//     déduit : position de la caméra, curseur, texte saisi, éléments révélés. Mettre
//     en pause, revenir en arrière ou sauter un chapitre revient à changer l'heure ;
//   - la caméra est une transformation CSS 3D appliquée au décor entier (.dm-world).
//     Ses plans sont décrits par l'objet visé, la zone à cadrer et l'angle ;
//   - seuls transform et opacity sont animés ;
//   - « réduire les animations » : pas de lecture automatique ni de vol de caméra,
//     on passe d'un plan fixe au suivant avec les boutons.
//
// Règles de fond : on ne montre que ce que le produit fait. L'envoi du lien passe
// par la messagerie de l'agent ; le niveau de vigilance vient de l'analyse saisie
// par l'agent ; aucun contrôle n'est présenté comme automatique s'il ne l'est pas.

"use client";

import "./demo-film.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Play, Pause, ChevronLeft, ChevronRight, Plus, Check, Link2, MessageSquare,
  FileText, FolderArchive, RotateCcw, MousePointer2,
} from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";
import { LEVELS } from "@/components/landing/VigilanceScale";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;
}

/* ── Décor : taille naturelle et place de chaque objet dans l'espace (px) ── */
const WIN_W = 1040, WIN_H = 660;
const PHONE_W = 400, PHONE_H = 776, SCREEN_W = 384, SCREEN_H = 760;
const PANEL_W = 520, PANEL_H = 724;
const LABEL_W = 380, LABEL_H = 356;   // hauteur approchée, pour le centrage
const SHEET_W = 794, SHEET_H = 1123;
const ZIP_W = 430, ZIP_H = 256;
const CHIP_W = 250, CHIP_H = 50;

type Obj = { x: number; y: number; z: number; ry: number };
const WORLD = {
  win: { x: 0, y: 0, z: 0, ry: 0 },
  phone: { x: 1320, y: 10, z: 180, ry: -26 },
  panel: { x: 2700, y: 0, z: 0, ry: 12 },
  label: { x: 3020, y: 110, z: 250, ry: -8 },
  // L'attestation est loin de l'analyse : aucun objet du chapitre 3 ne reste dans le champ.
  sheet: { x: 4900, y: 0, z: -40, ry: -12 },
  // L'archive est accrochée au bord bas de l'attestation, un peu en avant : elle ne
  // recouvre que le pied de page.
  zip: { x: 4900, y: 615, z: 50, ry: -8 },
} satisfies Record<string, Obj>;
type ObjName = keyof typeof WORLD;

const PERSPECTIVE = 1400;

/* ── Chapitres ── */
const CHAPTERS = [
  {
    t: 0,
    title: "Vous créez le dossier.",
    text: "Quatre champs suffisent : le rôle, le type de client, son nom, son e-mail. Le lien de la fiche est généré aussitôt.",
  },
  {
    t: 8900,
    title: "Votre client remplit sa fiche.",
    text: "Vous lui envoyez le lien par e-mail, WhatsApp ou message. Il répond en sept étapes sur son téléphone, sans compte ni application.",
  },
  {
    t: 19000,
    title: "Vous analysez, Klaris classe.",
    text: "Ses réponses et ses pièces arrivent dans le dossier. Vous complétez l'analyse de risque ; Klaris en déduit le niveau de vigilance et la marche à suivre.",
  },
  {
    t: 29000,
    title: "Tout est prêt pour un contrôle.",
    text: "Une attestation PDF horodatée, avec son empreinte SHA-256, et une archive complète : attestation, fiche, pièces.",
  },
] as const;
const END_T = 38000;      // début du plan final
const FILM_T = 41500;     // fin du film
/* Plans fixes utilisés quand les animations sont réduites (un par chapitre, puis la fin). */
const POSTERS = [8400, 17900, 28400, 36800, FILM_T];

/* ── Plans de caméra ──
   obj : objet visé ; rect : zone à cadrer, relative au centre de l'objet [cx, cy, l, h] ;
   yaw : angle autour de l'objet (0 = de face), pitch : hauteur de la caméra. */
type Shot = { t: number; dur: number; obj: ObjName; rect: [number, number, number, number]; yaw: number; pitch: number };
const shots = (portrait: boolean): Shot[] => [
  // Ouverture : la fenêtre du tableau de bord, vue de côté et d'en haut.
  { t: -1, dur: 1, obj: "win", rect: [0, 0, 1700, 1200], yaw: 30, pitch: 14 },
  { t: 0, dur: 1900, obj: "win", rect: portrait ? [250, -150, 600, 470] : [0, 0, 1130, 730], yaw: 9, pitch: 4 },
  { t: 2000, dur: 1200, obj: "win", rect: portrait ? [0, 10, 580, 630] : [0, 20, 980, 660], yaw: -7, pitch: 3 },
  { t: 6100, dur: 1300, obj: "win", rect: portrait ? [0, 10, 600, 560] : [0, 10, 860, 600], yaw: 8, pitch: 5 },
  // Vol vers le téléphone, puis lent tour autour de lui pendant que le client répond.
  { t: 8900, dur: 2300, obj: "phone", rect: portrait ? [0, -70, 410, 640] : [0, 0, 620, 830], yaw: 16, pitch: 6 },
  { t: 11900, dur: 6700, obj: "phone", rect: portrait ? [0, -70, 400, 630] : [0, 0, 600, 810], yaw: -11, pitch: 2 },
  // L'analyse de risque, puis l'étiquette.
  // (de près d'abord : la caméra descend le long des critères à mesure qu'ils sont renseignés)
  { t: 19000, dur: 2200, obj: "panel", rect: portrait ? [0, -110, 560, 560] : [30, -110, 720, 520], yaw: -13, pitch: 5 },
  { t: 21400, dur: 3100, obj: "panel", rect: portrait ? [0, 110, 560, 560] : [30, 100, 720, 520], yaw: 6, pitch: 3 },
  { t: 24700, dur: 1500, obj: "label", rect: portrait ? [0, 0, 440, 420] : [-150, -100, 900, 780], yaw: 7, pitch: 4 },
  // L'attestation, puis l'archive.
  { t: 29000, dur: 2400, obj: "sheet", rect: portrait ? [0, 0, 880, 1180] : [0, 0, 1100, 1180], yaw: 17, pitch: 9 },
  { t: 31500, dur: 1800, obj: "sheet", rect: portrait ? [0, -40, 860, 1150] : [0, 0, 1100, 1170], yaw: -7, pitch: 4 },
  { t: 33400, dur: 1600, obj: "zip", rect: portrait ? [0, -80, 500, 560] : [0, -215, 1050, 780], yaw: -3, pitch: 4 },
  // Plan final : toute la chaîne, vue de loin.
  { t: END_T, dur: 2800, obj: "panel", rect: portrait ? [-310, 0, 3700, 1500] : [-310, 0, 6000, 1500], yaw: portrait ? 52 : 34, pitch: 13 },
];

/* ── Scénario : ce qui se passe à l'écran, et quand (ms) ── */
const NAME = "Camille Rousseau";
const EMAIL = "camille.rousseau@example.com";
const T = {
  cursorIn: 900, clickNew: 1900, scrForm: 2050,
  role: 2750, type: 3150, nameStart: 3350, emailStart: 4450, clickCreate: 5950, scrDone: 6150,
  clickShare: 7700, sent: 8100, chipStart: 8300, chipEnd: 10950,
  notif: 10900, tapNotif: 11800, unlock: 11950,
  form: [12700, 13900, 15100, 16300, 17500],
  rows: 21300, rowGap: 430, badge: 24500,
  label: 24900, bars: 25300, pointer: 26500, todo: 27100,
  sheet: 29500, zip: 33800, zipGap: 480,
  endCard: 39700,
} as const;
const FORM_STEPS = [0, 1, 2, 3, 5, 6];

const ROWS = [
  { k: "Résidence fiscale", v: "France / Union Européenne" },
  { k: "Source des fonds", v: "Épargne personnelle (justifiée)" },
  { k: "Montage financier", v: "Prêt bancaire UE classique" },
  { k: "Mode de paiement", v: "Virement bancaire UE" },
  { k: "Personne sous gel des avoirs ?", v: "Non" },
  { k: "Liste de sanctions internationales ?", v: "Non" },
  { k: "Personne politiquement exposée ?", v: "Non" },
];
const DOSSIERS = [
  { i: "ST", n: "SCI Les Tilleuls", d: "Personne morale", r: "VENDEUR", b: "Vigilance renforcée", c: "amber" },
  { i: "ML", n: "Marc Lefèvre", d: "Personne physique", r: "ACQUÉREUR", b: "Conforme", c: "green" },
  { i: "NB", n: "Nadia Benali", d: "Personne physique", r: "ACQUÉREUR", b: "En attente du KYC", c: "violet" },
  { i: "JM", n: "Julien Mercier", d: "Personne physique", r: "VENDEUR", b: "Conforme", c: "green" },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const rad = (d: number) => (d * Math.PI) / 180;

/* Point local d'un objet (px, relatif à son centre) → point du décor. */
const toWorld = (o: Obj, lx: number, ly: number): [number, number, number] => [
  o.x + lx * Math.cos(rad(o.ry)),
  o.y + ly,
  o.z - lx * Math.sin(rad(o.ry)),
];

/* Centre d'un élément dans le repère de `root` (mise en page, avant toute transformation). */
const centerIn = (el: HTMLElement | null, root: HTMLElement | null): [number, number] => {
  if (!el || !root) return [0, 0];
  let x = 0, y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return [x + el.offsetWidth / 2, y + el.offsetHeight / 2];
};

/* Pose un objet dans le décor. `h` sert au centrage ; `fixed` impose aussi la hauteur. */
const place = (o: Obj, w: number, h: number, fixed = true): React.CSSProperties => ({
  width: w,
  ...(fixed ? { height: h } : null),
  transform: `translate3d(${o.x - w / 2}px, ${o.y - h / 2}px, ${o.z}px) rotateY(${o.ry}deg)`,
});
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function DemoModal({ open, onClose, onCta }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<(HTMLElement | null)[]>([]);
  // Fenêtre du tableau de bord
  const bodyRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLElement>(null);
  const scrRefs = useRef<(HTMLElement | null)[]>([]);
  const btnNewRef = useRef<HTMLSpanElement>(null);
  const roleRef = useRef<HTMLSpanElement>(null);
  const typeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const emailRef = useRef<HTMLSpanElement>(null);
  const btnCreateRef = useRef<HTMLSpanElement>(null);
  const btnShareRef = useRef<HTMLSpanElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  // Téléphone
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  // Analyse, étiquette, attestation, archive
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const todoRef = useRef<HTMLParagraphElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const zipRef = useRef<HTMLDivElement>(null);
  const zipRowRefs = useRef<(HTMLElement | null)[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const [chapter, setChapter] = useState(0);      // 0 à 3, 4 = plan final
  const [playing, setPlaying] = useState(() => !prefersReduced());
  const [reduced, setReduced] = useState(prefersReduced);
  const [phoneReady, setPhoneReady] = useState(false);
  const [step, setStep] = useState(0);
  const [sheetOn, setSheetOn] = useState(false);

  // Commandes du moteur, appelées par les boutons.
  const api = useRef<{ step: (d: number) => void; toggle: () => void; replay: () => void }>({
    step: () => {}, toggle: () => {}, replay: () => {},
  });

  // Toujours la dernière version de onClose, sans relancer les effets à chaque rendu du parent.
  const closeFn = useRef(onClose);
  useEffect(() => { closeFn.current = onClose; }, [onClose]);

  /* ── Dialogue avec le formulaire (prêt, étape, thème clair) ── */
  useEffect(() => {
    if (!open) return;
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "klaris-demo-ready") setPhoneReady(true);
    };
    window.addEventListener("message", onMsg);
    iframeRef.current?.contentWindow?.postMessage({ type: "klaris-demo-ping" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, [open]);
  useEffect(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ type: "klaris-demo-theme", theme: "light" }, "*");
    w.postMessage({ type: "klaris-demo-step", step }, "*");
  }, [step, phoneReady]);

  /* ── Fenêtre modale : défilement de la page bloqué, Échap, focus ── */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const before = document.activeElement as HTMLElement | null;
    // Filet de sécurité : Échap ferme la démo même si le focus en est sorti.
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeFn.current(); };
    window.addEventListener("keydown", onEsc);
    // Le focus va sur la fenêtre elle-même : espace met en pause, Tab mène aux boutons.
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
      before?.focus?.({ preventScroll: true });
    };
  }, [open]);

  /* ── Moteur du film ── */
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current, view = viewRef.current, world = worldRef.current;
    if (!root || !view || !world) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let still = mq.matches;          // animations réduites : plans fixes
    let t = still ? POSTERS[0] : 0;  // heure du film
    let run = !still;
    let raf = 0;
    let lastTs = 0;
    let lastChapter = -1, lastStep = -1, lastName = -1, lastEmail = -1, lastTone = "";
    let sheetAsked = false;

    /* Mise en page : origine de la scène, plans résolus, repères du curseur. */
    type Pose = { fx: number; fy: number; fz: number; yaw: number; pitch: number; s: number };
    let poses: (Pose & { t: number; dur: number })[] = [];
    let ox = 0, oy = 0;
    const pts: Record<string, [number, number]> = {};
    let chipA: [number, number, number] = [0, 0, 0];
    const chipB = toWorld(WORLD.phone, 0, -110);
    chipB[2] += 40;

    const measure = () => {
      const vw = view.clientWidth, vh = view.clientHeight;
      const portrait = vw < 820 || vw / vh < 0.9;
      root.toggleAttribute("data-portrait", portrait);
      const top = 62;
      const bottom = portrait ? (root.querySelector<HTMLElement>(".dm-console")?.offsetHeight ?? 200) + 26 : 150;
      const availW = vw * (portrait ? 0.97 : 0.92), availH = (vh - top - bottom) * 0.96;
      ox = vw / 2; oy = top + (vh - top - bottom) / 2;
      view.style.perspectiveOrigin = `${ox}px ${oy}px`;
      poses = shots(portrait).map((sh) => {
        const o = WORLD[sh.obj];
        const [fx, fy, fz] = toWorld(o, sh.rect[0], sh.rect[1]);
        return {
          t: sh.t, dur: sh.dur, fx, fy, fz,
          yaw: o.ry + sh.yaw, pitch: sh.pitch,
          s: Math.min(availW / sh.rect[2], availH / sh.rect[3]),
        };
      });
      const body = bodyRef.current;
      pts.start = [WIN_W * 0.46, (WIN_H - 40) * 0.72];
      pts.new = centerIn(btnNewRef.current, body);
      pts.role = centerIn(roleRef.current, body);
      pts.type = centerIn(typeRef.current, body);
      pts.name = centerIn(nameRef.current, body);
      pts.email = centerIn(emailRef.current, body);
      pts.create = centerIn(btnCreateRef.current, body);
      pts.share = centerIn(btnShareRef.current, body);
      chipA = toWorld(WORLD.win, pts.share[0] - WIN_W / 2, pts.share[1] + 40 - WIN_H / 2);
      chipA[2] += 30;
    };

    /* Trajet du curseur : [heure d'arrivée, durée du trajet, point visé]. */
    const CURSOR: [number, number, string][] = [
      [T.cursorIn, 1, "start"], [T.clickNew - 100, 800, "new"],
      [T.role - 60, 420, "role"], [T.type - 60, 300, "type"],
      [T.nameStart - 40, 180, "name"], [T.emailStart - 40, 160, "email"],
      [T.clickCreate - 60, 340, "create"], [T.clickShare - 80, 720, "share"],
    ];
    const CLICKS = [T.clickNew, T.role, T.type, T.nameStart, T.emailStart, T.clickCreate, T.clickShare];

    /* Chapitre en cours d'après l'heure du film (CHAPTERS.length = plan final). */
    const chapterAt = () => {
      if (t >= END_T) return CHAPTERS.length;
      let ch = 0;
      while (ch < CHAPTERS.length - 1 && CHAPTERS[ch + 1].t <= t) ch += 1;
      return ch;
    };

    const flag = (el: Element | null | undefined, on: boolean) => {
      if (el && el.hasAttribute("data-on") !== on) el.toggleAttribute("data-on", on);
    };

    const render = (now: number) => {
      /* ── Caméra ── */
      let i = 0;
      while (i < poses.length - 1 && poses[i + 1].t <= t) i += 1;
      const b = poses[i], a = poses[Math.max(0, i - 1)];
      const k = still ? 1 : seg(t, b.t, b.t + b.dur);
      const e = easeInOut(k);
      const dist = Math.hypot(b.fx - a.fx, b.fz - a.fz);
      const far = clamp(dist / 900);            // grand déplacement : la caméra prend du recul et s'incline
      const arc = Math.sin(Math.PI * e) * far;
      // Respiration : la caméra n'est jamais tout à fait immobile.
      const live = still ? 0 : 1;
      const yaw = lerp(a.yaw, b.yaw, e) + live * 1.6 * Math.sin(now / 2700);
      const pitch = lerp(a.pitch, b.pitch, e) + arc * 5 + live * 0.8 * Math.sin(now / 3300 + 1);
      const roll = arc * 2.6 * Math.sign(b.fx - a.fx);
      const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) * (1 - 0.24 * arc) * (1 + live * 0.012 * Math.sin(now / 2300));
      const fx = lerp(a.fx, b.fx, e), fy = lerp(a.fy, b.fy, e) - arc * 40, fz = lerp(a.fz, b.fz, e);
      const dolly = PERSPECTIVE * (1 - 1 / s);
      world.style.transform =
        `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0) translateZ(${dolly.toFixed(1)}px) ` +
        `rotateZ(${(-roll).toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg) rotateY(${(-yaw).toFixed(3)}deg) ` +
        `translate3d(${(-fx).toFixed(1)}px, ${(-fy).toFixed(1)}px, ${(-fz).toFixed(1)}px)`;

      /* ── Alternance sombre / clair ── */
      const light = clamp(
        easeInOut(seg(t, CHAPTERS[1].t + 700, CHAPTERS[1].t + 2000)) - easeInOut(seg(t, CHAPTERS[2].t + 300, CHAPTERS[2].t + 1700)) +
        easeInOut(seg(t, CHAPTERS[3].t + 300, CHAPTERS[3].t + 1700)) - easeInOut(seg(t, END_T + 200, END_T + 1700)),
      );
      if (lightRef.current) lightRef.current.style.opacity = light.toFixed(3);
      const tone = light > 0.5 ? "light" : "dark";
      if (tone !== lastTone) { lastTone = tone; root.setAttribute("data-tone", tone); }

      /* ── Chapitre et barre de progression ── */
      const ch = chapterAt();
      if (ch !== lastChapter) { lastChapter = ch; setChapter(ch); }
      segRefs.current.forEach((el, n) => {
        if (!el) return;
        const t0 = CHAPTERS[n].t, t1 = n < CHAPTERS.length - 1 ? CHAPTERS[n + 1].t : END_T;
        el.style.transform = `scaleX(${seg(t, t0, t1).toFixed(4)})`;
      });

      /* ── Chapitre 1 : le tableau de bord ── */
      flag(scrRefs.current[0], t < T.scrForm);
      flag(scrRefs.current[1], t >= T.scrForm && t < T.scrDone);
      flag(scrRefs.current[2], t >= T.scrDone);
      flag(btnNewRef.current, t >= T.clickNew - 40 && t < T.clickNew + 160);
      flag(roleRef.current, t >= T.role);
      flag(typeRef.current, t >= T.type);
      flag(btnCreateRef.current, t >= T.clickCreate - 40 && t < T.clickCreate + 160);
      flag(btnShareRef.current, t >= T.clickShare);
      flag(sentRef.current, t >= T.sent);
      const nName = clamp(Math.floor((t - T.nameStart) / 58), 0, NAME.length);
      if (nName !== lastName && nameRef.current) { lastName = nName; nameRef.current.textContent = NAME.slice(0, nName); }
      flag(nameRef.current, t >= T.nameStart && t < T.emailStart);
      const nEmail = clamp(Math.floor((t - T.emailStart) / 38), 0, EMAIL.length);
      if (nEmail !== lastEmail && emailRef.current) { lastEmail = nEmail; emailRef.current.textContent = EMAIL.slice(0, nEmail); }
      flag(emailRef.current, t >= T.emailStart && t < T.clickCreate);

      const cur = cursorRef.current;
      if (cur) {
        let c = 0;
        while (c < CURSOR.length - 1 && CURSOR[c + 1][0] - CURSOR[c + 1][1] <= t) c += 1;
        const to = pts[CURSOR[c][2]], from = pts[CURSOR[Math.max(0, c - 1)][2]];
        const ke = easeInOut(seg(t, CURSOR[c][0] - CURSOR[c][1], CURSOR[c][0]));
        const cx = lerp(from[0], to[0], ke), cy = lerp(from[1], to[1], ke) - Math.sin(Math.PI * ke) * 14;
        const press = CLICKS.reduce((m, tc) => Math.max(m, Math.sin(Math.PI * seg(t, tc - 90, tc + 150))), 0);
        cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${(1 - 0.14 * press).toFixed(3)})`;
        cur.style.opacity = (seg(t, T.cursorIn - 300, T.cursorIn) * (1 - seg(t, T.sent, T.sent + 400))).toFixed(3);
        const rp = rippleRef.current;
        if (rp) {
          const last = CLICKS.reduce((m, tc) => (tc <= t ? tc : m), -9999);
          const r = seg(t, last, last + 520);
          rp.style.opacity = (r > 0 && r < 1 ? 0.55 * (1 - r) : 0).toFixed(3);
          rp.style.transform = `translate(-50%, -50%) scale(${(0.3 + 2.4 * easeOut(r)).toFixed(3)})`;
        }
      }

      /* ── Le lien part vers le téléphone (la caméra le suit) ── */
      const chip = chipRef.current;
      if (chip) {
        const f = seg(t, T.chipStart, T.chipEnd);
        const ce = easeInOut(f);
        const mx = (chipA[0] + chipB[0]) / 2, my = Math.min(chipA[1], chipB[1]) - 210, mz = Math.max(chipA[2], chipB[2]) + 330;
        const q = (p0: number, p1: number, p2: number) => (1 - ce) * (1 - ce) * p0 + 2 * (1 - ce) * ce * p1 + ce * ce * p2;
        const o = Math.min(seg(f, 0, 0.08), 1 - seg(f, 0.9, 1));
        chip.style.opacity = o.toFixed(3);
        chip.style.visibility = o < 0.01 ? "hidden" : "visible";
        // Toujours face à la caméra.
        chip.style.transform =
          `translate3d(${(q(chipA[0], mx, chipB[0]) - CHIP_W / 2).toFixed(1)}px, ${(q(chipA[1], my, chipB[1]) - CHIP_H / 2).toFixed(1)}px, ${q(chipA[2], mz, chipB[2]).toFixed(1)}px) ` +
          `rotateY(${yaw.toFixed(2)}deg) rotateX(${(-pitch).toFixed(2)}deg) scale(${lerp(0.8, 1.5, Math.sin(Math.PI * ce)).toFixed(3)})`;
      }

      /* ── Chapitre 2 : le téléphone ── */
      flag(notifRef.current, t >= T.notif);
      flag(lockRef.current, t < T.unlock);
      if (notifRef.current) notifRef.current.toggleAttribute("data-tap", t >= T.tapNotif && t < T.unlock);
      let st = 0;
      T.form.forEach((tf, n) => { if (t >= tf) st = n + 1; });
      if (FORM_STEPS[st] !== lastStep) { lastStep = FORM_STEPS[st]; setStep(lastStep); }

      /* ── Chapitre 3 : l'analyse, puis l'étiquette ── */
      rowRefs.current.forEach((el, n) => flag(el, t >= T.rows + n * T.rowGap));
      flag(badgeRef.current, t >= T.badge);
      flag(labelRef.current, t >= T.label);
      barRefs.current.forEach((el, n) => {
        flag(el, t >= T.bars + n * 190);
        if (el) el.toggleAttribute("data-dim", n > 0 && t >= T.pointer);
      });
      flag(pointerRef.current, t >= T.pointer);
      flag(todoRef.current, t >= T.todo);

      /* ── Chapitre 4 : l'attestation et l'archive ── */
      flag(sheetRef.current, t >= T.sheet);
      flag(zipRef.current, t >= T.zip);
      zipRowRefs.current.forEach((el, n) => flag(el, t >= T.zip + 350 + n * T.zipGap));
      // Le PDF est chargé tôt (dès le formulaire en place) : il est prêt même si l'on saute au chapitre 4.
      if (!sheetAsked && t >= 3000) { sheetAsked = true; setSheetOn(true); }

      /* ── Fin ── */
      flag(endRef.current, t >= T.endCard);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastTs ? Math.min(80, now - lastTs) : 0;
      lastTs = now;
      if (run && !document.hidden) {
        t += dt;
        if (t >= FILM_T) { t = FILM_T; run = false; setPlaying(false); }
      }
      render(now);
    };

    /* Coupe franche (changement de chapitre) : un court fondu masque le saut de caméra. */
    const cut = () => {
      cutRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: "ease-out" });
    };
    api.current = {
      // Chapitre précédent ou suivant, d'après l'heure du film (et non l'affichage, qui
      // peut avoir une image de retard quand on appuie vite).
      step: (d) => {
        const n = clamp(chapterAt() + d, 0, CHAPTERS.length);
        t = still ? POSTERS[n] : n === CHAPTERS.length ? END_T : CHAPTERS[n].t;
        if (!still && n < CHAPTERS.length) { run = true; setPlaying(true); }
        cut();
      },
      toggle: () => {
        if (still) return;
        if (t >= FILM_T) { t = 0; cut(); }
        run = !run; setPlaying(run);
      },
      replay: () => { t = still ? POSTERS[0] : 0; run = !still; setPlaying(run); cut(); },
    };

    const onResize = () => measure();
    const onMq = () => {
      still = mq.matches; setReduced(still);
      if (still) { run = false; setPlaying(false); t = POSTERS[Math.max(0, lastChapter)]; }
    };
    measure();
    raf = requestAnimationFrame(frame);
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", onMq);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onMq);
      api.current = { step: () => {}, toggle: () => {}, replay: () => {} };
    };
  }, [open]);

  /* ── Clavier : Échap, espace, flèches, et le focus reste dans la fenêtre ── */
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") return; // géré au niveau de la fenêtre
    if (e.key === "ArrowRight") { api.current.step(1); return; }
    if (e.key === "ArrowLeft") { api.current.step(-1); return; }
    if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); api.current.toggle(); return; }
    if (e.key === "Tab") {
      // Le focus tourne entre les boutons de la démo, sans jamais en sortir.
      const f = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]):not([tabindex='-1'])") ?? []);
      if (!f.length) return;
      e.preventDefault();
      const i = f.indexOf(document.activeElement as HTMLElement);
      const next = i < 0 ? (e.shiftKey ? f.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length;
      f[next].focus();
    }
  }, []);

  if (!open) return null;

  const ended = chapter >= CHAPTERS.length;
  const cap = CHAPTERS[Math.min(chapter, CHAPTERS.length - 1)];

  return (
    <div
      ref={rootRef}
      className="dm"
      role="dialog"
      aria-modal="true"
      aria-label="Démo guidée de Klaris"
      tabIndex={-1}
      data-tone="dark"
      onKeyDown={onKeyDown}
    >
      <div className="dm-bg" aria-hidden="true" />
      <div ref={lightRef} className="dm-bg dm-bg--light" aria-hidden="true" />

      {/* ───────── Le décor en 3D ───────── */}
      <div ref={viewRef} className="dm-view" aria-hidden="true" onClick={() => api.current.toggle()}>
        <div ref={worldRef} className="dm-world">
          {/* Grands chiffres en fond de décor : ils donnent la profondeur pendant les vols. */}
          {(["win", "phone", "panel", "sheet"] as const).map((o, i) => (
            <span
              key={o}
              className="dm-num"
              style={{ transform: `translate3d(${WORLD[o].x - 340}px, ${-640}px, ${WORLD[o].z - 620}px) rotateY(${WORLD[o].ry * 0.5}deg)` }}
            >
              {i + 1}
            </span>
          ))}

          {/* 1 · Tableau de bord */}
          <div className="dm-obj dm-win" style={place(WORLD.win, WIN_W, WIN_H)}>
            <div className="dm-win__bar"><i /><i /><i /><span>klaris-app.fr/dashboard</span></div>
            <div ref={bodyRef} className="dm-win__body">
              <section ref={(el) => { scrRefs.current[0] = el; }} className="dm-scr" data-on="">
                <div className="dm-app__nav">
                  <KlarisLogo size={26} /><b>Klaris</b>
                  <span data-cur="">Dossiers</span><span>Cartographie</span><span>Intégrations</span><span>Abonnement</span>
                </div>
                <div className="dm-app__head">
                  <div>
                    <h3>Tableau de bord</h3>
                    <p>4 dossiers KYC · mise à jour à l&apos;instant</p>
                  </div>
                  <span ref={btnNewRef} className="dm-btn"><Plus width={18} height={18} strokeWidth={2.6} />Nouveau dossier</span>
                </div>
                <ul className="dm-rows">
                  {DOSSIERS.map((d) => (
                    <li key={d.n}>
                      <span className="dm-rows__av">{d.i}</span>
                      <div>
                        <b>{d.n}</b>
                        <small>{d.d} · <em data-r={d.r}>{d.r}</em></small>
                      </div>
                      <span className="dm-badge" data-c={d.c}>{d.b}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section ref={(el) => { scrRefs.current[1] = el; }} className="dm-scr dm-scr--form">
                <h3>Créer un dossier</h3>
                <label>Rôle dans la transaction</label>
                <div className="dm-opts">
                  <span><b>Vendeur</b><small>Cède le bien</small></span>
                  <span ref={roleRef}><b>Acquéreur</b><small>Achète le bien</small></span>
                </div>
                <label>Type de client</label>
                <div className="dm-opts">
                  <span ref={typeRef}><b>Personne physique</b></span>
                  <span><b>Personne morale</b></span>
                </div>
                <div className="dm-two">
                  <div>
                    <label>Nom et prénom du client</label>
                    <div className="dm-input"><span ref={nameRef} /></div>
                  </div>
                  <div>
                    <label>Email du client</label>
                    <div className="dm-input"><span ref={emailRef} /></div>
                  </div>
                </div>
                <span ref={btnCreateRef} className="dm-btn dm-btn--wide">Créer le dossier et générer le lien</span>
              </section>

              <section ref={(el) => { scrRefs.current[2] = el; }} className="dm-scr dm-scr--done">
                <div className="dm-ok"><span><Check width={20} height={20} strokeWidth={3} /></span>Dossier créé</div>
                <h3>Le lien KYC pour {NAME} est prêt.</h3>
                <span className="dm-pill">Côté acquéreur</span>
                <div className="dm-link"><Link2 width={18} height={18} /><span>klaris-app.fr/kyc/…</span><b>Copier</b></div>
                <label>Partager via</label>
                <div className="dm-share">
                  <span>Email</span>
                  <span ref={btnShareRef}>WhatsApp</span>
                  <span>Message</span>
                </div>
                <div ref={sentRef} className="dm-sent"><Check width={16} height={16} strokeWidth={3} />Lien envoyé depuis votre messagerie</div>
              </section>

              <div ref={cursorRef} className="dm-cursor">
                <i ref={rippleRef} />
                <MousePointer2 width={30} height={30} fill="#17123A" stroke="#fff" strokeWidth={1.6} />
              </div>
            </div>
          </div>

          {/* Le lien, en vol entre le tableau de bord et le téléphone */}
          <div ref={chipRef} className="dm-chip" style={{ width: CHIP_W, height: CHIP_H }}>
            <Link2 width={19} height={19} /><span>klaris-app.fr/kyc/…</span>
          </div>

          {/* 2 · Téléphone du client */}
          <div className="dm-obj dm-phone" style={place(WORLD.phone, PHONE_W, PHONE_H)}>
            <div className="dm-phone__screen" style={{ width: SCREEN_W, height: SCREEN_H }}>
              <iframe
                ref={iframeRef}
                src="/kyc/demo"
                title="Le formulaire reçu par le client (exemple fictif)"
                tabIndex={-1}
                scrolling="no"
                style={{ width: SCREEN_W, height: SCREEN_H, border: 0, pointerEvents: "none" }}
              />
              <div ref={lockRef} className="dm-lock" data-on="">
                <div className="dm-lock__time">9:41</div>
                <div ref={notifRef} className="dm-lock__notif">
                  <span className="dm-lock__app"><MessageSquare width={24} height={24} strokeWidth={2.2} /></span>
                  <div>
                    <div className="dm-lock__from"><b>Marie Lefort</b><span>maintenant</span></div>
                    <p>Bonjour, pour votre projet immobilier, je vous invite à remplir ce formulaire : klaris-app.fr/kyc/…</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 · Analyse de risque */}
          <div className="dm-obj dm-panel" style={place(WORLD.panel, PANEL_W, PANEL_H)}>
            <div className="dm-panel__head">
              <span className="dm-rows__av">CR</span>
              <div>
                <b>{NAME}</b>
                <small>Personne physique · <em data-r="ACQUÉREUR">ACQUÉREUR</em></small>
              </div>
              <span className="dm-badge dm-badge--swap">
                <span data-c="violet">À analyser</span>
                <span ref={badgeRef} data-c="green">Conforme</span>
              </span>
            </div>
            <div className="dm-panel__files"><FileText width={17} height={17} />Pièces justificatives reçues <b>3</b></div>
            <h4>Analyse des risques</h4>
            <ul className="dm-crit">
              {ROWS.map((r, i) => (
                <li key={r.k} ref={(el) => { rowRefs.current[i] = el; }}>
                  <span>{r.k}</span>
                  <b><i><Check width={13} height={13} strokeWidth={3.4} /></i>{r.v}</b>
                </li>
              ))}
            </ul>
          </div>

          {/* L'étiquette de vigilance */}
          <div ref={labelRef} className="dm-obj dm-label" style={place(WORLD.label, LABEL_W, LABEL_H, false)}>
            <div className="dm-label__k">Niveau de vigilance du dossier</div>
            <div className="dm-label__v">{LEVELS[0].name}</div>
            <div className="dm-scale">
              {LEVELS.map((l, i) => (
                <div key={l.n} className="dm-scale__row">
                  <span ref={(el) => { barRefs.current[i] = el; }} className="dm-scale__bar" data-level={l.n}>{l.name}</span>
                  {i === 0 && <span ref={pointerRef} className="dm-scale__pointer">1</span>}
                </div>
              ))}
            </div>
            <p ref={todoRef} className="dm-label__todo">Marche à suivre : traiter normalement, archiver cinq ans.</p>
          </div>

          {/* 4 · Attestation */}
          <div ref={sheetRef} className="dm-obj dm-sheet" style={place(WORLD.sheet, SHEET_W, SHEET_H)}>
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

          {/* L'archive du dossier */}
          <div ref={zipRef} className="dm-obj dm-zip" style={place(WORLD.zip, ZIP_W, ZIP_H, false)}>
            <div className="dm-zip__head"><span><FolderArchive width={22} height={22} /></span>Dossier complet (ZIP)</div>
            <ul>
              {["attestation-rousseau-camille.pdf", "fiche-kyc-rousseau-camille.pdf", "pieces/ · 3 fichiers"].map((f, i) => (
                <li key={f} ref={(el) => { zipRowRefs.current[i] = el; }}><FileText width={17} height={17} />{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div ref={cutRef} className="dm-cut" aria-hidden="true" />

      {/* ───────── Barre du haut : marque, progression, fermer ───────── */}
      <header className="dm-top">
        <div className="dm-top__brand"><KlarisLogo size={26} /><span>Démo guidée</span></div>
        <div className="dm-segs" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <span key={c.title}><i ref={(el) => { segRefs.current[i] = el; }} /></span>
          ))}
        </div>
        <button type="button" className="dm-icon" onClick={onClose} aria-label="Fermer la démo">
          <X width={20} height={20} />
        </button>
      </header>

      {/* ───────── Légende et commandes ───────── */}
      <div className="dm-console" data-hidden={ended ? "" : undefined}>
        <div className="dm-console__text" key={chapter} aria-live="polite">
          <span className="dm-console__n" aria-hidden="true">
            {Math.min(chapter, CHAPTERS.length - 1) + 1}<small>/{CHAPTERS.length}</small>
          </span>
          <h2>{cap.title}</h2>
          <p>{cap.text}</p>
        </div>
        <div className="dm-console__ctl">
          <button type="button" className="dm-icon" onClick={() => api.current.step(-1)} disabled={chapter === 0} aria-label="Chapitre précédent">
            <ChevronLeft width={20} height={20} />
          </button>
          {!reduced && (
            <button type="button" className="dm-icon dm-icon--main" onClick={() => api.current.toggle()} aria-label={playing ? "Mettre en pause" : "Lire"}>
              {playing ? <Pause width={18} height={18} fill="currentColor" strokeWidth={0} /> : <Play width={18} height={18} fill="currentColor" strokeWidth={0} />}
            </button>
          )}
          <button type="button" className="dm-icon" onClick={() => api.current.step(1)} aria-label={chapter === CHAPTERS.length - 1 ? "Aller à la fin" : "Chapitre suivant"}>
            <ChevronRight width={20} height={20} />
          </button>
        </div>
      </div>

      {/* ───────── Fin ───────── */}
      <div ref={endRef} className="dm-end kl-field" aria-hidden={ended ? undefined : true}>
        <h2>Essayez Klaris sur votre prochain dossier.</h2>
        <p>14 jours gratuits, aucun prélèvement avant le 14ᵉ jour, sans engagement.</p>
        <div>
          <button type="button" className="kl-btn kl-btn--onfield" tabIndex={ended ? 0 : -1} onClick={() => { onClose(); onCta?.(); }}>
            Créer mon compte
          </button>
          <button type="button" className="kl-btn kl-btn--ghost dm-end__again" tabIndex={ended ? 0 : -1} onClick={() => { api.current.replay(); rootRef.current?.focus({ preventScroll: true }); }}>
            <RotateCcw width={15} height={15} />
            Revoir la démo
          </button>
        </div>
      </div>
    </div>
  );
}
