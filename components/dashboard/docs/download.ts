// components/dashboard/docs/download.ts — Télécharger sans quitter l'app
//
// Un lien vers un fichier « attachment » ouvre, dans l'app installée sur iPhone,
// une page noire sans retour. On récupère donc le fichier en arrière-plan, puis :
//   - sur téléphone : la feuille de partage du système (Enregistrer dans Fichiers,
//     Drive, Mail, WhatsApp…) ;
//   - sur ordinateur : un téléchargement classique.

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function nameFromDisposition(h: string | null): string | null {
  if (!h) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(h);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
  const blob = await res.blob();
  const name = nameFromDisposition(res.headers.get("Content-Disposition")) ?? fallbackName;

  if (isTouchDevice() && typeof navigator.share === "function") {
    const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return;
      } catch (e) {
        // L'utilisateur a fermé la feuille de partage : rien d'autre à faire.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}
