// components/dashboard/KpiRow.tsx — Bandeau des quatre indicateurs du tableau de bord

interface Props {
  total: number;
  conformes: number;
  vigilance: number;
  critique: number;
}

interface CardProps {
  label: string;
  value: number;
  note: string;
  level?: 1 | 2 | 3 | 4;
}

/* Un indicateur : libellé, chiffre en serif, une ligne d'explication. La couleur ne
   sert qu'à rappeler le niveau de vigilance (petit carré), jamais de décor. */
function Kpi({ label, value, note, level }: CardProps) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        {level ? <i className="kpi-mark" style={{ background: `var(--k-v${level})` }} /> : null}
        {label}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-delta">{note}</div>
    </div>
  );
}

export default function KpiRow({ total, conformes, vigilance, critique }: Props) {
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)} % des dossiers` : "—");

  return (
    <div className="kpi-row">
      <Kpi label="Dossiers actifs" value={total} note={total > 0 ? "tous niveaux confondus" : "aucun dossier"} />
      <Kpi label="Vigilance standard" value={conformes} note={pct(conformes)} level={1} />
      <Kpi label="Vigilance renforcée" value={vigilance} note={vigilance > 0 ? "à documenter" : "aucun dossier"} level={2} />
      <Kpi label="Action requise" value={critique} note={critique > 0 ? "examen renforcé ou interdiction" : "aucun dossier"} level={critique > 0 ? 4 : 3} />
    </div>
  );
}
