// components/landing/contact/ContactModal.tsx — Le formulaire de contact en fenêtre
// S'ouvre partout sur le site avec : window.dispatchEvent(new CustomEvent("klaris:open-contact", { detail: { topic, source } }))

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ContactForm from "./ContactForm";

export function openContact(topic = "rappel", source = "site") {
  window.dispatchEvent(new CustomEvent("klaris:open-contact", { detail: { topic, source } }));
}

export default function ContactModal() {
  const [open, setOpen] = useState<{ topic: string; source: string } | null>(null);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      setOpen({ topic: d.topic ?? "rappel", source: d.source ?? "site" });
    };
    window.addEventListener("klaris:open-contact", on);
    return () => window.removeEventListener("klaris:open-contact", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="cm" role="dialog" aria-modal="true" aria-label="Parler à Klaris">
      <button type="button" className="cm-veil" aria-label="Fermer" onClick={() => setOpen(null)} />
      <div className="cm-box">
        <button type="button" className="cm-x" aria-label="Fermer" onClick={() => setOpen(null)}><X width={18} height={18} /></button>
        <p className="kl-kicker kl-kicker--k">Parler à Klaris</p>
        <h2 className="kl-display cm-t">On vous montre Klaris sur <em>vos dossiers.</em></h2>
        <p className="cm-p">Laissez vos coordonnées : un échange simple, par téléphone ou en visio, au moment qui vous arrange.</p>
        <ContactForm source={open.source} defaultTopic={open.topic} onDone={() => setOpen(null)} />
      </div>
    </div>,
    document.body,
  );
}
