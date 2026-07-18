"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";
import { useBaby } from "@/components/baby/baby-provider";
import { Chip } from "@/components/log-entry/chip";
import { GrowthStats } from "@/components/stats/growth-stats";
import { MetricDetail } from "@/components/stats/metric-detail";
import { TrendChart, type TrendBar } from "@/components/stats/trend-chart";
import {
  ACCENT_SELECTED,
  METRICS,
  dailyAvg,
  dailyAvgFeed,
  daysRecorded,
  daysRecordedFeed,
  feedMethodMeta,
  metricMeta,
  type FeedMethod,
  type Metric,
} from "@/components/stats/metrics";
import { FEEDING_METHOD_OPTIONS } from "@/lib/baby";
import { useStatsCare, useStatsTrend } from "@/lib/hooks";
import { PERIOD_OPTIONS, TREND_WINDOW, trendBuckets, type Period } from "@/lib/periods";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { formatInterval } from "@/lib/time";
import { cn } from "@/lib/utils";

const dash = "—";

type Tab = "record" | "growth";

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
  const [tab, setTab] = useState<Tab>("record");
  const [period, setPeriod] = useState<Period>("day");
  const [metric, setMetric] = useState<Metric>("feed");
  // 喂奶方式：用户未手动切换前，跟随设置「主要喂养方式」；手动切换后以用户选择为准。
  const [feedMethodOverride, setFeedMethodOverride] = useState<FeedMethod | null>(null);
  const feedMethod: FeedMethod = feedMethodOverride ?? baby?.feedingMethod ?? "breast";

  const buckets = useMemo(() => trendBuckets(period), [period]);
  const n = buckets.length;
  const [selectedIndex, setSelectedIndex] = useState(n - 1);

  const starts = useMemo(() => buckets.map((b) => b.from).join(","), [buckets]);
  const to = buckets[n - 1].to;
  const { data: aggs } = useStatsTrend(baby?.id ?? null, starts, to);
  const { data: care } = useStatsCare(baby?.id ?? null);
  const { mutate } = useSWRConfig();
  const { pull, refreshing, pulling } = usePullToRefresh(async () => {
    if (!baby) return;
    // 重验本宝宝的「趋势」「护理」与「身体测量」
    await mutate(
      (k) =>
        typeof k === "string" &&
        (k.startsWith(`trend:${baby.id}:`) ||
          k.startsWith(`care:${baby.id}`) ||
          k.startsWith(`measurements:${baby.id}:`))
    );
  });

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const meta = metricMeta(metric);
  // 喂奶指标下使用 FeedMethod 视图（亲喂=次数 / 瓶喂=ml）；其余指标沿用原逻辑
  const isFeedView = metric === "feed";
  const fmMeta = feedMethodMeta(feedMethod);
  const sel = Math.min(selectedIndex, n - 1);
  const selBucket = buckets[sel];
  const selAgg = aggs?.[sel];

  const bars: TrendBar[] = buckets.map((b, i) => ({
    label: shortLabel(b.from, period),
    value: aggs
      ? isFeedView
        ? dailyAvgFeed(feedMethod, aggs[i])
        : dailyAvg(metric, aggs[i])
      : null,
    isCurrent: b.isCurrent,
  }));

  const selVal = selAgg
    ? isFeedView
      ? dailyAvgFeed(feedMethod, selAgg)
      : dailyAvg(metric, selAgg)
    : null;
  const selDays = selAgg
    ? isFeedView
      ? daysRecordedFeed(feedMethod, selAgg)
      : daysRecorded(metric, selAgg)
    : 0;
  // 趋势图标题与数值格式化：喂奶下走 FeedMethod 元数据，其它指标沿用 meta
  const trendTitle = isFeedView ? `${fmMeta.emoji} ${fmMeta.trendTitle}` : `${meta.emoji} ${meta.label}量趋势`;
  const trendFormat = isFeedView ? fmMeta.format : meta.format;
  const caption = !aggs
    ? "加载中…"
    : selVal != null
      ? `日均 ${trendFormat(selVal)} · 共 ${selDays} 天有数据`
      : "该期无记录";

  /** 切粒度时把选中归位到当前期（末根），避免越界与 effect 里 setState */
  function changePeriod(p: Period) {
    setPeriod(p);
    setSelectedIndex(TREND_WINDOW[p] - 1);
  }

  return (
    <>
      {/* 下拉刷新指示器（全宽，置于 px-4 容器之外，不参与 space-y） */}
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden text-muted-foreground",
          !pulling && "transition-[height] duration-200 ease-out"
        )}
        style={{ height: refreshing ? 56 : pull }}
      >
        <RefreshCw className={cn("size-5 transition-transform", refreshing && "animate-spin")} />
      </div>

      {/* 顶部 Tab：记录 / 成长 */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1">
          <TabButton active={tab === "record"} onClick={() => setTab("record")}>
            记录
          </TabButton>
          <TabButton active={tab === "growth"} onClick={() => setTab("growth")}>
            成长
          </TabButton>
        </div>
      </div>

      {tab === "growth" ? (
        <GrowthStats babyId={baby.id} />
      ) : (
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

          {/* 喂奶方式切换：仅喂奶指标下展示 */}
          {isFeedView && (
            <div className="-mt-2 flex justify-center gap-2">
              {FEEDING_METHOD_OPTIONS.map((f) => (
                <Chip
                  key={f.value}
                  selected={feedMethod === f.value}
                  onClick={() => setFeedMethodOverride(f.value)}
                  selectedClass="border-transparent bg-rose-500 text-white"
                  className="min-h-8 flex-none px-4 py-1 text-xs"
                >
                  {f.emoji} {f.label}
                </Chip>
              ))}
            </div>
          )}

          {/* 趋势图 */}
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{trendTitle}</h3>
              <span className="text-xs text-muted-foreground">日均 · {TREND_LABEL[period]}</span>
            </div>
            <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
              <TrendChart
                bars={bars}
                accent={meta.accent}
                formatValue={trendFormat}
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
              <MetricDetail metric={metric} agg={selAgg} feedMethod={feedMethod} />
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
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl py-2 text-sm font-semibold transition",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
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
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
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
