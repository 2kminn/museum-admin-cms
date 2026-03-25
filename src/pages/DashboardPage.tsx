import React, { useMemo } from "react";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEventContext } from "../context/EventContext";

type DailyVisitors = { date: string; visitors: number };
type LanguageShare = { name: string; value: number };

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function percent(n: number) {
  return `${Math.round(n * 100)}%`;
}

const PALETTE = ["#0A0A0A", "#2563EB", "#16A34A", "#DC2626", "#7C3AED", "#F59E0B"];

export function DashboardPage() {
  const { selectedEvent } = useEventContext();

  // Mock data (placeholder until API 연결)
  const daily: DailyVisitors[] = useMemo(
    () => [
      { date: "03/18", visitors: 1180 },
      { date: "03/19", visitors: 1420 },
      { date: "03/20", visitors: 1890 },
      { date: "03/21", visitors: 2320 },
      { date: "03/22", visitors: 3080 },
      { date: "03/23", visitors: 2710 },
      { date: "03/24", visitors: 3540 },
    ],
    [],
  );

  const languages: LanguageShare[] = useMemo(
    () => [
      { name: "한국어", value: 62 },
      { name: "English", value: 18 },
      { name: "日本語", value: 10 },
      { name: "中文", value: 10 },
    ],
    [],
  );

  const totalVisitors = useMemo(() => daily.reduce((acc, d) => acc + d.visitors, 0), [daily]);
  const arRuns = useMemo(() => Math.round(totalVisitors * 1.7), [totalVisitors]);
  const avgDwellSeconds = 6 * 60 + 25;

  const foreignShare = useMemo(() => {
    const total = languages.reduce((acc, l) => acc + l.value, 0) || 1;
    const kr = languages.find((l) => l.name === "한국어")?.value ?? 0;
    return Math.max(0, Math.min(1, 1 - kr / total));
  }, [languages]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-600">
          현재 행사: <span className="font-medium text-zinc-900">{selectedEvent?.name ?? "-"}</span>
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-zinc-600">총 방문자 수</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{formatNumber(totalVisitors)}</div>
          <div className="mt-1 text-xs text-zinc-500">최근 7일 합계</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-zinc-600">AR 실행 횟수</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{formatNumber(arRuns)}</div>
          <div className="mt-1 text-xs text-zinc-500">추정치(방문 대비 실행율)</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-zinc-600">평균 체류 시간</div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700">
              관광객 비중 {percent(foreignShare)}
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{formatDuration(avgDwellSeconds)}</div>
          <div className="mt-1 text-xs text-zinc-500">현장 체류 기반 추정</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-900">일별 방문자 추이</div>
              <div className="mt-1 text-xs text-zinc-500">최근 7일</div>
            </div>
            <div className="text-[11px] font-medium text-zinc-500">Visitors / day</div>
          </div>

          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={36}
                />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value)), "방문자"]}
                  labelFormatter={(label) => `날짜 ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#0A0A0A"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-900">언어별 사용자 비중</div>
              <div className="mt-1 text-xs text-zinc-500">
                외국인 타겟팅 지표:{" "}
                <span className="font-semibold text-zinc-900">비한국어 {percent(foreignShare)}</span>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700">
              Tourist Share
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languages}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {languages.map((_, idx) => (
                      <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "비중"]} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-600">관광객(비한국어) 비중</div>
                  <div className="text-sm font-semibold text-zinc-900">{percent(foreignShare)}</div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-900"
                    style={{ width: `${Math.round(foreignShare * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  한국어 외 언어(EN/JP/CN)를 관광객 지표로 집계합니다.
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs font-semibold text-zinc-900">운영 팁</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-4 text-zinc-600">
                  <li>관광객 비중이 높으면 다국어 안내/스태프 배치를 강화하세요.</li>
                  <li>AR 실행 대비 방문자 수가 낮으면 현장 사인/유도 동선을 점검하세요.</li>
                  <li>체류 시간이 짧으면 트리거 반경/콘텐츠 길이를 조정해 보세요.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

