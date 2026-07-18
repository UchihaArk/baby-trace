"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Chip } from "@/components/log-entry/chip";
import { useLogEntry } from "@/components/log-entry/log-entry-provider";
import { GrowthChart, type GrowthPoint } from "@/components/stats/growth-chart";
import { ACCENT_SELECTED, type Accent } from "@/components/stats/metrics";
import { useMeasurements } from "@/lib/hooks";
import { formatHeight, formatWeight } from "@/lib/measure";
import { PERIOD_OPTIONS, type Period } from "@/lib/periods";
import { formatChineseDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { MeasurementKind } from "@/lib/types";

type KindMeta = {
  key: MeasurementKind;
  label: string;
  emoji: string;
  accent: Accent;
  format: (v: number) => string;
};

const KINDS: KindMeta[] = [
  { key: "weight", label: "体重", emoji: "⚖️", accent: "pink", format: formatWeight },
  { key: "height", label: "身高", emoji: "📏", accent: "cyan", format: formatHeight },
];

/** 成长 Tab 可用粒度：去掉日/周（测量值稀疏，日/周无意义） */
const GROWTH_PERIODS = PERIOD_OPTIONS.filter((p) => p.value !== "day" && p.value !== "week");

const DAY = 86400;

type GrowthRange = {
  /** x 轴文案 */
  caption: string;
  /** 各分桶：[from, to) 区间 + 短标签 + 是否当前（进行中） */
  buckets: { from: number; to: number; label: string; isCurrent: boolean }[];
};

/** 各粒度的天数跨度 */
const GROWTH_DAYS: Record<Period, number> = {
  day: 0,
  week: 0,
  month: 30,
  quarter: 120,
  year: 365,
};

/**
 * 成长视图的时间轴分桶——统一按「日」分桶，区别只在跨度：
 * - month：近 30 天
 * - quarter：近 120 天
 * - year：近 365 天
 * 以「今天」为右端点向左截取，每个桶 = 一个自然日，取该日最后一条测量值。
 */
function growthRange(period: Period): GrowthRange {
  const days = GROWTH_DAYS[period];
  const now = new Date();
  const buckets: GrowthRange["buckets"] = [];
  // 从 days 天前到今天（含），共 days+1 个点
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const from = Math.floor(d.getTime() / 1000);
    buckets.push({
      from,
      to: from + DAY,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      isCurrent: i === 0,
    });
  }
  const captionMap: Record<Period, string> = {
    day: "",
    week: "",
    month: "近 1 个月",
    quarter: "近 4 个月",
    year: "近 1 年",
  };
  return { caption: captionMap[period], buckets };
}

/** x 轴标签是否需要稀疏显示（点多时跳着标，避免挤） */
function shouldShowLabel(i: number, total: number, period: Period): boolean {
  // 月视图：有数据的日期全部展示
  if (period === "month") return true;
  // 季/年视图：点过多时跳着标 + 末点，避免拥挤
  if (total <= 7) return true;
  const step = Math.ceil(total / 7);
  return i % step === 0 || i === total - 1;
}

