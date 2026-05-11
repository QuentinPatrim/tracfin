// lib/pdf-renderer.ts — Helper Puppeteer pour rendre HTML → PDF (dev + prod Vercel)

import type { Browser, PDFOptions } from "puppeteer-core";

/**
 * Lance Chromium :
 * - En prod (Vercel) → @sparticuz/chromium-min télécharge le pack à la 1re utilisation
 * - En dev local → utilise le Chrome installé (CHROME_EXECUTABLE_PATH ou défaut Windows/macOS/Linux)
 */
export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  const isProd = !!process.env.VERCEL || process.env.NODE_ENV === "production";

  if (isProd) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const packUrl = process.env.CHROMIUM_PACK_URL;
    if (!packUrl) throw new Error("CHROMIUM_PACK_URL not set");
    return await puppeteer.launch({
      args: [...chromium.args, "--font-render-hinting=none"],
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
    });
  }

  // Dev local : utiliser le Chrome installé
  const fallbacks = process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Users\\" + (process.env.USERNAME ?? "") + "\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
      ]
    : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"];

  const fs = await import("node:fs");
  const executablePath =
    process.env.CHROME_EXECUTABLE_PATH ??
    fallbacks.find((p) => fs.existsSync(p));

  if (!executablePath) {
    throw new Error(
      "Chrome introuvable. Définis CHROME_EXECUTABLE_PATH dans .env.local " +
      "ou installe Google Chrome."
    );
  }

  return await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });
}

/**
 * Rend un HTML brut en PDF via Chromium headless.
 * Pas de HTTP roundtrip : le HTML est passé directement via page.setContent().
 * Avantages : aucun problème d'auth/protection Vercel, plus rapide, secret PDF inutile.
 */
export async function renderHtmlPdf(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 25_000,
    });

    // Garantit que les fonts custom (Google Fonts via @import) sont prêtes avant impression
    await page.evaluateHandle("document.fonts.ready");

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      ...options,
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}
