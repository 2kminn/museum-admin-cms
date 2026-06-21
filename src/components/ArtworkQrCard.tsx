import React, { useRef } from "react";
import { Download, Printer, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type ArtworkQrCardProps = {
  title: string;
  artist?: string | null;
  code: number | null;
  qrUrl: string | null;
  compact?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function fileSafeName(value: string) {
  const normalized = value.trim().replace(/[^\w.-]+/g, "_");
  return normalized || "artwork";
}

export function ArtworkQrCard({ title, artist, code, qrUrl, compact = false }: ArtworkQrCardProps) {
  const printCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captionTitle = title.trim() || "제목 없음";
  const captionArtist = artist?.trim() || "작가 미상";

  const getPngUrl = () => printCanvasRef.current?.toDataURL("image/png") ?? null;

  const downloadPng = () => {
    const pngUrl = getPngUrl();
    if (!pngUrl) return;
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `artwork-qr-${code ?? fileSafeName(captionTitle)}.png`;
    link.click();
  };

  const printQr = () => {
    const pngUrl = getPngUrl();
    if (!pngUrl) return;
    const popup = window.open("", "_blank", "width=720,height=900");
    if (!popup) {
      window.alert("인쇄 창을 열 수 없습니다. 브라우저 팝업 차단 설정을 확인해 주세요.");
      return;
    }

    popup.document.write(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>작품 QR 출력</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; }
      main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px; box-sizing: border-box; }
      .label { text-align: center; }
      img { width: 512px; height: 512px; image-rendering: pixelated; }
      h1 { margin: 20px 0 8px; font-size: 28px; line-height: 1.25; }
      p { margin: 0; font-size: 18px; color: #52525b; }
      .artist { margin-top: 6px; font-size: 20px; color: #18181b; }
      .code { margin-top: 12px; }
      @media print { main { padding: 0; } }
    </style>
  </head>
  <body>
    <main>
      <section class="label">
        <img src="${pngUrl}" alt="작품 QR 코드" />
        <h1>${escapeHtml(captionTitle)}</h1>
        <p class="artist">${escapeHtml(captionArtist)}</p>
        <p class="code">code: ${code ?? "-"}</p>
      </section>
    </main>
    <script>
      window.onload = () => {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>`);
    popup.document.close();
  };

  if (!qrUrl) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        QR URL이 아직 없습니다. 작품 저장 후 백엔드 응답의 qr_url로 생성됩니다.
      </div>
    );
  }

  return (
    <div
      className={[
        "relative rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
        compact ? "w-fit" : "",
      ].join(" ")}
    >
      <div className={compact ? "flex items-center gap-3" : "grid gap-3 sm:grid-cols-[auto_1fr]"}>
        <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800">
          <QRCodeCanvas value={qrUrl} size={compact ? 88 : 144} level="H" includeMargin />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <QrCode className="h-4 w-4" />
            작품 QR
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {captionTitle}
          </div>
          <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {captionArtist}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            code:{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{code ?? "-"}</span>
          </div>
          <div className="mt-1 break-all font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {qrUrl}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPng}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              PNG 다운로드
            </button>
            <button
              type="button"
              onClick={printQr}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <Printer className="h-3.5 w-3.5" />
              인쇄
            </button>
          </div>
        </div>
      </div>
      <QRCodeCanvas
        ref={printCanvasRef}
        value={qrUrl}
        size={512}
        level="H"
        includeMargin
        className="pointer-events-none absolute left-0 top-0 -z-10 opacity-0"
      />
    </div>
  );
}
