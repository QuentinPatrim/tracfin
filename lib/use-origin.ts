// lib/use-origin.ts — Origine du site côté navigateur, sans écart d'hydratation
//
// `typeof window !== "undefined" ? window.location.origin : …` donne une valeur au
// rendu serveur et une autre à l'hydratation : React signale l'écart et, pour du
// texte, régénère tout l'arbre côté client. useSyncExternalStore sert la valeur
// « serveur » pendant l'hydratation, puis la vraie origine juste après.

"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useOrigin(serverValue = ""): string {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => serverValue);
}
