// components/landing/HeroMark.tsx — Le K et ses cinq étiquettes
//
// Le logo Klaris en grand : un fût d'encre et cinq barres en escalier. Le fût pousse,
// les barres se posent (on lit le K), puis un filet relie chaque barre à son
// étiquette : les cinq barres du K sont les cinq obligations LCB-FT (identifier,
// évaluer, conserver, déclarer, justifier). Le logo reste un logo ; le texte est à
// côté, en petit, et chaque étiquette mène à la section correspondante.
//
// Animation en CSS seulement (landing.css, bloc « Le K et ses étiquettes ») : rien ne
// bloque l'affichage, et « réduire les animations » montre directement l'état final.

import Link from "next/link";

/* Décalage de chaque barre (en unités du logo, viewBox 100) et couleur, comme dans
   components/ui/KlarisLogo.tsx : les bords gauches dessinent le « < » du K. */
const BARS: Array<{ off: number; c: string; label: string; href: string }> = [
  { off: 30, c: "#2F5BFF", label: "Identifier le client", href: "#how" },
  { off: 18, c: "#5468FF", label: "Évaluer le risque", href: "#vigilance" },
  { off: 5, c: "#9A6BEB", label: "Conserver cinq ans", href: "#features" },
  { off: 18, c: "#EC6A93", label: "Déclarer un soupçon", href: "#features" },
  { off: 30, c: "#FF6A4D", label: "Justifier au contrôle", href: "#features" },
];

export default function HeroMark() {
  return (
    <div className="hm" role="group" aria-label="Les cinq obligations LCB-FT, dessinées par le logo Klaris">
      <div className="hm-k">
        <span className="hm-stem" aria-hidden="true" />
        <ol className="hm-bars">
          {BARS.map((b, i) => (
            <li key={b.label} style={{ "--i": i, "--off": b.off, "--c": b.c } as React.CSSProperties}>
              <span className="hm-bar" aria-hidden="true" />
              <span className="hm-lead" aria-hidden="true" />
              <Link href={b.href} className="hm-lab">
                <span className="hm-lab__n">{String(i + 1).padStart(2, "0")}</span>
                {b.label}
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <p className="hm-cap">Les cinq barres du K&nbsp;: vos cinq obligations LCB&#8209;FT.</p>
    </div>
  );
}
