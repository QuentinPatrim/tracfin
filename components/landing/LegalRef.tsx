// components/landing/LegalRef.tsx — Référence d'article du site public.
// Lien vers le texte officiel quand l'URL est vérifiée (lib/legal-refs.ts),
// texte simple sinon. Remplace l'ancienne pastille décorative.

import { legalRefUrl } from "@/lib/legal-refs";

export default function LegalRef({
  code,
  children,
}: {
  /** Clé dans LEGAL_REF_URLS, ex. "CMF L.561-5". */
  code: string;
  /** Libellé affiché (par défaut : le code). */
  children?: React.ReactNode;
}) {
  const url = legalRefUrl(code);
  const label = children ?? code;
  if (!url) return <span className="kl-ref">{label}</span>;
  return (
    <a className="kl-ref" href={url} target="_blank" rel="noopener noreferrer">
      {label}
      <span className="sr-only"> (texte officiel, nouvel onglet)</span>
    </a>
  );
}
