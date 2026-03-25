import React, { useMemo } from "react";

function useObjectUrl(file: File | null) {
  return useMemo(() => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);
}

function softTextOn(colorHex: string) {
  const hex = colorHex.replace("#", "");
  if (hex.length !== 6) return "#FFFFFF";
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const l = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return l > 0.6 ? "#0A0A0A" : "#FFFFFF";
}

export function ThemePreviewMock({
  eventDisplayName,
  primaryColor,
  logoFile,
}: {
  eventDisplayName: string;
  primaryColor: string;
  logoFile: File | null;
}) {
  const logoUrl = useObjectUrl(logoFile);

  React.useEffect(() => {
    if (!logoUrl) return;
    return () => URL.revokeObjectURL(logoUrl);
  }, [logoUrl]);

  const primaryText = softTextOn(primaryColor);

  return (
    <div className="w-full max-w-[320px]">
      <div className="rounded-[2rem] border border-zinc-200 bg-zinc-100 p-3 shadow-soft">
        <div className="rounded-[1.5rem] bg-white">
          <div
            className="rounded-t-[1.5rem] px-4 py-3"
            style={{ backgroundColor: primaryColor, color: primaryText }}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/20">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold">
                    LOGO
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{eventDisplayName || "행사명"}</div>
                <div className="text-xs opacity-90">현장 운영</div>
              </div>
              <div className="ml-auto h-2 w-10 rounded-full bg-white/35" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold text-zinc-900">빠른 작업</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-xl text-sm font-semibold shadow-sm"
                  style={{ backgroundColor: primaryColor, color: primaryText }}
                >
                  작품 등록
                </button>
                <button
                  type="button"
                  className="h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-sm"
                >
                  통계 보기
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-900">상태</div>
                <span
                  className="rounded-full px-2 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: `${primaryColor}1A`, color: primaryColor }}
                >
                  LIVE
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: "62%", backgroundColor: primaryColor }}
                />
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">운영 체크 진행률</div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold text-zinc-900">알림</div>
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2">
                  <div
                    className="mt-0.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div className="text-[11px] leading-4 text-zinc-600">
                    마커 데이터셋 업로드가 완료되었습니다.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-zinc-300" />
                  <div className="text-[11px] leading-4 text-zinc-600">
                    오늘의 현장 리포트를 확인해 주세요.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-b-[1.5rem] border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              {["홈", "장소", "작품", "설정"].map((t, i) => (
                <div
                  key={t}
                  className="flex flex-col items-center gap-1 rounded-xl py-1"
                  style={
                    i === 3
                      ? { backgroundColor: `${primaryColor}14`, color: primaryColor }
                      : { color: "#52525B" }
                  }
                >
                  <div
                    className="h-2.5 w-6 rounded-full"
                    style={i === 3 ? { backgroundColor: primaryColor } : { backgroundColor: "#D4D4D8" }}
                    aria-hidden="true"
                  />
                  <div className="text-[10px] font-semibold">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-[11px] text-zinc-500">Mobile UI Preview (Mock)</div>
    </div>
  );
}
