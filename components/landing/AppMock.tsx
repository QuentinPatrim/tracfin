// components/landing/AppMock.tsx — Le tableau de bord Klaris, reconstitué pour la page d'accueil
//
// Une reproduction fidèle (et légère) de l'écran « Dossiers » de l'application :
// même disposition, mêmes libellés, mêmes niveaux de vigilance que le produit.
// Rendu à une taille fixe (1200 × 740) puis mis à l'échelle par son parent.
// Données fictives, reprises de components/dashboard/demoData.ts.

import { Search, Plus, Folder, ShieldAlert, Plug, CreditCard, FileText, Check, Download } from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";

export const MOCK_W = 1200;
export const MOCK_H = 740;

type Lvl = 1 | 2 | 3 | 4 | 0;
const ROWS: Array<{ n: string; i: string; t: string; p: string; l: Lvl; d: string }> = [
  { n: "Camille Rousseau", i: "CR", t: "Personne physique", p: "Acquéreur", l: 1, d: "Aujourd'hui" },
  { n: "SCI Les Tilleuls", i: "ST", t: "Personne morale", p: "Acquéreur", l: 2, d: "Hier" },
  { n: "Marc Lefèvre", i: "ML", t: "Personne physique", p: "Vendeur", l: 1, d: "18 nov." },
  { n: "Nadia Benali", i: "NB", t: "Personne physique", p: "Acquéreur", l: 3, d: "17 nov." },
  { n: "Holding Varteg Ltd", i: "HV", t: "Personne morale", p: "Acquéreur", l: 4, d: "14 nov." },
  { n: "Julien Mercier", i: "JM", t: "Personne physique", p: "Acquéreur", l: 0, d: "12 nov." },
];
const LBL: Record<Lvl, string> = {
  0: "Fiche envoyée",
  1: "Vigilance standard",
  2: "Vigilance renforcée",
  3: "Examen renforcé",
  4: "Interdiction",
};

export default function AppMock() {
  return (
    <div className="lm" style={{ width: MOCK_W, height: MOCK_H }} aria-hidden="true">
      {/* Barre latérale */}
      <aside className="lm-side">
        <div className="lm-brand">
          <KlarisLogo size={26} />
          <span className="kl-wordmark" style={{ fontSize: 22 }}>Klaris</span>
        </div>
        <div className="lm-org">
          <span className="lm-org__av">A</span>
          <span>Agence du Capitole</span>
        </div>
        <nav className="lm-nav">
          <span className="lm-nav__i is-on"><Folder size={15} />Dossiers<b>6</b></span>
          <span className="lm-nav__i"><ShieldAlert size={15} />Cartographie</span>
          <span className="lm-nav__i"><Plug size={15} />Intégrations</span>
          <span className="lm-nav__i"><CreditCard size={15} />Abonnement</span>
        </nav>
        <div className="lm-trial">
          <div className="lm-trial__h">Période d&apos;essai</div>
          <div className="lm-trial__t">9 jours restants</div>
          <div className="lm-trial__bar"><span style={{ width: "36%" }} /></div>
        </div>
      </aside>

      {/* Panneau principal */}
      <section className="lm-main">
        <header className="lm-head">
          <div>
            <div className="lm-title">Dossiers</div>
            <div className="lm-sub">6 dossiers · mis à jour à l&apos;instant</div>
          </div>
          <div className="lm-tools">
            <span className="lm-search"><Search size={14} />Rechercher un client…<kbd>⌘K</kbd></span>
            <span className="lm-btn"><Plus size={14} />Nouveau dossier</span>
          </div>
        </header>

        <div className="lm-kpis">
          {[
            ["Dossiers actifs", "6", null],
            ["Vigilance standard", "2", 1],
            ["Vigilance renforcée", "1", 2],
            ["Action requise", "2", 4],
          ].map(([k, v, l]) => (
            <div key={k as string} className="lm-kpi">
              <div className="lm-kpi__k">{l ? <i style={{ background: `var(--kl-v${l})` }} /> : null}{k}</div>
              <div className="lm-kpi__v">{v}</div>
            </div>
          ))}
        </div>

        <div className="lm-split">
          <div className="lm-table">
            <div className="lm-tabs">
              <span className="is-on">Tous <b>6</b></span>
              <span>En attente <b>1</b></span>
              <span>Vigilance <b>1</b></span>
              <span>Critique <b>2</b></span>
            </div>
            {ROWS.map((r, idx) => (
              <div key={r.n} className={`lm-row ${idx === 0 ? "is-sel" : ""}`}>
                <span className="lm-av">{r.i}</span>
                <span className="lm-row__n">
                  <b>{r.n}</b>
                  <small>{r.t} · {r.p}</small>
                </span>
                <span className="lm-badge" data-l={r.l}><i />{LBL[r.l]}</span>
                <span className="lm-row__d">{r.d}</span>
              </div>
            ))}
          </div>

          <div className="lm-pane">
            <div className="lm-pane__id">
              <span className="lm-av lm-av--lg">CR</span>
              <div>
                <b>Camille Rousseau</b>
                <small>Acquéreur · fiche reçue</small>
              </div>
            </div>
            <div className="lm-pane__k">Niveau de vigilance</div>
            <div className="lm-label">
              {[1, 2, 3, 4].map((l) => (
                <div key={l} className="lm-label__row">
                  <span className="lm-label__bar" data-l={l} />
                  {l === 1 && <span className="lm-label__ptr">1</span>}
                </div>
              ))}
            </div>
            <div className="lm-pane__k">Pièces du dossier</div>
            <ul className="lm-files">
              <li><FileText size={14} />Pièce d&apos;identité<Check size={13} /></li>
              <li><FileText size={14} />Justificatif de domicile<Check size={13} /></li>
              <li><FileText size={14} />Origine des fonds<Check size={13} /></li>
            </ul>
            <span className="lm-btn lm-btn--block"><Download size={14} />Télécharger l&apos;attestation</span>
          </div>
        </div>
      </section>
    </div>
  );
}
