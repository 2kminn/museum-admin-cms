import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CirclePlus,
  Filter,
  QrCode,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEventContext } from "../context/EventContext";
import { LanguageTabs, type LanguageKey } from "../components/LanguageTabs";
import { FileDropzone } from "../components/FileDropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
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
} from "../lib/localArtworksStore";
import {
  apiDeleteArtwork,
  apiListArtworksForEvent,
  apiListVenues,
  apiSaveArtworkForEvent,
  apiUploadArtworkMedia,
  type ApiVenue,
} from "../lib/api";

type LocalizedText = ArtworkRecord["localized"];

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
    return "이미지 스토리지 업로드가 브라우저에서 차단됐습니다. 스토리지 CORS 설정을 확인해 주세요.";
  }
  if (message.startsWith("UPLOAD_FAILED_")) {
    return "이미지 업로드에 실패했습니다. 파일 크기와 네트워크 상태를 확인해 주세요.";
  }
  if (message) return `저장 실패: ${message}`;
  return "저장 중 오류가 발생했습니다. 파일/입력 값을 확인해 주세요.";
}

export function LocationsArtworksPage() {
  const { selectedEvent } = useEventContext();
  const eventId = selectedEvent?.id ?? "";
  const navigate = useNavigate();

  const [tab, setTab] = useState<"list" | "form">("list");

  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [venues, setVenues] = useState<ApiVenue[]>([]);
  const [loadedForEventId, setLoadedForEventId] = useState<string>("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ArtworkStatus>("all");

  const [activeLang, setActiveLang] = useState<LanguageKey>("ko");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [localized, setLocalized] = useState<LocalizedText>(() => createEmptyLocalizedText());
  const [status, setStatus] = useState<ArtworkStatus>("draft");
  const [artist, setArtist] = useState("");
  const [mediaType, setMediaType] = useState<ArtworkMediaType>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedVenueId, setSelectedVenueId] = useState("");

  const [artworkImage, setArtworkImage] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [notice, setNotice] = useState<CmsNoticeState | null>(null);

  const showNotice = (nextNotice: CmsNoticeState) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    if (!eventId) return;
    if (loadedForEventId === eventId) return;
    let cancelled = false;

    Promise.all([apiListArtworksForEvent(eventId), apiListVenues(eventId)])
      .then(([loaded, loadedVenues]) => {
        if (cancelled) return;
        setArtworks(loaded);
        setVenues(loadedVenues);
        setLoadedForEventId(eventId);
        setTab("list");
        setEditingId(null);
      })
      .catch(() => {
        if (cancelled) return;
        const loaded = loadArtworksForEvent(eventId);
        setArtworks(loaded);
        setVenues([]);
        setLoadedForEventId(eventId);
        setTab("list");
        setEditingId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, loadedForEventId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artworks
      .filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (!q) return true;
        const hay = `${a.id} ${a.localized.ko.title} ${a.artist ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.updatedAt < b.updatedAt ? 1 : -1;
      });
  }, [artworks, query, statusFilter]);

  const resetForm = () => {
    setActiveLang("ko");
    setEditingId(null);
    setLocalized(createEmptyLocalizedText());
    setStatus("draft");
    setArtist("");
    setMediaType("image");
    setMediaUrl("");
    setSortOrder("0");
    setSelectedVenueId(venues[0]?.id ?? "");
    setArtworkImage(null);
    setExistingThumbnail(null);
  };

  const startCreate = () => {
    resetForm();
    setTab("form");
    navigate("/cms/artworks/new");
  };

  const startEdit = (item: ArtworkRecord) => {
    setEditingId(item.id);
    setActiveLang("ko");
    setLocalized(item.localized);
    setStatus(item.status);
    setArtist(item.artist ?? "");
    setMediaType(item.mediaType);
    setMediaUrl(item.mediaUrl ?? "");
    setSortOrder(String(item.sortOrder ?? 0));
    setSelectedVenueId(item.venueId ?? "");
    setArtworkImage(null);
    setExistingThumbnail(item.media.thumbnailDataUrl);
    setTab("form");
  };

  const cancelEdit = () => {
    resetForm();
    setTab("list");
  };

  const setTitle = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], title: value } }));
  };

  const setDescription = (lang: LanguageKey, value: string) => {
    setLocalized((prev) => ({ ...prev, [lang]: { ...prev[lang], description: value } }));
  };

  const onSave = async (e: React.FormEvent) => {
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
      const isEditing = Boolean(editingId);
      const existing = isEditing ? artworks.find((a) => a.id === editingId) : undefined;
      if (isEditing && !existing) {
        showNotice({
          tone: "error",
          message: "수정 대상이 목록에서 사라졌습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.",
        });
        setTab("list");
        setEditingId(null);
        return;
      }

      const id = isEditing ? (editingId as string) : generateArtworkId();
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
          thumbnailDataUrl:
            nextMediaUrl ?? (isEditing && existing ? existing.media.thumbnailDataUrl : null),
          artworkImageName:
            artworkImage?.name ?? (isEditing && existing ? existing.media.artworkImageName : null),
          markerImages: isEditing && existing ? existing.media.markerImages : null,
        },
        createdAt,
        updatedAt: nowIso(),
      };

      const savedRecord = await apiSaveArtworkForEvent(eventId, record, isEditing);

      const next = isEditing
        ? artworks.map((a) => (a.id === id ? savedRecord : a))
        : [savedRecord, ...artworks];

      setArtworks(next);

      // eslint-disable-next-line no-console
      console.log("[ArtworkManagement] save payload", savedRecord);
      showNotice({ tone: "success", message: "저장 완료" });
      resetForm();
      setTab("list");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ArtworkManagement] save failed", error);
      showNotice({ tone: "error", message: saveErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const formTitle = useMemo(() => {
    if (editingId) return `작품 수정 (#${editingId})`;
    return "새 작품 등록";
  }, [editingId]);

  const editingArtwork = useMemo(
    () => artworks.find((artwork) => artwork.id === editingId) ?? null,
    [artworks, editingId],
  );

  const onDelete = (id: string) => {
    if (!eventId) {
      showNotice({ tone: "error", message: "먼저 상단에서 행사를 선택해 주세요." });
      return;
    }
    const target = artworks.find((a) => a.id === id);
    if (!target) return;
    const ok = window.confirm(
      `작품을 삭제할까요?\n\n- 작품명(KR): ${target.localized.ko.title || "(제목 없음)"}\n- ID: ${target.id}\n\n삭제하면 로컬 목록에서 제거되며 되돌릴 수 없습니다.`,
    );
    if (!ok) return;

    apiDeleteArtwork(id)
      .then(() => {
        const next = artworks.filter((a) => a.id !== id);
        setArtworks(next);
        saveArtworksForEvent(eventId, next);
        if (editingId === id) {
          resetForm();
          setTab("list");
        }
        showNotice({ tone: "success", message: "삭제 완료" });
      })
      .catch(() => {
        showNotice({ tone: "error", message: "삭제 중 오류가 발생했습니다. 다시 시도해 주세요." });
      });
  };

  const goEdit = (id: string) => {
    navigate(`/cms/artworks/${id}/edit`);
  };

  return (
    <div className="space-y-5">
      <CmsNotice notice={notice} onClose={() => setNotice(null)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            작품 QR 관리
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            작품 정보와 출력용 QR 코드를 관리합니다.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            현재 행사:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedEvent?.name ?? "-"}
            </span>
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "form")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">작품 관리</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                목록에서 항목을 눌러 수정 화면으로 이동합니다.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TabsContent value="list">
              <div className="grid gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        placeholder="작품명(KR), 작가명 또는 ID 검색"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-zinc-500" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | ArtworkStatus)}
                        className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        aria-label="상태 필터"
                      >
                        <option value="all">전체</option>
                        <option value="active">노출</option>
                        <option value="draft">초안</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <CirclePlus className="h-4 w-4" />
                    작품 등록
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="overflow-x-auto">
                    <table className="min-w-[780px] w-full table-fixed text-left text-sm">
                      <thead className="bg-zinc-50 text-xs font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                        <tr>
                          <th className="w-[72px] px-3 py-2">썸네일</th>
                          <th className="px-3 py-2">작품명 (KR)</th>
                          <th className="w-[300px] px-3 py-2">QR</th>
                          <th className="w-[120px] px-3 py-2">상태</th>
                          <th className="w-[120px] px-3 py-2 text-right">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                        {filtered.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                            >
                              등록된 작품이 없습니다.{" "}
                              <button
                                type="button"
                                onClick={startCreate}
                                className="font-semibold text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
                              >
                                새 작품 등록
                              </button>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((item) => (
                            <tr
                              key={item.id}
                              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                              onClick={() => goEdit(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") goEdit(item.id);
                              }}
                              tabIndex={0}
                              role="button"
                            >
                              <td className="px-3 py-2">
                                <div className="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                                  <ArtworkMediaPreview
                                    src={item.media.thumbnailDataUrl}
                                    title={item.localized.ko.title}
                                    fileName={item.media.artworkImageName}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.localized.ko.title}
                                </div>
                                <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                  {item.artist || "작가 미상"}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  ID: {item.id}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  code: {item.code ?? "-"}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  {item.qrUrl ? (
                                    <ArtworkQrCard
                                      title={item.localized.ko.title}
                                      artist={item.artist}
                                      code={item.code}
                                      qrUrl={item.qrUrl}
                                      compact
                                    />
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-2 py-1 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                                      <QrCode className="h-3.5 w-3.5" />
                                      저장 후 생성
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={[
                                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
                                    badgeClasses(item.status),
                                  ].join(" ")}
                                >
                                  {item.status === "active" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : null}
                                  {statusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                  }}
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
                                  aria-label="작품 삭제"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">삭제</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div>
                    총 <span className="font-semibold text-zinc-900">{filtered.length}</span>개 (행사별 저장: 로컬)
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      노출
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      초안
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="form">
              <form onSubmit={onSave} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formTitle}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      QR code/qr_url은 백엔드 저장 응답에서 자동 생성됩니다.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <X className="h-4 w-4" />
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={[
                        "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800",
                        isSaving ? "opacity-70" : "",
                      ].join(" ")}
                    >
                      <Save className="h-4 w-4" />
                      저장
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                  <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        다국어 콘텐츠
                      </div>
                      <LanguageTabs value={activeLang} onChange={setActiveLang} />
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div>
                        <label
                          className="text-xs font-medium text-zinc-700"
                          htmlFor={`title-${activeLang}`}
                        >
                          작품명 ({activeLang.toUpperCase()})
                        </label>
                        <input
                          id={`title-${activeLang}`}
                          value={localized[activeLang].title}
                          onChange={(e) => setTitle(activeLang, e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
                          className="mt-1 min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          placeholder="작품 소개, 운영 안내, 관람 팁 등을 입력하세요."
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
                          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          placeholder="예) 홍길동"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">QR 코드</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        qr_url 값을 그대로 렌더링합니다. PC 브라우저에서는 열리지 않는 앱 전용 링크입니다.
                      </div>
                      <div className="mt-3">
                        <ArtworkQrCard
                          title={localized.ko.title}
                          artist={artist}
                          code={editingArtwork?.code ?? null}
                          qrUrl={editingArtwork?.qrUrl ?? null}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">상태</div>
                          <div className="mt-1 text-xs text-zinc-500">노출 여부/운영 상태를 설정합니다.</div>
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
                          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        >
                          <option value="draft">초안 (숨김/준비중)</option>
                          <option value="active">노출</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">등록 설정</div>
                      <div className="mt-3 grid gap-3">
                        <div>
                          <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-venue">
                            장소
                          </label>
                          <select
                            id="artwork-venue"
                            value={selectedVenueId}
                            disabled={Boolean(editingId)}
                            onChange={(e) => setSelectedVenueId(e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            <option value="">기본 장소 자동 선택</option>
                            {venues.map((venue) => (
                              <option key={venue.id} value={venue.id}>
                                {venue.name_i18n.ko || venue.name_i18n.en || venue.id}
                              </option>
                            ))}
                          </select>
                          {editingId ? (
                            <div className="mt-1 text-[11px] text-zinc-500">
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
                              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
                              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">미디어 업로드</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          이미지는 백엔드 업로드 API로 저장합니다. 영상/오디오/3D는 URL을 입력해 저장합니다.
                        </div>
                      </div>
                    </div>

                    {existingThumbnail && !artworkImage ? (
                      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-start gap-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                            <ArtworkMediaPreview
                              src={existingThumbnail}
                              title={localized.ko.title}
                              fileName={editingArtwork?.media.artworkImageName}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              등록된 작품 이미지
                            </div>
                            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                              아래에서 새 JPG/PNG/WebP/GIF 이미지를 선택하면 현재 썸네일을 교체합니다.
                            </div>
                            {editingArtwork?.media.artworkImageName ? (
                              <div className="mt-2 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                파일: {editingArtwork.media.artworkImageName}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="text-xs font-medium text-zinc-700" htmlFor="artwork-media-url">
                          미디어 URL
                        </label>
                        <input
                          id="artwork-media-url"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          placeholder="https://..."
                        />
                        <div className="mt-1 text-[11px] text-zinc-500">
                          파일을 업로드하면 업로드된 이미지 URL이 자동 저장됩니다.
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-medium text-zinc-700">
                          {existingThumbnail ? "썸네일 수정" : "작품 이미지 등록"}
                        </div>
                        <FileDropzone
                          label={existingThumbnail ? "썸네일 수정" : "이미지를 드래그앤드롭 또는 클릭"}
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple={false}
                          value={artworkImage ? [artworkImage] : []}
                          onChange={(files) => setArtworkImage(files[0] ?? null)}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </section>
    </div>
  );
}
