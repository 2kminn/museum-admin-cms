import React, { useEffect, useMemo, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { useEventContext } from "../context/EventContext";
import { FileDropzone } from "../components/FileDropzone";
import { ThemePreviewMock } from "../components/ThemePreviewMock";

type ThemeConfig = {
  eventId: string;
  branding: {
    eventDisplayName: string;
    primaryColor: string; // hex
    logo?: {
      fileName: string;
      size: number;
      mimeType?: string;
    } | null;
  };
  updatedAt: string; // ISO
};

function clampHex(hex: string) {
  const v = hex.trim();
  if (!v) return "#111111";
  if (v.startsWith("#")) return v;
  return `#${v}`;
}

function isValidHexColor(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

function storageKeyFor(eventId: string) {
  return `artar_admin:theme:${eventId}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function ThemeEditorPage() {
  const { selectedEvent } = useEventContext();
  const eventId = selectedEvent?.id ?? "";

  const [eventDisplayName, setEventDisplayName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#111111");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [loadedForEventId, setLoadedForEventId] = useState<string>("");

  useEffect(() => {
    if (!eventId) return;
    if (loadedForEventId === eventId) return;

    const raw = window.localStorage.getItem(storageKeyFor(eventId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ThemeConfig;
        setEventDisplayName(parsed.branding.eventDisplayName || selectedEvent?.name || "");
        setPrimaryColor(
          isValidHexColor(parsed.branding.primaryColor) ? parsed.branding.primaryColor : "#111111",
        );
        setLogoFile(null);
      } catch {
        setEventDisplayName(selectedEvent?.name ?? "");
        setPrimaryColor("#111111");
        setLogoFile(null);
      }
    } else {
      setEventDisplayName(selectedEvent?.name ?? "");
      setPrimaryColor("#111111");
      setLogoFile(null);
    }

    setLoadedForEventId(eventId);
  }, [eventId, loadedForEventId, selectedEvent?.name]);

  const primaryColorSafe = useMemo(() => {
    const hex = clampHex(primaryColor);
    if (isValidHexColor(hex)) return hex.toUpperCase();
    return "#111111";
  }, [primaryColor]);

  const themeConfig: ThemeConfig = useMemo(
    () => ({
      eventId,
      branding: {
        eventDisplayName: eventDisplayName || selectedEvent?.name || "",
        primaryColor: primaryColorSafe,
        logo: logoFile
          ? { fileName: logoFile.name, size: logoFile.size, mimeType: logoFile.type || undefined }
          : null,
      },
      updatedAt: nowIso(),
    }),
    [eventDisplayName, eventId, logoFile, primaryColorSafe, selectedEvent?.name],
  );

  const save = () => {
    if (!eventId) {
      window.alert("먼저 상단에서 행사를 선택해 주세요.");
      return;
    }
    window.localStorage.setItem(storageKeyFor(eventId), JSON.stringify(themeConfig));
    // placeholder for backend integration
    // eslint-disable-next-line no-console
    console.log("[ThemeEditor] save payload", themeConfig);
    window.alert("저장 완료(로컬). API 연동 시 이 JSON을 전송하면 됩니다.");
  };

  const reset = () => {
    setEventDisplayName(selectedEvent?.name ?? "");
    setPrimaryColor("#111111");
    setLogoFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">테마 편집기</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            행사별 앱 바이브(브랜딩/컬러/로고)를 구성합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            저장
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">브랜딩 설정</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            로고는 보통 별도 업로드 후 URL을 저장합니다.
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700" htmlFor="eventDisplayName">
                행사명 (표시용)
              </label>
              <input
                id="eventDisplayName"
                value={eventDisplayName}
                onChange={(e) => setEventDisplayName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder={selectedEvent?.name ?? "행사명을 입력하세요"}
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-zinc-700">로고 업로드</div>
              <FileDropzone
                label="로고 이미지를 드래그앤드롭 또는 클릭"
                accept="image/*"
                multiple={false}
                value={logoFile ? [logoFile] : []}
                onChange={(files) => setLogoFile(files[0] ?? null)}
              />
              <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                API 전송 시: 로고 파일은 `multipart/form-data`로 업로드하고, JSON에는 URL/키를 저장하는
                방식을 권장합니다.
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-zinc-700">대표 색상 (Primary)</div>
                <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <HexColorPicker color={primaryColorSafe} onChange={setPrimaryColor} />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700" htmlFor="primaryHex">
                    HEX
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="h-10 w-10 rounded-lg border border-zinc-200"
                      style={{ backgroundColor: primaryColorSafe }}
                      aria-label="Primary color swatch"
                    />
                    <HexColorInput
                      id="primaryHex"
                      color={primaryColorSafe}
                      onChange={(v) => setPrimaryColor(clampHex(v))}
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      prefixed
                    />
                  </div>
                  {!isValidHexColor(primaryColorSafe) ? (
                    <div className="mt-1 text-[11px] text-red-600">유효한 HEX(#RRGGBB)를 입력해 주세요.</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs font-medium text-zinc-700">프리셋</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["#111111", "#0B1220", "#0A0A0A", "#2563EB", "#16A34A", "#DC2626", "#7C3AED"].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPrimaryColor(c)}
                          className="h-9 w-9 rounded-lg border border-zinc-200 shadow-sm hover:opacity-90 dark:border-zinc-800"
                          style={{ backgroundColor: c }}
                          aria-label={`preset ${c}`}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">API 전송용 JSON</div>
                  <pre className="mt-2 max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-4 text-zinc-700 dark:text-zinc-300">
                    {JSON.stringify(themeConfig, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">미리보기</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            색상을 바꾸면 모바일 UI가 실시간으로 반영됩니다.
          </div>
          <div className="mt-4 flex justify-center">
            <ThemePreviewMock
              eventDisplayName={themeConfig.branding.eventDisplayName}
              primaryColor={primaryColorSafe}
              logoFile={logoFile}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
