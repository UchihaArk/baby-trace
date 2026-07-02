"use client";

import { useMemo, useState } from "react";
import { useBaby } from "@/components/baby/baby-provider";
import { Chip } from "@/components/log-entry/chip";
import { MetricDetail } from "@/components/stats/metric-detail";
import { TrendChart, type TrendBar } from "@/components/stats/trend-chart";
import {
  ACCENT_SELECTED,
  METRICS,
  dailyAvg,
  daysRecorded,
  metricMeta,
  type Metric,
} from "@/components/stats/metrics";
import { useStatsCare, useStatsTrend } from "@/lib/hooks";
import { PERIOD_OPTIONS, TREND_WINDOW, trendBuckets, type Period } from "@/lib/periods";
import { formatInterval } from "@/lib/time";

const dash = "—";

const TREND_LABEL: Record<Period, string> = {
  day: "最近 7 日",
  week: "最近 4 周",
  month: "最近 6 月",
  quarter: "最近 4 季度",
  year: "最近 3 年",
};

/** 趋势图 x 轴短标签（从本地 0 点 unix 秒推导，避免长文案挤在一起） */
function shortLabel(from: number, period: Period): string {
  const d = new Date(from * 1000);
  const m = d.getMonth() + 1;
  if (period === "day" || period === "week") return `${m}/${d.getDate()}`;
  if (period === "month") return `${m}月`;
  if (period === "quarter") return `Q${Math.floor((m - 1) / 3) + 1}`;
  return `${d.getFullYear()}`;
}

export default function StatsPage() {
  const { baby, isLoading } = useBaby();
  const [period, setPeriod] = useState<Period>("day");
  const [metric, setMetric] = useState<Metric>("feed");

  const buckets = useMemo(() => trendBuckets(period), [period]);
  const n = buckets.length;
  const [selectedIndex, setSelectedIndex] = useState(n - 1);

  const starts = useMemo(() => buckets.map((b) => b.from).join(","), [buckets]);
  const to = buckets[n - 1].to;
  const { data: aggs } = useStatsTrend(baby?.id ?? null, starts, to);
  const { data: care } = useStatsCare(baby?.id ?? null);

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const meta = metricMeta(metric);
  const sel = Math.min(selectedIndex, n - 1);
  const selBucket = buckets[sel];
  const selAgg = aggs?.[sel];

  const bars: TrendBar[] = buckets.map((b, i) => ({
    label: shortLabel(b.from, period),
    value: aggs ? dailyAvg(metric, aggs[i]) : null,
    isCurrent: b.isCurrent,
  }));

  const selVal = selAgg ? dailyAvg(metric, selAgg) : null;
  const selDays = selAgg ? daysRecorded(metric, selAgg) : 0;
  const caption = !aggs
    ? "加载中…"
    : selVal != null
      ? `日均 ${meta.format(selVal)} · 共 ${selDays} 天有数据`
      : "该期无记录";

  /** 切粒度时把选中归位到当前期（末根），避免越界与 effect 里 setState */
  function changePeriod(p: Period) {
    setPeriod(p);
    setSelectedIndex(TREND_WINDOW[p] - 1);
  }

  return (
    <main className="space-y-5 px-4 pb-8 pt-3">
      {/* 粒度 */}
      <div className="flex gap-2 overflow-x-auto">
        {PERIOD_OPTIONS.map((p) => (
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

      {/* 指标 */}
      <div className="grid grid-cols-4 gap-2">
        {METRICS.map((m) => (
          <Chip
            key={m.key}
            selected={metric === m.key}
            onClick={() => setMetric(m.key)}
            selectedClass={ACCENT_SELECTED[m.accent]}
            className="min-h-9 px-1 py-1.5 text-xs"
          >
            <span className="mr-0.5">{m.emoji}</span>
            {m.label}
          </Chip>
        ))}
      </div>

      {/* 趋势图 */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold">
            {meta.emoji} {meta.label}量趋势
          </h3>
          <span className="text-xs text-muted-foreground">日均 · {TREND_LABEL[period]}</span>
        </div>
        <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/5">
          <TrendChart
            bars={bars}
            accent={meta.accent}
            formatValue={meta.format}
            selectedIndex={sel}
            onSelect={setSelectedIndex}
          />
          <div className="mt-2 border-t border-border/50 pt-2 text-center text-xs text-muted-foreground">
            {caption}
          </div>
        </div>
      </section>

      {/* 选中周期明细 */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {selBucket.label}
            {selBucket.isCurrent && period !== "day" && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-medium text-amber-600 dark:text-amber-400">
                进行中
              </span>
            )}
          </h3>
          {period !== "day" && selAgg && (
            <span className="text-xs text-muted-foreground">{selDays} 天有数据</span>
          )}
        </div>
        {selAgg ? (
          <MetricDetail metric={metric} agg={selAgg} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {aggs ? "该期暂无记录" : "加载中…"}
          </div>
        )}
      </section>

      {/* 护理（全历史平均间隔） */}
      <section>
        <h3 className="mb-2 px-1 text-sm font-semibold">✂️ 护理 · 全历史平均间隔</h3>
        <div className="grid grid-cols-3 gap-3">
          <CareCell emoji="🛁" label="洗澡" data={care?.bath} />
          <CareCell emoji="💈" label="理发" data={care?.haircut} />
          <CareCell emoji="✂️" label="剪指甲" data={care?.nail} />
        </div>
      </section>
    </main>
  );
}

function CareCell({
  emoji,
  label,
  data,
}: {
  emoji: string;
  label: string;
  data: { avgSeconds: number; count: number } | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/5">
      <div className="text-xs text-muted-foreground">
        {emoji} {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums">
        {data ? formatInterval(data.avgSeconds) : dash}
      </div>
      <div className="text-xs text-muted-foreground">{data ? `共 ${data.count} 次` : "暂无"}</div>
    </div>
  );
}
