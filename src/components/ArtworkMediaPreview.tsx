import React from "react";
import { FileText, ImageIcon } from "lucide-react";

type ArtworkMediaPreviewProps = {
  src: string | null;
  title: string;
  fileName?: string | null;
};

function isImageSrc(src: string) {
  return src.startsWith("data:image/") || /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(src);
}

function isPdfSrc(src: string) {
  return src.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(src);
}

export function ArtworkMediaPreview({ src, title, fileName }: ArtworkMediaPreviewProps) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-zinc-400">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }

  if (isImageSrc(src)) {
    return <img src={src} alt={title || "작품 이미지"} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-zinc-500 dark:text-zinc-400">
      {isPdfSrc(src) ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
      {fileName ? <span className="max-w-full truncate text-[10px]">{fileName}</span> : null}
    </div>
  );
}
