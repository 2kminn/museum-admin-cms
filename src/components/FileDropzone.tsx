import React, { useId, useMemo, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

type Props = {
  label: string;
  accept?: string;
  multiple?: boolean;
  value: File[];
  onChange: (files: File[]) => void;
};

function bytesToHuman(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)}MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)}GB`;
}

export function FileDropzone({ label, accept, multiple, value, onChange }: Props) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const previews = useMemo(() => {
    return value.map((file) => {
      const url = URL.createObjectURL(file);
      return { file, url };
    });
  }, [value]);

  React.useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const addFiles = (files: File[]) => {
    const next = multiple ? [...value, ...files] : files.slice(0, 1);
    onChange(next);
  };

  const removeAt = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className={[
          "relative block cursor-pointer rounded-xl border border-dashed p-4 transition",
          isDragging
            ? "border-zinc-900 bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-900"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
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
          const dropped = Array.from(e.dataTransfer.files ?? []);
          if (dropped.length > 0) addFiles(dropped);
        }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {isDragging ? <UploadCloud className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {multiple ? "여러 파일 가능" : "1개 파일"} · {accept ? accept : "모든 파일"}
            </div>
          </div>
        </div>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            if (picked.length > 0) addFiles(picked);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {value.length > 0 ? (
        <div className="grid gap-2">
          {previews.map((p, idx) => (
            <div
              key={`${p.file.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="h-12 w-12 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.file.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{bytesToHuman(p.file.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                aria-label="파일 제거"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
