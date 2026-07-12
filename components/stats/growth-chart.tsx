"use client";

import { cn } from "@/lib/utils";
import { ACCENT_TEXT, type Accent } from "./metrics";

export type GrowthPoint = {
  label: string; // x 轴短标签
  value: number | null; // 该周期代表值（快照）；null = 无数据
  isCurrent: boolean; // 当前（尚未结束的）周期
};

/** 各 accent 的折线色 + 区域填充色（Tailwind 字面量，深浅双模式） */
const LINE_STROKE: Record<Accent, string> = {
  rose: "stroke-rose-500 dark:stroke-rose-400",
  teal: "stroke-teal-500 dark:stroke-teal-400",
  amber: "stroke-amber-500 dark:stroke-amber-400",
  indigo: "stroke-indigo-500 dark:stroke-indigo-400",
  pink: "stroke-pink-500 dark:stroke-pink-400",
  cyan: "stroke-cyan-500 dark:stroke-cyan-400",
};
const AREA_FILL: Record<Accent, string> = {
  rose: "fill-rose-500/15 dark:fill-rose-400/15",
  teal: "fill-teal-500/15 dark:fill-teal-400/15",
  amber: "fill-amber-500/15 dark:fill-amber-400/15",
  indigo: "fill-indigo-500/15 dark:fill-indigo-400/15",
  pink: "fill-pink-500/15 dark:fill-pink-400/15",
  cyan: "fill-cyan-500/15 dark:fill-cyan-400/15",
};
const DOT_FILL: Record<Accent, string> = {
  rose: "fill-rose-500 dark:fill-rose-400",
  teal: "fill-teal-500 dark:fill-teal-400",
  amber: "fill-amber-500 dark:fill-amber-400",
  indigo: "fill-indigo-500 dark:fill-indigo-400",
  pink: "fill-pink-500 dark:fill-pink-400",
  cyan: "fill-cyan-500 dark:fill-cyan-400",
};

/**
 * 股市风格折线趋势图（纯 SVG + Tailwind，无第三方依赖）。
 * - 左侧 y 轴刻度（4 档）+ 水平网格线
 * - 折线 + 半透明渐变区域填充
 * - 数据点 + 选中点高亮 + 数值标签
 * - 无数据段断线
 */
