// components/tracfin/AmbientOrbs.tsx — fond des pages sombres de l'application
//
// Le champ d'encre de l'identité « Papier & encre » : indigo nuit, éclairé d'une lueur
// violet / rose fixe (la même que sur le site). Plus d'orbes animés.

export default function AmbientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "var(--kl-field-glow), var(--kl-field)" }}
    />
  );
}
