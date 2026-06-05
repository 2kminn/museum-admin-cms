import React, { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  MapPin,
  MessageSquareText,
  Plus,
  UserRound,
} from "lucide-react";
import { useEventContext } from "../context/EventContext";

type ViewMode = "list" | "create";

function inputBaseClasses() {
  return "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function textareaBaseClasses() {
  return "min-h-24 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";
}

function labelClasses() {
  return "text-xs font-medium text-zinc-700 dark:text-zinc-300";
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return "-";
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  return startDate ?? endDate ?? "-";
}

export function EventManagementPage() {
  const { events, selectedEvent, setSelectedEventId, addEvent } = useEventContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [name, setName] = useState("");
  const [exhibitionHallName, setExhibitionHallName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aDate = a.startDate ?? "";
        const bDate = b.startDate ?? "";
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return a.name.localeCompare(b.name, "ko-KR");
      }),
    [events],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    if (!name.trim()) {
      setError("행사명을 입력해 주세요.");
      return;
    }
    if (!exhibitionHallName.trim()) {
      setError("전시관 명을 입력해 주세요.");
      return;
    }
    if (!location.trim()) {
      setError("위치를 입력해 주세요.");
      return;
    }
    if (!startDate || !endDate) {
      setError("행사 기간을 입력해 주세요.");
      return;
    }
    if (startDate > endDate) {
      setError("종료일은 시작일 이후로 입력해 주세요.");
      return;
    }
    if (!organizerName.trim()) {
      setError("주최측명을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await addEvent({
        name,
        exhibitionHallName,
        location,
        startDate,
        endDate,
        organizerName,
        memo,
      });
      setName("");
      setExhibitionHallName("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setOrganizerName("");
      setMemo("");
      setSavedMessage(`${created.name} 행사가 추가되었습니다.`);
      setViewMode("list");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">행사 관리</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          현재 선택된 행사:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {selectedEvent?.name ?? "-"}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-950 sm:w-[22rem]">
          <button
            type="button"
            onClick={() => {
              setViewMode("list");
              setError(null);
            }}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
              viewMode === "list"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            <ListChecks className="h-4 w-4" />
            행사 정보
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("create");
              setSavedMessage(null);
            }}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
              viewMode === "create"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            <Plus className="h-4 w-4" />
            행사 등록
          </button>
        </div>

        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          총 {sortedEvents.length}개 행사
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {savedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {savedMessage}
        </div>
      ) : null}

      {viewMode === "create" ? (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">기본 정보 추가</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                새 행사를 등록하면 상단 행사 선택에 바로 반영됩니다.
              </div>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClasses()} htmlFor="event-name">
                행사명
              </label>
              <input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBaseClasses()}
                placeholder="예) 부산 나이트 웨이브 2026"
              />
            </div>

            <div>
              <label className={labelClasses()} htmlFor="event-hall">
                전시관 명
              </label>
              <div className="relative mt-1">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="event-hall"
                  value={exhibitionHallName}
                  onChange={(e) => setExhibitionHallName(e.target.value)}
                  className={[inputBaseClasses(), "pl-10"].join(" ")}
                  placeholder="예) 부산시립미술관"
                />
              </div>
            </div>

            <div>
              <label className={labelClasses()} htmlFor="event-location">
                위치
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="event-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={[inputBaseClasses(), "pl-10"].join(" ")}
                  placeholder="예) 부산 해운대구 APEC로 58"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClasses()} htmlFor="event-start-date">
                  시작일
                </label>
                <input
                  id="event-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputBaseClasses()}
                />
              </div>
              <div>
                <label className={labelClasses()} htmlFor="event-end-date">
                  종료일
                </label>
                <input
                  id="event-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputBaseClasses()}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses()} htmlFor="event-organizer">
                주최측명
              </label>
              <div className="relative mt-1">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="event-organizer"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className={[inputBaseClasses(), "pl-10"].join(" ")}
                  placeholder="예) ArtAR Busan 운영사무국"
                />
              </div>
            </div>

            <div>
              <label className={labelClasses()} htmlFor="event-memo">
                비고/메모
              </label>
              <div className="relative mt-1">
                <MessageSquareText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <textarea
                  id="event-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className={[textareaBaseClasses(), "pl-10"].join(" ")}
                  placeholder="예) 현장 운영 특이사항, 설치 일정, 담당자 참고 메모"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? "저장 중" : "행사 추가"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">등록된 행사</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                총 {sortedEvents.length}개 행사
              </div>
            </div>
            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              선택: {selectedEvent?.name ?? "-"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {sortedEvents.map((event) => {
              const selected = selectedEvent?.id === event.id;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className={[
                    "w-full rounded-xl border p-4 text-left shadow-sm transition",
                    selected
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-950"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {event.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </div>
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900 dark:text-zinc-100" />
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">전시관</span>{" "}
                      <span className="break-words">{event.exhibitionHallName ?? "-"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">주최</span>{" "}
                      <span className="break-words">{event.organizerName ?? "-"}</span>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">위치</span>{" "}
                      <span className="break-words">{event.location ?? "-"}</span>
                    </div>
                    {event.memo ? (
                      <div className="min-w-0 sm:col-span-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">비고</span>{" "}
                        <span className="break-words">{event.memo}</span>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
