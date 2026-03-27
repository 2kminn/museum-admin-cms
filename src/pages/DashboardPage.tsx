import React, { useCallback, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEventContext } from "../context/EventContext";
import { useTheme } from "../context/ThemeContext";

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

const PALETTE_LIGHT = ["#18181B", "#2563EB", "#16A34A", "#DC2626", "#7C3AED", "#F59E0B"];
const PALETTE_DARK = ["#E4E4E7", "#60A5FA", "#4ADE80", "#F87171", "#C4B5FD", "#FBBF24"];

export function DashboardPage() {
  const { selectedEvent } = useEventContext();
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const [activeLanguageIndex, setActiveLanguageIndex] = useState<number | null>(null);

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

  const renderActiveLanguageSlice = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={Math.max(0, innerRadius - 2)}
        outerRadius={outerRadius * 1.05}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  }, []);

  const chartTheme = useMemo(() => {
    if (isDark) {
      return {
        axisText: "#D4D4D8",
        tooltipBg: "#09090B",
        tooltipBorder: "#27272A",
        seriesStroke: "#E4E4E7",
        piePalette: PALETTE_DARK,
      };
    }

    return {
      axisText: "#52525B",
      tooltipBg: "#FFFFFF",
      tooltipBorder: "#E4E4E7",
      seriesStroke: "#18181B",
      piePalette: PALETTE_LIGHT,
    };
  }, [isDark]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          현재 행사:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {selectedEvent?.name ?? "-"}
          </span>
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">총 방문자 수</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {formatNumber(totalVisitors)}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">최근 7일 합계</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">AR 실행 횟수</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {formatNumber(arRuns)}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">추정치(방문 대비 실행율)</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">평균 체류 시간</div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              관광객 비중 {percent(foreignShare)}
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {formatDuration(avgDwellSeconds)}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">현장 체류 기반 추정</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">일별 방문자 추이</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">최근 7일</div>
            </div>
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">일 방문자</div>
          </div>

          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chartTheme.axisText }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chartTheme.axisText }}
                  width={36}
                />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value)), "방문자"]}
                  labelFormatter={(label) => `날짜 ${label}`}
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: 10,
                  }}
                  labelStyle={{ color: chartTheme.axisText }}
                  itemStyle={{ color: chartTheme.axisText }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke={chartTheme.seriesStroke}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">언어별 사용자 비중</div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                외국인 타겟팅 지표:{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  비한국어 {percent(foreignShare)}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              관광객 비중
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <div className="chart-no-focus h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languages}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    activeIndex={activeLanguageIndex ?? undefined}
                    activeShape={renderActiveLanguageSlice}
                    onMouseEnter={(_, index) => setActiveLanguageIndex(index)}
                    onClick={(_, index) =>
                      setActiveLanguageIndex((current) => (current === index ? null : index))
                    }
                    style={{ outline: "none" }}
                  >
                    {languages.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={chartTheme.piePalette[idx % chartTheme.piePalette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(value) => [`${value}%`, "비중"]}
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: 10,
                    }}
                    labelStyle={{ color: chartTheme.axisText }}
                    itemStyle={{ color: chartTheme.axisText }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => (
                      <span
                        className="text-zinc-700 dark:text-zinc-200"
                        style={{ lineHeight: "14px" }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    관광객(비한국어) 비중
                  </div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {percent(foreignShare)}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100"
                    style={{ width: `${Math.round(foreignShare * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  한국어 외 언어(EN/JP/CN)를 관광객 지표로 집계합니다.
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">운영 팁</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-4 text-zinc-600 dark:text-zinc-300">
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
