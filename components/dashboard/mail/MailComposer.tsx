// components/dashboard/mail/MailComposer.tsx — Rédiger un e-mail de la marche à suivre
//
// Fenêtre (feuille du bas sur téléphone) : destinataire pré-rempli, cases qui
// adaptent le texte, objet et texte modifiables, puis plusieurs façons d'envoyer —
// la messagerie de l'appareil (mailto), Gmail ou Outlook dans le navigateur, le
// partage du téléphone, ou copier le texte. « mailto » seul ne suffit pas : sur un
// ordinateur sans logiciel de messagerie configuré, il ne se passe rien.

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Copy, Check, Share2, ShieldAlert, RotateCcw } from "lucide-react";
import { MAIL_TEMPLATES, defaults, type MailCtx, type MailId, type Sel } from "./templates";
import "./mail.css";

interface Props {
  id: MailId;
  ctx: MailCtx;
  onClose: () => void;
  /** L'agent confirme l'envoi : on coche l'étape. */
  onSent: () => void;
}

export default function MailComposer({ id, ctx, onClose, onSent }: Props) {
  const tpl = MAIL_TEMPLATES[id];
  const opts = useMemo(() => tpl.options(ctx), [tpl, ctx]);
  const [sel, setSel] = useState<Sel>(() => defaults(opts));
  const [to, setTo] = useState(tpl.to === "client" ? ctx.email ?? "" : "");
  const built = useMemo(() => tpl.build(ctx, sel), [tpl, ctx, sel]);
  // Le texte suit les cases tant que l'agent ne l'a pas retouché à la main.
  const [customSubject, setCustomSubject] = useState<string | null>(null);
  const [customBody, setCustomBody] = useState<string | null>(null);
  const subject = customSubject ?? built.subject;
  const body = customBody ?? built.body;
  const edited = customBody !== null;
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);
  // Monté seulement après un clic (jamais rendu côté serveur) : on peut lire le navigateur.
  const canShare = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const enc = encodeURIComponent;
  const openMailto = () => {
    setUsed(true);
    window.location.href = `mailto:${to.trim()}?subject=${enc(subject)}&body=${enc(body)}`;
  };
  const openGmail = () => {
    setUsed(true);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to.trim())}&su=${enc(subject)}&body=${enc(body)}`, "_blank", "noopener");
  };
  const openOutlook = () => {
    setUsed(true);
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${enc(to.trim())}&subject=${enc(subject)}&body=${enc(body)}`, "_blank", "noopener");
  };
  const share = async () => {
    try { await navigator.share({ title: subject, text: body }); setUsed(true); } catch { /* fermé */ }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true); setUsed(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* presse-papiers refusé */ }
  };

  return createPortal(
    <div className="mc" role="dialog" aria-modal="true" aria-label={tpl.title}>
      <button type="button" className="mc-veil" aria-label="Fermer" onClick={onClose} />
      <div className="mc-box">
        <div className="mc-head">
          <span className="mc-ico"><Mail width={18} height={18} /></span>
          <div><b>{tpl.title}</b><small>Texte proposé, modifiable avant envoi</small></div>
          <button type="button" className="mc-x" onClick={onClose} aria-label="Fermer"><X width={18} height={18} /></button>
        </div>

        <div className="mc-scroll">
          {tpl.warning && <div className="mc-warn"><ShieldAlert width={16} height={16} /><span>{tpl.warning}</span></div>}

          <label className="mc-field">
            <span>À</span>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder={tpl.to === "client" ? "e-mail du client" : "e-mail de votre correspondant LCB-FT"} autoComplete="off" />
          </label>

          {opts.length > 0 && (
            <div className="mc-opts">
              {opts.map((o) =>
                o.type === "check" ? (
                  <button key={o.id} type="button" className="mc-chip" data-on={sel[o.id] ? "" : undefined}
                    onClick={() => { setCustomBody(null); setSel((s) => ({ ...s, [o.id]: !s[o.id] })); }}>
                    <i>{sel[o.id] && <Check width={12} height={12} strokeWidth={3} />}</i>{o.label}
                  </button>
                ) : (
                  <div key={o.id} className="mc-radio">
                    <small>{o.label}</small>
                    <div>
                      {o.choices.map((ch) => (
                        <button key={ch.id} type="button" data-on={sel[o.id] === ch.id ? "" : undefined}
                          onClick={() => { setCustomBody(null); setSel((s) => ({ ...s, [o.id]: ch.id })); }}>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <label className="mc-field">
            <span>Objet</span>
            <input value={subject} onChange={(e) => setCustomSubject(e.target.value)} />
          </label>
          <div className="mc-body">
            <textarea value={body} onChange={(e) => setCustomBody(e.target.value)} rows={12} />
            {edited && (
              <button type="button" className="mc-reset" onClick={() => setCustomBody(null)}>
                <RotateCcw width={13} height={13} />Rétablir le texte proposé
              </button>
            )}
          </div>
        </div>

        <div className="mc-foot">
          <div className="mc-send">
            <button type="button" className="mc-pri" onClick={openMailto}><Mail width={16} height={16} />Ma messagerie</button>
            <button type="button" className="mc-sec" onClick={openGmail}>Gmail</button>
            <button type="button" className="mc-sec" onClick={openOutlook}>Outlook</button>
            {canShare && <button type="button" className="mc-sec" onClick={share} aria-label="Partager"><Share2 width={16} height={16} /></button>}
            <button type="button" className="mc-sec" onClick={copy}>{copied ? <><Check width={15} height={15} />Copié</> : <><Copy width={15} height={15} />Copier</>}</button>
          </div>
          <button type="button" className="mc-done" data-ready={used ? "" : undefined} onClick={() => { onSent(); onClose(); }}>
            <Check width={16} height={16} strokeWidth={3} />J&apos;ai envoyé l&apos;e-mail
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
