import React from "react";

export type LanguageKey = "ko" | "en" | "ja" | "zh";

const languages: Array<{ key: LanguageKey; label: string; sub: string }> = [
  { key: "ko", label: "KR", sub: "한국어" },
  { key: "en", label: "EN", sub: "English" },
  { key: "ja", label: "JP", sub: "日本語" },
  { key: "zh", label: "CN", sub: "中文" },
];

export function LanguageTabs({
  value,
  onChange,
}: {
  value: LanguageKey;
  onChange: (lang: LanguageKey) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
      {languages.map((lang) => {
        const active = lang.key === value;
        return (
          <button
            key={lang.key}
            type="button"
            onClick={() => onChange(lang.key)}
            className={[
              "group inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold",
              active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
            ].join(" ")}
            aria-pressed={active}
            aria-label={lang.sub}
          >
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}