export function GrowthStats({ babyId }: { babyId: number }) {
  const [kind, setKind] = useState<MeasurementKind>("weight");
  const [period, setPeriod] = useState<Period>("month");

  const meta = KINDS.find((k) => k.key === kind)!;
  const { data: measurements } = useMeasurements(babyId, kind);
  const { openWeight, openHeight } = useLogEntry();
  const openMeasure = kind === "weight" ? openWeight : openHeight;

  const { caption, buckets } = useMemo(() => growthRange(period), [period]);
  const n = buckets.length;
  const [selectedIndex, setSelectedIndex] = useState(n - 1);

  // 把测量值落到所属分桶（按 measuredAt），取该桶「最后一条」作为代表值（快照语义）。
  // 再过滤掉无数据的日子——股市风格：x 轴只画「有数据」的日期，
  // 避免稀疏测量导致相邻点之间全是 null、折线断成孤点。
  const points: GrowthPoint[] = useMemo(() => {
    const sorted = measurements ? [...measurements].sort((a, b) => a.measuredAt - b.measuredAt) : [];
    const perDay = buckets.map((b, i) => {
      let last: number | null = null;
      for (const m of sorted) {
        if (m.measuredAt >= b.from && m.measuredAt < b.to) last = m.valueGrams;
      }
      return { label: b.label, value: last, isCurrent: b.isCurrent, index: i };
    });
    const withData = perDay.filter((b) => b.value != null);
    const total = withData.length;
    return withData.map((b, i) => ({
      label: shouldShowLabel(i, total, period) ? b.label : "",
      value: b.value,
      isCurrent: b.isCurrent,
      index: b.index,
    }));
  }, [buckets, measurements, period]);

  const sel = Math.min(selectedIndex, n - 1);
  const selBucket = buckets[sel];

  // 选中分桶的明细：该区间内所有测量
  const inRange = useMemo(() => {
    if (!measurements) return [];
    return measurements
      .filter((m) => m.measuredAt >= selBucket.from && m.measuredAt < selBucket.to)
      .sort((a, b) => a.measuredAt - b.measuredAt);
  }, [measurements, selBucket]);
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  const diff = first && last ? last.valueGrams - first.valueGrams : null;
  const diffText =
    diff == null
      ? null
      : diff === 0
        ? "持平"
        : `${diff > 0 ? "+" : "-"}${meta.format(Math.abs(diff))}`;

  const latestAll = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : null;

  function changePeriod(p: Period) {
    setPeriod(p);
    setSelectedIndex(growthRange(p).buckets.length - 1);
  }

  return (
    <main className="space-y-5 px-4 pb-8 pt-3">
      {/* 指标 */}
      <div className="grid grid-cols-2 gap-2">
        {KINDS.map((k) => (
          <Chip
            key={k.key}
            selected={kind === k.key}
            onClick={() => setKind(k.key)}
            selectedClass={ACCENT_SELECTED[k.accent]}
            className="min-h-9 px-1 py-1.5 text-xs"
          >
            <span className="mr-0.5">{k.emoji}</span>
            {k.label}
          </Chip>
        ))}
      </div>

      {/* 粒度（仅 月/季/年） */}
      <div className="flex gap-2 overflow-x-auto">
        {GROWTH_PERIODS.map((p) => (
          <Chip
            key={p.value}
            selected={period === p.value}
            onClick={() => changePeriod(p.value)}
            selectedClass="border-transparent bg-primary text-primary-foreground"
            className="min-h-9 flex-none px-4 py-1.5 text-xs"
          >
            {p.label}
          </Chip>
        ))}
      </div>

      {/* 趋势折线图 */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold">
            {meta.emoji} {meta.label}趋势
          </h3>
          <span className="text-xs text-muted-foreground">{caption}</span>
        </div>
        <div className="ui-card p-3">
          {points.some((p) => p.value != null) ? (
            <GrowthChart
              points={points}
              accent={meta.accent}
              formatValue={meta.format}
              selectedIndex={sel}
              onSelect={setSelectedIndex}
            />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {measurements ? "暂无数据，去记录第一条吧" : "加载中…"}
            </div>
          )}
          <div className="mt-2 border-t border-border/50 pt-2 text-center text-xs text-muted-foreground">
            {inRange.length > 0
              ? `本期 ${inRange.length} 次记录${diffText ? ` · ${diffText}` : ""}`
              : measurements
                ? "该期无记录"
                : "加载中…"}
          </div>
        </div>
      </section>

      {/* 选中周期明细 */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {selBucket.label}
            {selBucket.isCurrent && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-medium text-amber-600 dark:text-amber-400">
                进行中
              </span>
            )}
          </h3>
          {inRange.length > 0 && <span className="text-xs text-muted-foreground">{inRange.length} 次记录</span>}
        </div>
        {inRange.length > 0 ? (
          <div className="space-y-2 ui-card p-3">
            {[...inRange].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatChineseDate(new Date(m.measuredAt * 1000))}</span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    meta.accent === "pink"
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-cyan-600 dark:text-cyan-400"
                  )}
                >
                  {meta.format(m.valueGrams)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {measurements ? "该期暂无记录" : "加载中…"}
          </div>
        )}
      </section>

      {/* 最新一次 + 快速录入 */}
      {latestAll && (
        <button
          type="button"
          onClick={() => openMeasure()}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl p-4 ring-1 transition active:scale-[.99]",
            meta.accent === "pink"
              ? "bg-pink-500/5 ring-pink-500/20"
              : "bg-cyan-500/5 ring-cyan-500/20"
          )}
        >
          <div className="text-left">
            <div className="text-xs text-muted-foreground">最新{meta.label}</div>
            <div className={cn("mt-0.5 text-lg font-bold tabular-nums", meta.accent === "pink" ? "text-pink-600 dark:text-pink-400" : "text-cyan-600 dark:text-cyan-400")}>
              {meta.format(latestAll.valueGrams)}
            </div>
            <div className="text-xs text-muted-foreground">{formatChineseDate(new Date(latestAll.measuredAt * 1000))}</div>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white",
              meta.accent === "pink" ? "bg-pink-500" : "bg-cyan-500"
            )}
          >
            <Plus className="size-3.5" /> 记一笔
          </span>
        </button>
      )}
    </main>
  );
}
