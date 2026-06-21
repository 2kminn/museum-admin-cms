import React, { useId, useState } from "react";
import { ImagePlus, Trash2, Video } from "lucide-react";

function bytesToHuman(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

type MediaSlotProps = {
  title: string;
  accept: string;
  icon: React.ReactNode;
};

function MediaSlot({ title, accept, icon }: MediaSlotProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFirstFile = (files: File[]) => {
    setFile(files[0] ?? null);
  };

  return (
    <div
      className={[
        "rounded-lg border border-dashed p-3 transition dark:border-zinc-800",
        isDragging ? "border-zinc-900 bg-white dark:bg-zinc-950" : "border-zinc-200 bg-zinc-50 dark:bg-zinc-900",
      ].join(" ")}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setFirstFile(Array.from(e.dataTransfer.files ?? []));
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {icon}
        </div>
        <div className="min-w-[90px] flex-1">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
          {file ? (
            <div className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-300">
              {file.name} · {bytesToHuman(file.size)}
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">선택된 파일 없음</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            파일 선택
          </label>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept={accept}
            onChange={(e) => {
              setFirstFile(Array.from(e.currentTarget.files ?? []));
              e.currentTarget.value = "";
            }}
          />
          {file ? (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              aria-label={`${title} 파일 제거`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdditionalMediaSlots() {
  return (
    <div>
      <div className="mb-2">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">미디어 추가</div>
        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          동영상/GIF 파일을 미리 선택할 수 있습니다.
        </div>
      </div>
      <div className="grid gap-2">
        <MediaSlot title="동영상" accept="video/mp4,video/webm,video/quicktime" icon={<Video className="h-5 w-5 text-zinc-500" />} />
        <MediaSlot title="GIF" accept="image/gif" icon={<ImagePlus className="h-5 w-5 text-zinc-500" />} />
      </div>
    </div>
  );
}
