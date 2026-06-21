// app/dashboard/template.tsx — Transition douce entre les pages du dashboard
//
// Un template Next.js se re-monte à CHAQUE navigation (contrairement au layout
// qui persiste). On anime un fondu à chaque changement d'onglet → transitions
// fluides et premium.
//
// ⚠️ On anime UNIQUEMENT l'opacité (pas de transform/translate) : un ancêtre
// avec `transform` redéfinit le bloc conteneur des éléments `position: fixed`
// (barre d'action sticky du formulaire, modales plein écran) et les casserait.
// L'opacité, elle, n'a aucun effet sur le positionnement → 100% sûr.

"use client";

import { motion } from "framer-motion";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
