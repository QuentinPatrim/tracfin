// components/dashboard/KpiRow.tsx — 4 cartes KPI (top accent + halo, sans sparkline)

interface Props {
  total: number;
  conformes: number;
  vigilance: number;
  critique: number;
}

interface CardProps {
  label: string;
  value: number;
  delta: string;
  deltaSign?: "up" | "down" | "flat";
  tone: "accent" | "success" | "warn" | "danger";
}

function Kpi({ label, value, delta, deltaSign = "flat", tone }: CardProps) {
  return (
    <div className={`kpi tone-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-line">
        <div className="kpi-value">{value}</div>
        <div className={`kpi-delta ${deltaSign === "up" ? "up" : deltaSign === "down" ? "down" : ""}`}>
          {deltaSign === "up" ? "▲" : deltaSign === "down" ? "▼" : "•"} {delta}
        </div>
      </div>
    </div>
  );
}

export default function KpiRow({ total, conformes, vigilance, critique }: Props) {
  const conformesPct = total > 0 ? Math.round((conformes / total) * 100) : 0;

  return (
    <div className="kpi-row">
      <Kpi
        label="Total dossiers"
        value={total}
        delta={total > 0 ? "tous statuts confondus" : "—"}
        deltaSign="flat"
        tone="accent"
      />
      <Kpi
        label="Conformes"
        value={conformes}
        delta={total > 0 ? `${conformesPct}%` : "—"}
        deltaSign={conformes > 0 ? "up" : "flat"}
        tone="success"
      />
      <Kpi
        label="Vigilance"
        value={vigilance}
        delta={vigilance > 0 ? "à analyser" : "aucune alerte"}
        deltaSign="flat"
        tone="warn"
      />
      <Kpi
        label="Critique"
        value={critique}
        delta={critique > 0 ? "action requise" : "aucune"}
        deltaSign={critique > 0 ? "down" : "flat"}
        tone="danger"
      />
    </div>
  );
}
