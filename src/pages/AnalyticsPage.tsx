export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">데이터 통계 (Analytics)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          방문, 스캔, 체류 시간 등 KPI를 확인합니다.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">요약 지표</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            주요 수치를 카드/배지로 표시합니다.
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">추이 그래프</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            시간대별 트렌드 차트를 표시합니다.
          </div>
        </div>
      </section>
    </div>
  );
}
