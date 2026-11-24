// components/landing/HeroMark.tsx — Le K et ses cinq étiquettes
//
// Le logo Klaris en grand : un fût d'encre et cinq barres en escalier. Le fût pousse,
// les barres se posent (on lit le K), puis un filet relie chaque barre à son
// étiquette : les cinq barres du K sont les cinq obligations LCB-FT (identifier,
// évaluer, conserver, déclarer, justifier).
//
// Survol (ordinateur) : toute la ligne réagit, la barre comme le texte. La barre
// avance et s'allume, l'étiquette prend sa couleur, les autres s'effacent, et un
// aperçu de ce que fait Klaris pour cette obligation s'affiche sous le K.
// Téléphone : pas de survol, la légende reste ; chaque ligne reste un lien.
//
// Clic : défilement fait ici (pas par l'ancre du navigateur), pour que chaque clic
// marche, même deux fois de suite vers la même cible, et que le sujet soit bien
// cadré : centré s'il tient dans l'écran, sinon calé sous la barre de navigation.
// Une ligne du tableau des obligations s'allume un instant dans la couleur de la barre.
//
// Animation d'entrée en CSS (landing.css, bloc « Le K et ses étiquettes ») : rien ne
// bloque l'affichage, et « réduire les animations » montre directement l'état final.

"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, ArrowRight } from "lucide-react";

/* Décalage de chaque barre (en unités du logo, viewBox 100) et couleur, comme dans
   components/ui/KlarisLogo.tsx : les bords gauches dessinent le « < » du K.
   ct : la même teinte, un peu plus soutenue, pour le texte. */
const BARS: Array<{ off: number; c: string; ct: string; label: string; href: string; text: string }> = [
  { off: 30, c: "#2F5BFF", ct: "#1F45E0", label: "Identifier le client", href: "#how", text: "Votre client remplit sa fiche en ligne, sans compte. Ses pièces arrivent en photo, chiffrées." },
  { off: 18, c: "#5468FF", ct: "#3F50E6", label: "Évaluer le risque", href: "#vigilance", text: "Klaris en déduit le niveau de vigilance sur quatre, avec la conduite à tenir." },
  { off: 5, c: "#9A6BEB", ct: "#7B4FD6", label: "Conserver cinq ans", href: "#obligation-conserver", text: "Fiche, pièces et attestation archivées, chiffrées, hébergées dans l'UE. Suppression bloquée jusqu'au terme légal." },
  { off: 18, c: "#EC6A93", ct: "#D2457A", label: "Déclarer un soupçon", href: "#obligation-declarer", text: "Pour un dossier à risque, Klaris prépare le brouillon de déclaration à déposer sur ERMES." },
  { off: 30, c: "#FF6A4D", ct: "#E5502F", label: "Justifier au contrôle", href: "#obligation-justifier", text: "Attestation horodatée et archive du dossier, prêtes à présenter en cas de contrôle." },
];

/** Fait défiler jusqu'à la cible et la cadre ; allume une ligne de tableau visée. */
function goTo(e: React.MouseEvent<HTMLAnchorElement>, href: string, color: string) {
  const el = document.querySelector<HTMLElement>(href);
  if (!el) return;
  e.preventDefault();
  const isRow = el.tagName === "TR";
  /* Une section se cadre sur son contenu (sans ses grandes marges intérieures). */
  const box = isRow ? el : (el.querySelector<HTMLElement>(".kl-wrap") ?? el);
  const nav = (document.querySelector(".kl-nav__bar")?.getBoundingClientRect().bottom ?? 72) + 12;
  const r = box.getBoundingClientRect();
  const avail = window.innerHeight - nav;
  const top = r.height <= avail - 48
    ? window.scrollY + r.top - nav - (avail - r.height) / 2
    : window.scrollY + r.top - nav - 16;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  history.replaceState(null, "", href);
  if (isRow) {
    el.style.setProperty("--flash", color);
    el.removeAttribute("data-flash");
    void el.offsetWidth; // relance l'animation si on reclique
    el.setAttribute("data-flash", "");
    window.setTimeout(() => el.removeAttribute("data-flash"), 2200);
  }
}

export default function HeroMark() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      className="hm"
      role="group"
      aria-label="Les cinq obligations LCB-FT, dessinées par le logo Klaris"
      data-active={active === null ? undefined : ""}
      onPointerLeave={() => setActive(null)}
    >
      <div className="hm-k">
        <span className="hm-stem" aria-hidden="true" />
        <ol className="hm-bars">
          {BARS.map((b, i) => (
            <li
              key={b.label}
              data-on={active === i ? "" : undefined}
              style={{ "--i": i, "--off": b.off, "--c": b.c, "--ct": b.ct } as React.CSSProperties}
            >
              <span className="hm-bar" aria-hidden="true" />
              <span className="hm-lead" aria-hidden="true" />
              <Link
                href={b.href}
                className="hm-row"
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(i); }}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={(e) => goTo(e, b.href, b.c)}
              >
                <span className="hm-lab">
                  <span className="hm-lab__n">{String(i + 1).padStart(2, "0")}</span>
                  {b.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="hm-pv">
        <p className="hm-cap">Les cinq barres du K&nbsp;: vos cinq obligations LCB&#8209;FT.</p>
        {BARS.map((b, i) => (
          <div
            key={b.label}
            className="hm-card"
            data-on={active === i ? "" : undefined}
            aria-hidden={active !== i}
            style={{ "--c": b.c, "--ct": b.ct } as React.CSSProperties}
          >
            <div className="hm-card__vis" aria-hidden="true"><Vignette i={i} /></div>
            <div className="hm-card__txt">
              <b>{b.label}</b>
              <p>{b.text}</p>
              <span className="hm-card__go">Voir comment <ArrowRight width={14} height={14} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Petites vues du produit, en HTML léger (aucune image à charger). */
function Vignette({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="vn vn--fiche">
        <div className="vn-who"><span>CR</span><div><b>Camille Rousseau</b><small>Acquéreur</small></div></div>
        {["Identité", "Pièce d'identité", "Justificatifs"].map((s) => (
          <div key={s} className="vn-ok"><i><Check width={10} height={10} strokeWidth={3.4} /></i>{s}</div>
        ))}
      </div>
    );
  if (i === 1)
    return (
      <div className="vn vn--vig">
        {[["#16A06A", 58], ["#F2AE0A", 70], ["#F07A2B", 82], ["#E5483D", 94]].map(([c, w], k) => (
          <div key={k} className="vn-lv"><span style={{ width: `${w}%`, background: c as string, opacity: k === 0 ? 1 : 0.28 }} />{k === 0 && <b>1</b>}</div>
        ))}
        <small>Vigilance standard</small>
      </div>
    );
  if (i === 2)
    return (
      <div className="vn vn--keep">
        <div className="vn-zip">ZIP</div>
        <div className="vn-years"><span /></div>
        <small><Lock width={10} height={10} /> 5 ans · UE</small>
      </div>
    );
  if (i === 3)
    return (
      <div className="vn vn--decl">
        <span className="vn-pill">Brouillon</span>
        <i /><i /><i style={{ width: "62%" }} />
        <span className="vn-btn">PDF pour ERMES</span>
      </div>
    );
  return (
    <div className="vn vn--att">
      <span className="vn-band" />
      <b>Attestation</b>
      <div className="vn-lvl"><span>1</span><small>Vigilance standard</small></div>
      <i /><i style={{ width: "70%" }} />
    </div>
  );
}
