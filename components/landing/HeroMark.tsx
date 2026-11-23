// components/landing/HeroMark.tsx — Le K qui se déploie
//
// Le logo Klaris en grand : un fût d'encre et cinq barres en escalier. À l'arrivée, le
// fût pousse, les barres se posent à leur place (on lit le K), puis chacune s'étire et
// révèle une des cinq obligations LCB-FT. Les cinq barres du K sont les cinq
// obligations : identifier, évaluer, conserver, déclarer, justifier.
// Chaque barre mène à l'obligation correspondante, plus bas dans la page.
//
// Animation en CSS seulement (landing.css, bloc « Le K qui se déploie ») : rien ne
// bloque l'affichage, et « réduire les animations » montre directement l'état final.

import Link from "next/link";

/* Décalage de chaque barre (en unités du logo, viewBox 100) et couleur, comme dans
   components/ui/KlarisLogo.tsx : les bords gauches dessinent le « < » du K. */
const BARS: Array<{ off: number; c: string; label: string; href: string }> = [
  { off: 30, c: "#2F5BFF", label: "Identifier le client", href: "#features" },
  { off: 18, c: "#5468FF", label: "Évaluer le risque", href: "#vigilance" },
  { off: 5, c: "#9A6BEB", label: "Conserver cinq ans", href: "#features" },
  { off: 18, c: "#EC6A93", label: "Déclarer un soupçon", href: "#features" },
  { off: 30, c: "#FF6A4D", label: "Justifier au contrôle", href: "#features" },
];

export default function HeroMark() {
  return (
    <div className="hm" role="group" aria-label="Les cinq obligations LCB-FT, dessinées par le logo Klaris">
      <span className="hm-stem" aria-hidden="true" />
      <ol className="hm-bars">
        {BARS.map((b, i) => (
          <li key={b.label} style={{ "--i": i, "--off": b.off, "--c": b.c } as React.CSSProperties}>
            <Link href={b.href} className="hm-bar">
              <span className="hm-bar__n">{i + 1}</span>
              <span className="hm-bar__t">{b.label}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="hm-cap">Les cinq barres du K&nbsp;: vos cinq obligations.</p>
    </div>
  );
}
