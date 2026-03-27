import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CirclePlus,
  Filter,
  ImageIcon,
  Pencil,
  Save,
  Search,
  X,
} from "lucide-react";
import { useEventContext } from "../context/EventContext";
import { LanguageTabs, type LanguageKey } from "../components/LanguageTabs";
import { FileDropzone } from "../components/FileDropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import {
  createEmptyLocalizedText,
  fileToDataUrl,
  generateArtworkId,
  loadArtworksForEvent,
  nowIso,
  saveArtworksForEvent,
  type ArtworkRecord,
  type ArtworkStatus,
} from "../lib/localArtworksStore";

type LocalizedText = ArtworkRecord["localized"];

function badgeClasses(status: ArtworkStatus) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function statusLabel(status: ArtworkStatus) {
  if (status === "active") return "노출";
  return "초안";
}

function formatCoord(n: number | null) {
  if (n === null || Number.isNaN(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toFixed(2);
  if (abs >= 10) return n.toFixed(3);
  return n.toFixed(4);
}

export function LocationsArtworksPage() {
  const { selectedEvent } = useEventContext();
  const eventId = selectedEvent?.id ?? "";

  const [tab, setTab] = useState<"list" | "form">("list");

  const [artworks, setArtworks] = useState<ArtworkRecord[]>([]);
  const [loadedForEventId, setLoadedForEventId] = useState<string>("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ArtworkStatus>("all");

  const [activeLang, setActiveLang] = useState<LanguageKey>("ko");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSaving, setIsSaving] = useState(false);

  const [localized, setLocalized] = useState<LocalizedText>(() => createEmptyLocalizedText());
  const [x, setX] = useState<string>("");
  const [y, setY] = useState<string>("");
  const [z, setZ] = useState<string>("");
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState<number>(10);
  const [status, setStatus] = useState<ArtworkStatus>("draft");

  const [artworkImage, setArtworkImage] = useState<File | null>(null);
  const [markerImages, setMarkerImages] = useState<File[]>([]);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingMarkers, setExistingMarkers] = useState<number>(0);

  useEffect(() => {
    if (!eventId) return;
    if (loadedForEventId === eventId) return;
    const loaded = loadArtworksForEvent(eventId);
    setArtworks(loaded);
    setLoadedForEventId(eventId);
    setTab("list");
    setEditingId(null);
  }, [eventId, loadedForEventId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artworks
      .filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (!q) return true;
        const hay = `${a.id} ${a.localized.ko.title}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [artworks, query, statusFilter]);

  const resetForm = () => {
    setActiveLang("ko");
    setEditingId(null);
    setMode("create");
    setLocalized(createEmptyLocalizedText());
    setX("");
    setY("");
    setZ("");
    setTriggerRadiusMeters(10);
    setStatus("draft");
    setArtworkImage(null);
    setMarkerImages([]);
    setExistingThumbnail(null);
    setExistingMarkers(0);
  };

  const startCreate = () => {
    resetForm();
    setMode("create");
    setTab("form");
  };

  const startEdit = (item: ArtworkRecord) => {
    setMode("edit");
    setEditingId(item.id);
    setActiveLang("ko");
    setLocalized(item.localized);
    setX(item.spatial.x === null ? "" : String(item.spatial.x));
    setY(item.spatial.y === null ? "" : String(item.spatial.y));
    setZ(item.spatial.z === null ? "" : String(item.spatial.z));
    setTriggerRadiusMeters(item.spatial.triggerRadiusMeters ?? 10);
    setStatus(item.status);
    setArtworkImage(null);
    setMarkerImages([]);
    setExistingThumbnail(item.media.thumbnailDataUrl);
    setExistingMarkers(item.media.markerImages?.length ?? 0);
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
      window.alert("먼저 상단에서 행사를 선택해 주세요.");
      return;
    }
    if (!localized.ko.title.trim()) {
      window.alert("작품명(KR)을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const existing = mode === "edit" ? artworks.find((a) => a.id === editingId) : undefined;
      const id = mode === "edit" && existing ? existing.id : generateArtworkId();
      const createdAt = mode === "edit" && existing ? existing.createdAt : nowIso();

      const thumbnailDataUrl =
        artworkImage && artworkImage.type.startsWith("image/")
          ? await fileToDataUrl(artworkImage)
          : null;

      const record: ArtworkRecord = {
        id,
        eventId,
        status,
        localized,
        spatial: {
          x: x.trim() === "" ? null : Number(x),
          y: y.trim() === "" ? null : Number(y),
          z: z.trim() === "" ? null : Number(z),
          triggerRadiusMeters,
        },
        media: {
          thumbnailDataUrl:
            thumbnailDataUrl ?? (mode === "edit" && existing ? existing.media.thumbnailDataUrl : null),
          artworkImageName:
            artworkImage?.name ?? (mode === "edit" && existing ? existing.media.artworkImageName : null),
          markerImages:
            markerImages.length > 0
              ? markerImages.map((f) => ({ fileName: f.name, size: f.size }))
              : mode === "edit" && existing
                ? existing.media.markerImages
                : null,
        },
        createdAt,
        updatedAt: nowIso(),
      };

      const next =
        mode === "edit"
          ? artworks.map((a) => (a.id === id ? record : a))
          : [record, ...artworks];

      setArtworks(next);
      saveArtworksForEvent(eventId, next);

      // placeholder for backend integration
      // eslint-disable-next-line no-console
      console.log("[ArtworkManagement] save payload", record);
      window.alert("저장 완료(로컬). API 연동 시 이 JSON + 파일 업로드를 전송하면 됩니다.");
      setTab("list");
      setEditingId(null);
    } catch {
      window.alert("저장 중 오류가 발생했습니다. 파일/입력 값을 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const formTitle = useMemo(() => {
    if (mode === "edit") return `작품 수정 (#${editingId ?? "-"})`;
    return "새 작품 등록";
  }, [editingId, mode]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            장소 및 작품 설정
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            AR 스팟(장소)과 연결 작품/템플릿을 구성합니다.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            현재 행사:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedEvent?.name ?? "-"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <CirclePlus className="h-4 w-4" />
            작품 등록
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">장소 목록</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            지도 기반 장소 등록/수정 UI가 들어갈 영역입니다.
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "form")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">작품 관리</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  목록(Overview)에서 편집 → 등록/수정 탭으로 전환합니다.
                </div>
              </div>
              <TabsList>
                <TabsTrigger value="list">
                  <span>목록</span>
                </TabsTrigger>
                <TabsTrigger value="form">
                  <span>등록/수정</span>
                </TabsTrigger>
              </TabsList>
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
                          placeholder="작품명(KR) 또는 ID 검색"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-zinc-500" />
                        <select
                          value={statusFilter}
                          onChange={(e) =>
                            setStatusFilter(e.target.value as "all" | ArtworkStatus)
                          }
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <CirclePlus className="h-4 w-4" />
                      새로 만들기
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full table-fixed text-left text-sm">
                        <thead className="bg-zinc-50 text-xs font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                          <tr>
                            <th className="w-[72px] px-3 py-2">썸네일</th>
                            <th className="px-3 py-2">작품명 (KR)</th>
                            <th className="w-[220px] px-3 py-2">공간 좌표 (X, Y, Z)</th>
                            <th className="w-[120px] px-3 py-2">상태</th>
                            <th className="w-[104px] px-3 py-2 text-right">편집</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
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
                              <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
                                <td className="px-3 py-2">
                                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                                    {item.media.thumbnailDataUrl ? (
                                      <img
                                        src={item.media.thumbnailDataUrl}
                                        alt={item.localized.ko.title || "작품 이미지"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                        <ImageIcon className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {item.localized.ko.title}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">#{item.id}</div>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                                  {formatCoord(item.spatial.x)}, {formatCoord(item.spatial.y)}, {formatCoord(item.spatial.z)}
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
                                    onClick={() => startEdit(item)}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    수정
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
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formTitle}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          공간 좌표(X/Y/Z) + 반경(Trigger Radius)로 노출 지점을 정의합니다.
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
                      </div>
                    </section>

                    <section className="space-y-4">
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
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">공간 좌표</div>
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
                              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
                              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
                              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                              placeholder="0.0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">인식 반경</div>
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
                            aria-label="인식 반경(m)"
                          />
                          <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                            <span>1m</span>
                            <span>25m</span>
                            <span>50m</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">미디어 업로드</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            작품 이미지 1장과 COLMAP 학습용 이미지(데이터셋)를 업로드합니다.
                          </div>
                        </div>
                        {existingMarkers > 0 ? (
                          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700">
                            기존 학습 이미지 {existingMarkers}장
                          </div>
                        ) : null}
                      </div>

                      {existingThumbnail && !artworkImage ? (
                        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                              <img
                                src={existingThumbnail}
                                alt="기존 작품 이미지"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                기존 작품 이미지
                              </div>
                              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                새 파일을 업로드하면 교체됩니다.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <div className="mb-2 text-xs font-medium text-zinc-700">작품 이미지 (고해상도)</div>
                          <FileDropzone
                            label="이미지를 드래그앤드롭 또는 클릭"
                            accept="image/*"
                            multiple={false}
                            value={artworkImage ? [artworkImage] : []}
                            onChange={(files) => setArtworkImage(files[0] ?? null)}
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-xs font-medium text-zinc-700">
                            COLMAP 학습 이미지
                          </div>
                          <FileDropzone
                            label="여러 장 업로드 가능 (권장)"
                            accept="image/*"
                            multiple
                            value={markerImages}
                            onChange={(files) => setMarkerImages(files)}
                          />
                          <div className="mt-2 text-[11px] text-zinc-500">
                            저장 시 로컬에는 파일 메타(이름/크기)만 보관합니다. 실제 업로드는 API 연동 시 `multipart/form-data`로 전송하세요.
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
