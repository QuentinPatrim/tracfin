// components/dashboard/docs/DownloadButton.tsx — Bouton « télécharger » qui reste dans l'app
"use client";

import { useState } from "react";
import { downloadFile } from "./download";

interface Props {
  url: string;
  filename: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  busyLabel?: string;
}

export default function DownloadButton({ url, filename, className, style, children, busyLabel = "Préparation…" }: Props) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadFile(url, filename);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Téléchargement impossible");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={run} className={className} style={style} disabled={busy} aria-busy={busy}>
      {busy ? busyLabel : children}
    </button>
  );
}