export function GrowthChart({
  points,
  accent,
  formatValue,
  selectedIndex,
  onSelect,
}: {
  points: GrowthPoint[];
  accent: Accent;
  formatValue: (v: number) => string;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const TOTAL_H = 168; // 整体高度（绘图区 + x 轴标签）
  const PLOT_H = 132; // 绘图区高度
  const PAD_TOP = 10;
  const PAD_BOTTOM = 10;
  const plotH = PLOT_H - PAD_TOP - PAD_BOTTOM;
  const Y_AXIS_W = 40; // 左侧 y 轴刻度宽度（px）

  const values = points.map((p) => p.value).filter((v): v is number => v != null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const span = max - min > 0 ? max - min : Math.max(1, Math.abs(max) * 0.1);
  // y 轴留 10% 上下边距，避免折线贴顶/贴底
  const lo = min - span * 0.1;
  const hi = max + span * 0.1;
  const range = hi - lo || 1;

  const n = points.length;
  /** x 坐标百分比（基于绘图区宽度，0=最左、100=最右） */
  const xPercent = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  /** value → 绘图区内的 y 坐标（px） */
  const yPx = (v: number) => PAD_TOP + (1 - (v - lo) / range) * plotH;

  // y 轴刻度：4 档（顶、上1/4、下1/4、底），值取整避免小数
  const yTicks = [hi, hi - range * 0.33, hi - range * 0.66, lo];

  // 连续有数据的段（遇到 null 断开），每段生成折线 + 区域填充
  const segments: number[][] = [];
  let cur: number[] = [];
  points.forEach((p, i) => {
    if (p.value != null) cur.push(i);
    else if (cur.length > 0) {
      segments.push(cur);
      cur = [];
    }
  });
  if (cur.length > 0) segments.push(cur);

  return (
    <div className="relative select-none" style={{ height: TOTAL_H }}>
      {/* ── 视觉层（不拦截点击） ── */}
      <div className="pointer-events-none absolute inset-0 flex">
        {/* y 轴刻度（左侧固定宽度） */}
        <div className="flex shrink-0 flex-col justify-between pb-5" style={{ width: Y_AXIS_W, height: PLOT_H }}>
          {yTicks.map((t, i) => (
            <div key={i} className="pr-1 text-right text-[0.6rem] leading-none tabular-nums text-muted-foreground">
              {formatValue(Math.round(t))}
            </div>
          ))}
        </div>

        {/* 绘图区：网格线 + 折线 + 圆点 */}
        <div className="relative flex-1" style={{ height: PLOT_H }}>
          {/* 水平网格线 */}
          <div className="absolute inset-0">
            {yTicks.map((_, i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-t border-dashed border-border/40"
                style={{ top: `${(i / (yTicks.length - 1)) * 100}%` }}
              />
            ))}
          </div>

          {/* 折线 + 区域填充（SVG，横向 0..100 与 xPercent 对齐，纵向按 px） */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 132"
            preserveAspectRatio="none"
          >
            {segments.map((seg, si) => {
              const linePts = seg
                .map((idx) => {
                  const v = points[idx].value as number;
                  return `${xPercent(idx).toFixed(2)},${yPx(v).toFixed(2)}`;
                })
                .join(" ");
              // 区域填充：折线 + 闭合到底部
              const firstIdx = seg[0];
              const lastIdx = seg[seg.length - 1];
              const areaPts = `${xPercent(firstIdx).toFixed(2)},${(PLOT_H - PAD_BOTTOM).toFixed(2)} ${linePts} ${xPercent(lastIdx).toFixed(2)},${(PLOT_H - PAD_BOTTOM).toFixed(2)}`;
              return (
                <g key={si}>
                  {seg.length >= 2 && (
                    <polygon points={areaPts} className={AREA_FILL[accent]} />
                  )}
                  {seg.length >= 2 && (
                    <polyline
                      points={linePts}
                      className={cn(LINE_STROKE[accent], "fill-none")}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 圆点（HTML 绝对定位，避免 SVG 缩放致圆变椭圆） */}
          {points.map((p, i) => {
            if (p.value == null) return null;
            const v = p.value;
            const selected = i === selectedIndex;
            return (
              <div
                key={i}
                className="absolute"
                style={{ left: `${xPercent(i)}%`, top: yPx(v), transform: "translate(-50%, -50%)" }}
              >
                {/* 选中点的数值 tooltip */}
                {selected && (
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums",
                      "bg-card shadow-sm ring-1 ring-foreground/10",
                      ACCENT_TEXT[accent]
                    )}
                    style={{ bottom: "100%", marginBottom: 4 }}
                  >
                    {formatValue(v)}
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-full ring-2 ring-card transition-all",
                    DOT_FILL[accent],
                    selected ? "size-2.5" : "size-1.5 opacity-70"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 交互层：透明按钮 + x 轴标签 ── */}
      <div className="absolute inset-0 flex">
        {/* 占位：与 y 轴刻度等宽 */}
        <div className="shrink-0" style={{ width: Y_AXIS_W }} />
        <div className="relative flex-1" style={{ height: TOTAL_H }}>
          {/* 触摸热区（覆盖整列，点击选中对应点） */}
          <div className="absolute inset-x-0 bottom-0 flex" style={{ height: TOTAL_H }}>
            {points.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`${p.label}${p.value != null ? `：${formatValue(p.value)}` : "：无数据"}`}
                className="h-full flex-1 focus-visible:outline-none"
              />
            ))}
          </div>
          {/* x 轴标签（底部） */}
          <div className="absolute inset-x-0 bottom-0 flex">
            {points.map((p, i) => {
              const selected = i === selectedIndex;
              return (
                <div key={i} className="flex-1 text-center">
                  {p.label && (
                    <span
                      className={cn(
                        "text-[0.6rem] tabular-nums transition-colors",
                        selected ? "font-bold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {p.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
