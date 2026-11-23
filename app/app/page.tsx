// app/app/page.tsx — Entrée de l'app installée (start_url du manifeste)
//
// Déjà connecté : direction les dossiers. Sinon, la connexion se fait ici même, sans
// quitter Klaris : sur iPhone, une app installée qui part vers un autre site perd sa
// session ; tout reste donc sur ce domaine.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AppSignIn from "./AppSignIn";

export const metadata: Metadata = {
  title: "Klaris — connexion",
  robots: { index: false, follow: false },
};

export default async function AppEntry() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <AppSignIn />;
}
