// components/landing/contact/ContactForm.tsx — « En savoir plus / prendre rendez-vous »
//
// Formulaire court du site public : qui vous êtes, comment vous joindre, ce que vous
// voulez (être rappelé, une démo en visio, une question) et quand. Les demandes
// arrivent dans l'app, page « Demandes » (réservée au fondateur). Deux formes :
// dans une section de page (variant="inline") ou dans une fenêtre (ContactModal).

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import "./contact.css";

const TOPICS = [
  { id: "rappel", label: "Être rappelé" },
  { id: "demo", label: "Une démo en visio" },
  { id: "question", label: "Une question" },
];
const SLOTS = [
  { id: "matin", label: "Matin" },
  { id: "midi", label: "Midi" },
  { id: "apresmidi", label: "Après-midi" },
  { id: "soir", label: "Fin de journée" },
];
const TEAM = [
  { id: "1", label: "Seul(e)" },
  { id: "2-5", label: "2 à 5" },
  { id: "6-15", label: "6 à 15" },
  { id: "16+", label: "16 et +" },
];

export default function ContactForm({ source, defaultTopic = "rappel", onDone }: { source: string; defaultTopic?: string; onDone?: () => void }) {
  const [topic, setTopic] = useState(defaultTopic);
  const [slot, setSlot] = useState("");
  const [team, setTeam] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!consent) { setErr("Cochez la case pour qu'on puisse vous recontacter."); setState("error"); return; }
    setState("sending");
    setErr("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"), agency: f.get("agency"), email: f.get("email"), phone: f.get("phone"),
          message: f.get("message"), website: f.get("website"),
          topic, slot, team, consent, source, path: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Envoi impossible");
      setState("sent");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Envoi impossible");
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="cf-done">
        <span><Check width={26} height={26} strokeWidth={3} /></span>
        <b>Merci, c&apos;est bien reçu.</b>
        <p>On vous recontacte {topic === "question" ? "par e-mail" : slot ? "au moment indiqué" : "rapidement"}.</p>
        {onDone && <button type="button" className="kl-btn kl-btn--ghost" onClick={onDone}>Fermer</button>}
      </div>
    );
  }

  return (
    <form className="cf" onSubmit={submit} noValidate>
      <div className="cf-chips" role="radiogroup" aria-label="Votre demande">
        {TOPICS.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={topic === t.id} data-on={topic === t.id ? "" : undefined} onClick={() => setTopic(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="cf-grid">
        <label className="cf-f"><span>Nom et prénom</span><input name="name" required autoComplete="name" placeholder="Marie Lefort" /></label>
        <label className="cf-f"><span>Agence</span><input name="agency" required autoComplete="organization" placeholder="Agence du Capitole" /></label>
        <label className="cf-f"><span>E-mail</span><input name="email" type="email" required autoComplete="email" placeholder="marie@agence.fr" /></label>
        <label className="cf-f"><span>Téléphone{topic === "question" ? " (facultatif)" : ""}</span><input name="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" required={topic !== "question"} /></label>
      </div>

      {topic !== "question" && (
        <div className="cf-row">
          <span className="cf-lab">Le meilleur moment</span>
          <div className="cf-seg">
            {SLOTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={slot === s.id} data-on={slot === s.id ? "" : undefined} onClick={() => setSlot(slot === s.id ? "" : s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="cf-row">
        <span className="cf-lab">Taille de l&apos;équipe</span>
        <div className="cf-seg">
          {TEAM.map((s) => (
            <button key={s.id} type="button" aria-pressed={team === s.id} data-on={team === s.id ? "" : undefined} onClick={() => setTeam(team === s.id ? "" : s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      <label className="cf-f cf-f--area">
        <span>{topic === "question" ? "Votre question" : "Un mot sur votre besoin (facultatif)"}</span>
        <textarea name="message" rows={3} placeholder={topic === "question" ? "Par exemple : comment gérer un acquéreur en SCI ?" : "Par exemple : 40 ventes par an, deux négociateurs"} />
      </label>

      {/* Piège à robots : invisible pour les humains */}
      <input name="website" tabIndex={-1} autoComplete="off" className="cf-hp" aria-hidden="true" />

      <label className="cf-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          J&apos;accepte que Klaris utilise ces informations pour me recontacter au sujet de ma demande.{" "}
          <Link href="/legal/confidentialite" className="kl-link">Confidentialité</Link>
        </span>
      </label>

      {state === "error" && err && <p className="cf-err" role="alert">{err}</p>}

      <button type="submit" className="kl-btn kl-btn--primary kl-btn--lg cf-submit" disabled={state === "sending"}>
        {state === "sending" ? <><Loader2 width={16} height={16} className="cf-spin" />Envoi…</> : <>{topic === "demo" ? "Demander ma démo" : topic === "question" ? "Envoyer ma question" : "Être rappelé"}<ArrowRight width={16} height={16} className="kl-arrow" /></>}
      </button>
    </form>
  );
}
