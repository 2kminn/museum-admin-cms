import React, { useEffect, useId, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEventContext } from "../context/EventContext";
import { LanguageTabs, type LanguageKey } from "../components/LanguageTabs";
import { FileDropzone } from "../components/FileDropzone";
import { ArtworkQrCard } from "../components/ArtworkQrCard";
import { ArtworkMediaPreview } from "../components/ArtworkMediaPreview";
import { CmsNotice, type CmsNoticeState } from "../components/CmsNotice";
import {
  createEmptyLocalizedText,
  generateArtworkId,
  loadArtworksForEvent,
  nowIso,
  saveArtworksForEvent,
  type ArtworkMediaType,
  type ArtworkRecord,
  type ArtworkStatus,
  type LocalizedText,
} from "../lib/localArtworksStore";
import {
  apiGetArtwork,
  apiListArtworksForEvent,
  apiListVenues,
  apiSaveArtworkForEvent,
  apiUploadArtworkMedia,
  type ApiVenue,
} from "../lib/api";

type Mode = "create" | "edit";

function badgeClasses(status: ArtworkStatus) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function statusLabel(status: ArtworkStatus) {
  if (status === "active") return "노출";
  return "초안";
}

function saveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNSUPPORTED_UPLOAD_TYPE") {
    return "지원하지 않는 파일 형식입니다. JPG, PNG, WebP, GIF 이미지만 업로드해 주세요.";
  }
  if (message.startsWith("SIGNED_URL_FAILED:")) {
    return "이미지 업로드 URL을 발급받지 못했습니다. 로그인 상태와 백엔드 응답을 확인해 주세요.";
  }
  if (message.startsWith("STORAGE_UPLOAD_FETCH_FAILED:")) {
    return `이미지 스토리지 업로드가 브라우저에서 차단됐습니다. ${message.replace("STORAGE_UPLOAD_FETCH_FAILED:", "")}`;
  }
  if (message.startsWith("UPLOAD_FAILED_")) {
    return "이미지 업로드에 실패했습니다. 파일 크기와 네트워크 상태를 확인해 주세요.";
  }
  if (message) return `저장 실패: ${message}`;
  return "저장 중 오류가 발생했습니다. 파일/입력 값을 확인해 주세요.";
}

