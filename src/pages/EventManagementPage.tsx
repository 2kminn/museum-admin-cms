import { useEventContext } from "../context/EventContext";

export function EventManagementPage() {
  const { selectedEvent } = useEventContext();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">행사 관리</h1>
        <p className="mt-1 text-sm text-zinc-600">
          현재 선택된 행사: <span className="font-medium text-zinc-900">{selectedEvent?.name ?? "-"}</span>
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">기본 정보</div>
          <div className="mt-2 text-sm text-zinc-600">행사명, 기간, 운영 상태 등을 관리합니다.</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">운영 체크리스트</div>
          <div className="mt-2 text-sm text-zinc-600">현장 운영자용 빠른 점검 항목을 제공합니다.</div>
        </div>
      </section>
    </div>
  );
}
