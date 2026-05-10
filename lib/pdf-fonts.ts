// lib/pdf-fonts.ts — Enregistrement de la police Inter pour @react-pdf/renderer

import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

export function ensureFonts() {
  if (registered) return;
  registered = true;

  const fontDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(fontDir, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontDir, "Inter-Medium.ttf"), fontWeight: 500 },
      { src: path.join(fontDir, "Inter-Bold.ttf"), fontWeight: 700 },
      { src: path.join(fontDir, "Inter-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });

  // Désactive la césure (Inter rend mieux sans en PDF)
  Font.registerHyphenationCallback((word) => [word]);
}
