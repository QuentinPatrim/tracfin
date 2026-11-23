// components/landing/KycPhone.tsx — Le téléphone du client, dans la scène du haut de page
//
// Version légère : le formulaire client est reproduit (components/landing/DemoScreens),
// plus aucune page chargée en iframe. Les étapes défilent seules.

"use client";

import { PhoneForm } from "./DemoScreens";

export const PHONE_SCREEN_W = 384;
export const PHONE_SCREEN_H = 780;

export default function KycPhone({ playing = true, interval = 2600 }: { playing?: boolean; interval?: number; className?: string; title?: string }) {
  return <PhoneForm playing={playing} interval={interval} />;
}
