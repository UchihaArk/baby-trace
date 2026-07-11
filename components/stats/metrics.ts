import type { BucketAgg } from "@/lib/types";

export type Metric = "feed" | "pump" | "diaper" | "sleep";
/** 指标/图表的主色调 key。体重用 pink、身高用 cyan，与活动色系错开。 */
export type Accent = "rose" | "teal" | "amber" | "indigo" | "pink" | "cyan";

// ── 展示格式化（含单位，直接用于图表/明细） ──────────────────────────

/** 毫升智能展示：<1000 → "240 ml"，≥1000 → "7.2 L" */
export function formatMl(ml: number): string {
  const v = Math.max(0, Math.round(ml));
  if (v >= 1000) return `${(v / 1000).toFixed(1)} L`;
  return `${v} ml`;
}

/** 分钟 → 分/时/天：<60「X 分」；<1440「H时M分」；≥1440「D.D 天」 */
export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} 分`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm > 0 ? `${h}时${mm}分` : `${h}时`;
  }
  return `${(m / 1440).toFixed(1)} 天`;
}

/** 秒 → 分/时/天（睡眠时长用；按分钟取整后复用 formatMinutes） */
export function formatDurationLong(sec: number): string {
  return formatMinutes(Math.floor(Math.max(0, sec) / 60));
}

export type MetricMeta = {
  key: Metric;
  label: string; // 喂奶 / 产奶 / 尿布 / 睡眠
  emoji: string;
  accent: Accent;
  /** 日均数值的完整展示串（含单位），图表 y 轴标签 / caption 用 */
  format: (v: number) => string;
};

export const METRICS: MetricMeta[] = [
  { key: "feed", label: "喂奶", emoji: "🍼", accent: "rose", format: (v) => formatMl(v) },
  { key: "pump", label: "产奶", emoji: "🥛", accent: "teal", format: (v) => formatMl(v) },
  { key: "diaper", label: "尿布", emoji: "🧻", accent: "amber", format: (v) => `${v.toFixed(1)} 张` },
  { key: "sleep", label: "睡眠", emoji: "💤", accent: "indigo", format: (v) => formatDurationLong(v) },
];

export function metricMeta(key: Metric): MetricMeta {
  return METRICS.find((m) => m.key === key)!;
}

/** 日均 = 总量 ÷ 该指标有数据的天数；无数据返回 null */
export function dailyAvg(metric: Metric, agg: BucketAgg): number | null {
  switch (metric) {
    case "feed":
      return agg.daysWithData.bottle > 0 ? agg.bottleMl / agg.daysWithData.bottle : null;
    case "pump":
      return agg.daysWithData.pump > 0 ? agg.pumpMl / agg.daysWithData.pump : null;
    case "diaper":
      return agg.daysWithData.diaper > 0 ? agg.diaperCount / agg.daysWithData.diaper : null;
    case "sleep":
      return agg.daysWithData.sleep > 0 ? agg.sleepSeconds / agg.daysWithData.sleep : null;
  }
}

export function daysRecorded(metric: Metric, agg: BucketAgg): number {
  switch (metric) {
    case "feed":
      return agg.daysWithData.bottle;
    case "pump":
      return agg.daysWithData.pump;
    case "diaper":
      return agg.daysWithData.diaper;
    case "sleep":
      return agg.daysWithData.sleep;
  }
}

/** Tailwind 需字面量类名，禁止字符串拼接 */
export const ACCENT_BAR: Record<Accent, string> = {
  rose: "bg-rose-500 dark:bg-rose-400",
  teal: "bg-teal-500 dark:bg-teal-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  indigo: "bg-indigo-500 dark:bg-indigo-400",
  pink: "bg-pink-500 dark:bg-pink-400",
  cyan: "bg-cyan-500 dark:bg-cyan-400",
};

export const ACCENT_TEXT: Record<Accent, string> = {
  rose: "text-rose-600 dark:text-rose-400",
  teal: "text-teal-600 dark:text-teal-400",
  amber: "text-amber-600 dark:text-amber-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  pink: "text-pink-600 dark:text-pink-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
};

export const ACCENT_SELECTED: Record<Accent, string> = {
  rose: "border-transparent bg-rose-500 text-white",
  teal: "border-transparent bg-teal-500 text-white",
  amber: "border-transparent bg-amber-500 text-white",
  indigo: "border-transparent bg-indigo-500 text-white",
  pink: "border-transparent bg-pink-500 text-white",
  cyan: "border-transparent bg-cyan-500 text-white",
};

/** 折线图描边色（成长趋势用） */
export const ACCENT_LINE: Record<Accent, string> = {
  rose: "stroke-rose-500 dark:stroke-rose-400",
  teal: "stroke-teal-500 dark:stroke-teal-400",
  amber: "stroke-amber-500 dark:stroke-amber-400",
  indigo: "stroke-indigo-500 dark:stroke-indigo-400",
  pink: "stroke-pink-500 dark:stroke-pink-400",
  cyan: "stroke-cyan-500 dark:stroke-cyan-400",
};

/** 折线图数据点填充色（选中态） */
export const ACCENT_DOT: Record<Accent, string> = {
  rose: "fill-rose-500 dark:fill-rose-400",
  teal: "fill-teal-500 dark:fill-teal-400",
  amber: "fill-amber-500 dark:fill-amber-400",
  indigo: "fill-indigo-500 dark:fill-indigo-400",
  pink: "fill-pink-500 dark:fill-pink-400",
  cyan: "fill-cyan-500 dark:fill-cyan-400",
};
