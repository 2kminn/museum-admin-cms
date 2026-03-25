import React, { useId, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEventContext } from "../context/EventContext";
import { LanguageTabs, type LanguageKey } from "../components/LanguageTabs";
import { FileDropzone } from "../components/FileDropzone";

type Mode = "create" | "edit";

type LocalizedText = Record<LanguageKey, { title: string; description: string }>;

function createEmptyLocalizedText(): LocalizedText {
  return {
    ko: { title: "", description: "" },
    en: { title: "", description: "" },
    ja: { title: "", description: "" },
    zh: { title: "", description: "" },
  };
}

export function ArtworkEditorPage({ mode }: { mode: Mode }) {
  const { selectedEvent } = useEventContext();
  const { artworkId } = useParams();
  const titleId = useId();

  const pageTitle = useMemo(() => {
    if (mode === "edit") return "작품 수정";
    return "작품 등록";
  }, [mode]);

  const [activeLang, setActiveLang] = useState<LanguageKey>("ko");
  const [localized, setLocalized] = useState<LocalizedText>(() => createEmptyLocalizedText());

  const [x, setX] = useState<string>("");
  const [y, setY] = useState<string>("");
  const [z, setZ] = useState<string>("");
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState<number>(10);

  const [artworkImage, setArtworkImage] = useState<File | null>(null);
  const [markerImages, setMarkerImages] = useState<File[]>([]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      mode,
      artworkId: mode === "edit" ? artworkId : undefined,
      eventId: selectedEvent?.id,
      localized,
      spatial: {
        x: x === "" ? null : Number(x),
        y: y === "" ? null : Number(y),
        z: z === "" ? null : Number(z),
      },
      triggerRadiusMeters,
      files: {
        artworkImage: artworkImage ? { name: artworkImage.name, size: artworkImage.size } : null,
        markerImages: markerImages.map((f) => ({ name: f.name, size: f.size })),
      },
    };
    // placeholder for backend integration
    // eslint-disable-next-line no-console
    console.log("[ArtworkEditor] submit", payload);
    window.alert("저장 동작은 아직 API 연동 전입니다. 콘솔 로그를 확인해 주세요.");
  };

  const setTitle = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], title: value } }));
  };

  const setDescription = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], description: value } }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            현재 행사:{" "}
            <span className="font-medium text-zinc-900">{selectedEvent?.name ?? "-"}</span>
          </p>
          {mode === "edit" ? (
            <p className="mt-1 text-xs text-zinc-500">
              편집 대상 ID: <span className="font-medium text-zinc-700">{artworkId ?? "-"}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            QR 대신 COLMAP 기반 3D 좌표 인식(X/Y/Z)과 반경(Trigger Radius)로 노출 지점을 정의합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/locations"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            뒤로
          </Link>
          <button
            type="submit"
            form={titleId}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            저장
          </button>
        </div>
      </div>

      <form id={titleId} onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-zinc-900">기본 정보 (다국어)</div>
            <LanguageTabs value={activeLang} onChange={setActiveLang} />
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700" htmlFor={`title-${activeLang}`}>
                작품명 ({activeLang.toUpperCase()})
              </label>
              <input
                id={`title-${activeLang}`}
                value={localized[activeLang].title}
                onChange={(e) => setTitle(activeLang, e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none"
                placeholder="예) 광안리 밤바다의 빛"
              />
            </div>

            <div>
              <label
                className="text-xs font-medium text-zinc-700"
                htmlFor={`description-${activeLang}`}
              >
                설명 ({activeLang.toUpperCase()})
              </label>
              <textarea
                id={`description-${activeLang}`}
                value={localized[activeLang].description}
                onChange={(e) => setDescription(activeLang, e.target.value)}
                className="mt-1 min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none"
                placeholder="작품 소개, 운영 안내, 관람 팁 등을 입력하세요."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">공간 좌표 (Spatial Data)</div>
            <div className="mt-1 text-xs text-zinc-500">COLMAP 추출 좌표값을 입력합니다.</div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-zinc-700" htmlFor="colmap-x">
                  X
                </label>
                <input
                  id="colmap-x"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  value={x}
                  onChange={(e) => setX(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700" htmlFor="colmap-y">
                  Y
                </label>
                <input
                  id="colmap-y"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  value={y}
                  onChange={(e) => setY(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700" htmlFor="colmap-z">
                  Z
                </label>
                <input
                  id="colmap-z"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  value={z}
                  onChange={(e) => setZ(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-zinc-900">인식 반경 (Trigger Radius)</div>
                <div className="mt-1 text-xs text-zinc-500">좌표 근처 몇 m에서 콘텐츠를 띄울지 설정합니다.</div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-900">
                {triggerRadiusMeters}m
              </div>
            </div>

            <div className="mt-3">
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={triggerRadiusMeters}
                onChange={(e) => setTriggerRadiusMeters(Number(e.target.value))}
                className="w-full accent-zinc-900"
                aria-label="Trigger Radius meters"
              />
              <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                <span>1m</span>
                <span>25m</span>
                <span>50m</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-900">미디어 업로드</div>
          <div className="mt-1 text-xs text-zinc-500">
            작품 이미지 1장과 AR 마커 학습용 이미지(데이터셋)를 업로드합니다.
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium text-zinc-700">작품 이미지</div>
              <FileDropzone
                label="이미지를 드래그앤드롭 또는 클릭"
                accept="image/*"
                multiple={false}
                value={artworkImage ? [artworkImage] : []}
                onChange={(files) => setArtworkImage(files[0] ?? null)}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-zinc-700">AR 마커용 이미지 (학습 데이터셋)</div>
              <FileDropzone
                label="여러 장 업로드 가능 (권장)"
                accept="image/*"
                multiple
                value={markerImages}
                onChange={(files) => setMarkerImages(files)}
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