export function ArtworkEditorPage({ mode }: { mode: Mode }) {
  const { selectedEvent } = useEventContext();
  const eventId = selectedEvent?.id ?? "";
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const titleId = useId();

  const pageTitle = useMemo(() => {
    if (mode === "edit") return "작품 수정";
    return "작품 등록";
  }, [mode]);

  const [activeLang, setActiveLang] = useState<LanguageKey>("ko");
  const [localized, setLocalized] = useState<LocalizedText>(() => createEmptyLocalizedText());
  const [status, setStatus] = useState<ArtworkStatus>("draft");
  const [artist, setArtist] = useState("");
  const [mediaType, setMediaType] = useState<ArtworkMediaType>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venues, setVenues] = useState<ApiVenue[]>([]);

  const [artworkImage, setArtworkImage] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [currentArtwork, setCurrentArtwork] = useState<ArtworkRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<CmsNoticeState | null>(null);

  const showNotice = (nextNotice: CmsNoticeState) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const applyItem = (item: ArtworkRecord | undefined) => {
      if (!item || cancelled) return;
      setCurrentArtwork(item);
      setActiveLang("ko");
      setLocalized(item.localized);
      setStatus(item.status);
      setArtist(item.artist ?? "");
      setMediaType(item.mediaType);
      setMediaUrl(item.mediaUrl ?? "");
      setSortOrder(String(item.sortOrder ?? 0));
      setSelectedVenueId(item.venueId ?? "");
      setExistingThumbnail(item.media.thumbnailDataUrl);
    };

    apiListVenues(eventId)
      .then((loadedVenues) => {
        if (cancelled) return;
        setVenues(loadedVenues);
        if (mode === "create") setSelectedVenueId((prev) => prev || loadedVenues[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setVenues([]);
      });

    if (mode !== "edit" || !artworkId) return () => {
      cancelled = true;
    };

    apiGetArtwork(eventId, artworkId)
      .then((loaded) => applyItem(loaded))
      .catch(() => {
        const loaded = loadArtworksForEvent(eventId);
        applyItem(loaded.find((a) => a.id === artworkId));
      });

    return () => {
      cancelled = true;
    };
  }, [artworkId, eventId, mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) {
      showNotice({ tone: "error", message: "먼저 상단에서 행사를 선택해 주세요." });
      return;
    }
    if (!localized.ko.title.trim()) {
      showNotice({ tone: "error", message: "작품명(KR)을 입력해 주세요." });
      return;
    }
    if (mediaUrl.trim() && !/^https?:\/\/[^\s]+$/.test(mediaUrl.trim())) {
      showNotice({ tone: "error", message: "미디어 URL은 http:// 또는 https:// 형식이어야 합니다." });
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = mode === "edit";
      const loaded = await apiListArtworksForEvent(eventId).catch(() => loadArtworksForEvent(eventId));
      const existing = isEditing ? loaded.find((a) => a.id === artworkId) : undefined;
      if (isEditing && !existing) {
        showNotice({ tone: "error", message: "수정 대상이 존재하지 않습니다. 목록으로 돌아갑니다." });
        window.setTimeout(() => navigate("/cms/locations"), 900);
        return;
      }

      const id = isEditing ? (artworkId as string) : generateArtworkId();
      const createdAt = isEditing && existing ? existing.createdAt : nowIso();

      const uploadedMediaUrl = artworkImage ? await apiUploadArtworkMedia(artworkImage) : null;
      const nextMediaUrl = uploadedMediaUrl ?? (mediaUrl.trim() || null);

      const record: ArtworkRecord = {
        id,
        code: existing?.code ?? null,
        qrUrl: existing?.qrUrl ?? null,
        venueId: isEditing ? (existing?.venueId ?? (selectedVenueId || null)) : selectedVenueId || null,
        eventId,
        status,
        artist: artist.trim() || null,
        mediaUrl: nextMediaUrl,
        mediaType,
        sortOrder: Math.max(0, Number(sortOrder) || 0),
        localized,
        spatial: existing?.spatial ?? {
          x: null,
          y: null,
          z: null,
          triggerRadiusMeters: 10,
        },
        media: {
          thumbnailDataUrl: nextMediaUrl ?? (isEditing && existing ? existing.media.thumbnailDataUrl : null),
          artworkImageName: artworkImage?.name ?? (isEditing && existing ? existing.media.artworkImageName : null),
          markerImages: isEditing && existing ? existing.media.markerImages : null,
        },
        createdAt,
        updatedAt: nowIso(),
      };

      const savedRecord = await apiSaveArtworkForEvent(eventId, record, isEditing);
      const next = isEditing
        ? loaded.map((a) => (a.id === id ? savedRecord : a))
        : [savedRecord, ...loaded];
      saveArtworksForEvent(eventId, next);

      // eslint-disable-next-line no-console
      console.log("[ArtworkEditor] save payload", savedRecord);
      showNotice({ tone: "success", message: "저장 완료" });
      window.setTimeout(() => navigate("/cms/locations"), 700);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ArtworkEditor] save failed", error);
      showNotice({ tone: "error", message: saveErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const setTitle = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], title: value } }));
  };

  const setDescription = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], description: value } }));
  };

  return (
    <div className="space-y-5">
      <CmsNotice notice={notice} onClose={() => setNotice(null)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{pageTitle}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            현재 행사:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedEvent?.name ?? "-"}
            </span>
          </p>
          {mode === "edit" ? (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              편집 대상 ID:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{artworkId ?? "-"}</span>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            QR 식별값(code)은 백엔드가 자동 채번하며, CMS는 응답의 qr_url을 그대로 QR로 출력합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cms/locations"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            뒤로
          </Link>
          <button
            type="submit"
            form={titleId}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            저장
          </button>
        </div>
      </div>

      <form id={titleId} onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              기본 정보 (다국어)
            </div>
            <LanguageTabs value={activeLang} onChange={setActiveLang} />
          </div>

          <div className="mt-4 grid gap-3">
            {mode === "edit" && existingThumbnail ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <div className="aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <ArtworkMediaPreview
                      src={existingThumbnail}
                      title={localized.ko.title}
                      fileName={currentArtwork?.media.artworkImageName}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      등록된 작품 이미지
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      작품 이미지와 설명을 함께 확인하며 수정할 수 있습니다.
                    </div>
                    {currentArtwork?.media.artworkImageName ? (
                      <div className="mt-2 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        파일: {currentArtwork.media.artworkImageName}
                      </div>
                    ) : null}
                    <a
                      href={existingThumbnail}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-[11px] font-semibold text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
                    >
                      이미지 URL 열기
                    </a>
                    <div className="mt-3">
                      <div className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        썸네일 수정
                      </div>
                      <FileDropzone
                        label="새 이미지를 드래그앤드롭 또는 클릭"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple={false}
                        value={artworkImage ? [artworkImage] : []}
                        onChange={(files) => setArtworkImage(files[0] ?? null)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-xs font-medium text-zinc-700" htmlFor={`title-${activeLang}`}>
                작품명 ({activeLang.toUpperCase()})
              </label>
              <input
                id={`title-${activeLang}`}
                value={localized[activeLang].title}
                onChange={(e) => setTitle(activeLang, e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="예) 광안리 밤바다의 빛"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-artist">
                작가
              </label>
              <input
                id="artwork-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="예) 홍길동"
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
                className="mt-1 min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="작품 소개, 운영 안내, 관람 팁 등을 입력하세요."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">QR 코드</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              앱 전용 딥링크라 PC 브라우저에서는 열리지 않습니다.
            </div>
            <div className="mt-3">
              <ArtworkQrCard
                title={localized.ko.title}
                artist={artist}
                code={currentArtwork?.code ?? null}
                qrUrl={currentArtwork?.qrUrl ?? null}
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">상태</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  작품의 노출 여부를 설정합니다.
                </div>
              </div>
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
                  badgeClasses(status),
                ].join(" ")}
              >
                {statusLabel(status)}
              </span>
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-status">
                상태
              </label>
              <select
                id="artwork-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArtworkStatus)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="draft">초안 (숨김/준비중)</option>
                <option value="active">노출</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">등록 설정</div>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-venue">
                  장소
                </label>
                <select
                  id="artwork-venue"
                  value={selectedVenueId}
                  disabled={mode === "edit"}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">기본 장소 자동 선택</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name_i18n.ko || venue.name_i18n.en || venue.id}
                    </option>
                  ))}
                </select>
                {mode === "edit" ? (
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    기존 작품의 장소 변경은 백엔드 수정 API에서 지원하지 않아 비활성화했습니다.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-media-type">
                    미디어 타입
                  </label>
                  <select
                    id="artwork-media-type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as ArtworkMediaType)}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="image">이미지</option>
                    <option value="video">영상</option>
                    <option value="audio">오디오</option>
                    <option value="model3d">3D 모델</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-sort-order">
                    정렬 순서
                  </label>
                  <input
                    id="artwork-sort-order"
                    type="number"
                    min={0}
                    step={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">미디어 업로드</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            이미지는 백엔드 업로드 API로 저장합니다. 영상/오디오/3D는 URL을 입력해 저장합니다.
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-media-url">
                미디어 URL
              </label>
              <input
                id="artwork-media-url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="https://..."
              />
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                파일을 업로드하면 업로드된 이미지 URL이 자동 저장됩니다.
              </div>
            </div>
            {mode === "create" || !existingThumbnail ? (
            <div>
              <div className="mb-2 text-xs font-medium text-zinc-700">
                {mode === "edit" && existingThumbnail ? "썸네일 수정" : "작품 이미지 등록"}
              </div>
              <FileDropzone
                label={mode === "edit" && existingThumbnail ? "썸네일 수정" : "이미지를 드래그앤드롭 또는 클릭"}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple={false}
                value={artworkImage ? [artworkImage] : []}
                onChange={(files) => setArtworkImage(files[0] ?? null)}
              />
            </div>
            ) : null}
          </div>
        </section>
      </form>
    </div>
  );
}
