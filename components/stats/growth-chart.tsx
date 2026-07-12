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

const TOTAL_H = 168; // 整体高度（绘图区 + x 轴标签）
const PLOT_H = 134; // 绘图区高度
const Y_AXIS_W = 42; // 左侧 y 轴刻度宽度（px）
const X_LABEL_H = TOTAL_H - PLOT_H; // x 轴标签区高度

/**
 * 股市风格折线趋势图（纯 SVG + Tailwind，无第三方依赖）。
 * - 左侧 y 轴刻度（4 档）+ 水平虚线网格
 * - 折线 + 半透明区域填充
 * - 数据点 + 选中高亮 + 数值 tooltip
 * - 无数据段断线
 *
 * 坐标全部用百分比（0..100），SVG viewBox = 0 0 100 100、preserveAspectRatio="none"，
 * 这样无论容器实际宽高多少，折线、填充、网格都精准对齐，不会出现 px 与 viewBox 换算错位。
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
  const PAD = 0.08; // y 轴上下留白（占绘图区的比例），避免折线贴顶/贴底

  const values = points.map((p) => p.value).filter((v): v is number => v != null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const span = max - min > 0 ? max - min : Math.max(1, Math.abs(max) * 0.1);
  const lo = min - span * PAD;
  const hi = max + span * PAD;
  const range = hi - lo || 1;

  const n = points.length;
  /** x 坐标百分比（0..100） */
  const xPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  /** value → y 百分比（0=顶、100=底，符合 SVG 坐标系） */
  const yPct = (v: number) => ((v - lo) / range) * 100;

  // y 轴刻度：4 档
  const yTicks = [hi, hi - range * 0.33, hi - range * 0.66, lo];

  // 连续有数据的段（遇到 null 断开）
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

  // y 刻度对应的百分比位置（0=顶、100=底），与 yPct 同坐标系
  const tickPct = (t: number) => ((t - lo) / range) * 100;

  return (
    <div className="relative w-full select-none" style={{ height: TOTAL_H }}>
      <div className="flex h-full">
        {/* ── y 轴刻度 ── */}
        <div className="flex shrink-0 flex-col justify-between pt-0.5" style={{ width: Y_AXIS_W, height: PLOT_H }}>
          {yTicks.map((t, i) => (
            <div
              key={i}
              className="pr-1 text-right text-[0.6rem] leading-none tabular-nums text-muted-foreground"
            >
              {formatValue(Math.round(t))}
            </div>
          ))}
        </div>

        {/* ── 绘图区 ── */}
        <div className="relative flex-1" style={{ height: PLOT_H }}>
          {/* 网格线 + y 轴刻度对应的水平虚线 */}
          {yTicks.map((t, i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-border/40"
              style={{ top: `${tickPct(t)}%` }}
            />
          ))}

          {/* 折线 + 区域填充：全百分比坐标 */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {segments.map((seg, si) => {
              const linePts = seg
                .map((idx) => {
                  const v = points[idx].value as number;
                  return `${xPct(idx).toFixed(2)},${(100 - yPct(v)).toFixed(2)}`;
                })
                .join(" ");
              const firstIdx = seg[0];
              const lastIdx = seg[seg.length - 1];
              // 区域：从 (firstX, 100) 沿折线到 (lastX, 100) 闭合
              const areaPts = `${xPct(firstIdx).toFixed(2)},100 ${linePts} ${xPct(lastIdx).toFixed(2)},100`;
              return (
                <g key={si}>
                  {seg.length >= 2 && <polygon points={areaPts} className={AREA_FILL[accent]} />}
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
                  {/* 单点段：画一个 SVG 圆兜底（HTML 圆点在下方渲染） */}
                  {seg.length === 1 && (
                    <circle
                      cx={xPct(seg[0])}
                      cy={100 - yPct(points[seg[0]].value as number)}
                      r={1.5}
                      className={DOT_FILL[accent]}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 数据点（HTML 绝对定位，保持圆形不随 SVG 拉伸变椭圆） */}
          {points.map((p, i) => {
            if (p.value == null) return null;
            const v = p.value;
            const selected = i === selectedIndex;
            const yp = yPct(v); // 0=顶 100=底
            return (
              <div
                key={i}
                className="absolute z-10"
                style={{ left: `${xPct(i)}%`, top: `${yp}%`, transform: "translate(-50%, -50%)" }}
              >
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
                    "rounded-full ring-2 ring-card",
                    DOT_FILL[accent],
                    selected ? "size-2.5" : "size-1.5 opacity-80"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 交互层：触摸热区 + x 轴标签 ── */}
      <div className="absolute left-0 flex" style={{ top: 0, height: TOTAL_H, paddingLeft: Y_AXIS_W, right: 0 }}>
        {/* 触摸热区（覆盖绘图区高度，点击选中对应列） */}
        <div className="absolute inset-x-0 flex" style={{ top: 0, height: PLOT_H }}>
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
        {/* x 轴标签（底部固定高度区） */}
        <div className="absolute inset-x-0 flex" style={{ top: PLOT_H, height: X_LABEL_H }}>
          {points.map((p, i) => {
            const selected = i === selectedIndex;
            return (
              <div key={i} className="flex-1 overflow-visible text-center">
                {p.label && (
                  <span
                    className={cn(
                      "text-[0.6rem] tabular-nums",
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
  );
}
