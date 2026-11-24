// app/dashboard/demandes/LeadsClient.tsx — Liste des demandes, à traiter / traitées
"use client";

import { useMemo, useState } from "react";
import { Check, Download, Mail, Phone, RotateCcw } from "lucide-react";
import { SLOTS, TEAM, TOPICS } from "@/lib/leads-labels";
import type { LeadRow } from "@/lib/leads";
import "./demandes.css";

const fmt = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function LeadsClient({ initial }: { initial: LeadRow[] }) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const list = useMemo(() => rows.filter((r) => (tab === "todo" ? !r.handled_at : !!r.handled_at)), [rows, tab]);
  const todo = rows.filter((r) => !r.handled_at).length;

  const toggle = async (r: LeadRow) => {
    const handled = !r.handled_at;
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, handled_at: handled ? new Date().toISOString() : null } : x)));
    await fetch(`/api/leads/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handled }) }).catch(() => {});
  };

  const exportCsv = () => {
    const head = ["Date", "Nom", "Agence", "E-mail", "Téléphone", "Équipe", "Demande", "Créneau", "Message", "Source", "Traitée"];
    const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [fmt(r.created_at), r.name, r.agency, r.email, r.phone, r.team_size ? TEAM[r.team_size] : "", r.topic ? TOPICS[r.topic] : "", r.slot ? SLOTS[r.slot] : "", r.message, r.source, r.handled_at ? "oui" : "non"].map(esc).join(";"));
    const blob = new Blob(["﻿" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `demandes-klaris-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="ld">
      <div className="ld-top">
        <div>
          <h1>Demandes</h1>
          <p>Contacts et rendez-vous laissés sur le site. Visible par vous seul.</p>
        </div>
        <button type="button" className="ld-btn" onClick={exportCsv} disabled={!rows.length}><Download width={15} height={15} />Exporter (.csv)</button>
      </div>

      <div className="ld-tabs">
        <button type="button" data-on={tab === "todo" ? "" : undefined} onClick={() => setTab("todo")}>À traiter <b>{todo}</b></button>
        <button type="button" data-on={tab === "done" ? "" : undefined} onClick={() => setTab("done")}>Traitées <b>{rows.length - todo}</b></button>
      </div>

      {list.length === 0 ? (
        <div className="ld-empty">{tab === "todo" ? "Aucune demande en attente." : "Aucune demande traitée pour l'instant."}</div>
      ) : (
        <ul className="ld-list">
          {list.map((r) => (
            <li key={r.id} className="ld-card" data-topic={r.topic ?? "rappel"}>
              <div className="ld-h">
                <span className="ld-tag">{r.topic ? TOPICS[r.topic] : "Contact"}</span>
                <small>{fmt(r.created_at)}{r.source ? ` · ${r.source}` : ""}</small>
              </div>
              <b className="ld-name">{r.name}</b>
              <div className="ld-agency">{r.agency}{r.team_size ? ` · équipe : ${TEAM[r.team_size] ?? r.team_size}` : ""}{r.slot ? ` · ${SLOTS[r.slot] ?? r.slot}` : ""}</div>
              {r.message && <p className="ld-msg">{r.message}</p>}
              <div className="ld-acts">
                <a href={`mailto:${r.email}`} className="ld-btn"><Mail width={15} height={15} />{r.email}</a>
                {r.phone && <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="ld-btn"><Phone width={15} height={15} />{r.phone}</a>}
                <button type="button" className="ld-btn ld-btn--ok" onClick={() => toggle(r)}>
                  {r.handled_at ? <><RotateCcw width={15} height={15} />Remettre à traiter</> : <><Check width={15} height={15} />Traitée</>}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
