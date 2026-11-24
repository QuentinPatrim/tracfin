// components/dashboard/docs/DocViewer.tsx — Voir un document, puis le télécharger si besoin
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, Loader2, FileQuestion } from "lucide-react";
import DownloadButton from "./DownloadButton";
import { isTouchDevice } from "./download";

export interface DocSpec {
  kind: "html" | "image" | "pdf" | "other";
  title: string;
  sub: string;
  /** Ce qu'on affiche (HTML du document, image ou PDF). */
  view: string;
  /** Le fichier à télécharger. */
  file: string;
  filename: string;
  /** Où revenir si l'historique est vide (app ouverte directement sur cette page). */
  back: string;
}

const A4 = 794; // largeur d'une page A4 à 96 ppp

export default function DocViewer({ spec }: { spec: DocSpec }) {
  const router = useRouter();
  const touch = useSyncExternalStore(() => () => {}, isTouchDevice, () => false);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(spec.back);
  };

  return (
    <div className="dv">
      <div className="dv-top">
        <button type="button" className="dv-back" onClick={goBack} aria-label="Retour"><ArrowLeft width={18} height={18} /></button>
        <div className="dv-id">
          <b>{spec.title}</b>
          <small>{spec.sub}</small>
        </div>
        <DownloadButton url={spec.file} filename={spec.filename} className="dv-dl" busyLabel="Préparation…">
          {touch ? <><Share2 width={16} height={16} /><span>Enregistrer</span></> : <><Download width={16} height={16} /><span>Télécharger</span></>}
        </DownloadButton>
      </div>

      <div className="dv-stage">
        {spec.kind === "html" && <HtmlDoc src={spec.view} />}
        {spec.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dv-img" src={spec.view} alt={spec.title} />
        )}
        {spec.kind === "pdf" && <PdfDoc src={spec.view} />}
        {spec.kind === "other" && (
          <div className="dv-msg"><FileQuestion width={28} height={28} /><p>Ce type de fichier ne peut pas être affiché ici. Utilisez « {touch ? "Enregistrer" : "Télécharger"} » pour l&apos;ouvrir.</p></div>
        )}
      </div>
    </div>
  );
}

/** Document Klaris : son HTML dans une iframe, ramené à la largeur de l'écran. */
function HtmlDoc({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(1200);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1.15, el.clientWidth / (A4 + 36))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measure = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    if (doc.contentType && !doc.contentType.includes("html")) { setErr(true); return; }
    setH(doc.documentElement.scrollHeight);
  }, []);

  const onLoad = () => {
    setReady(true);
    measure();
    // Les polices arrivent après le chargement : on remesure.
    const doc = frame.current?.contentDocument;
    doc?.fonts?.ready.then(measure).catch(() => {});
    setTimeout(measure, 600);
  };

  return (
    <div ref={wrap} className="dv-html" style={{ height: ready ? h * scale : undefined }}>
      {!ready && <div className="dv-load"><Loader2 className="dv-spin" width={22} height={22} />Préparation du document…</div>}
      {err ? (
        <div className="dv-msg"><p>Le document n&apos;a pas pu être affiché. Vous pouvez le télécharger.</p></div>
      ) : (
        <iframe
          ref={frame}
          src={src}
          title="Document"
          onLoad={onLoad}
          scrolling="no"
          style={{ width: A4 + 36, height: h, transform: `scale(${scale})`, opacity: ready ? 1 : 0 }}
        />
      )}
    </div>
  );
}

/** PDF transmis par le client : dessiné page par page avec pdf.js (chargé à la demande). */
function PdfDoc({ src }: { src: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"load" | "ok" | "err">("load");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url: src, withCredentials: true }).promise;
        const el = host.current;
        if (!el || cancelled) return;
        el.innerHTML = "";
        const width = Math.min(el.clientWidth, 900);
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
          canvas.className = "dv-page";
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
          if (n === 1 && !cancelled) setState("ok");
        }
      } catch (e) {
        console.error("Aperçu PDF :", e);
        if (!cancelled) setState("err");
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  return (
    <div className="dv-pdf">
      {state === "load" && <div className="dv-load"><Loader2 className="dv-spin" width={22} height={22} />Ouverture du PDF…</div>}
      {state === "err" && <div className="dv-msg"><p>Ce PDF n&apos;a pas pu être affiché. Vous pouvez le télécharger.</p></div>}
      <div ref={host} className="dv-pages" />
    </div>
  );
}
