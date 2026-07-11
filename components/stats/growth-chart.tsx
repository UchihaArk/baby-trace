"use client";

import { cn } from "@/lib/utils";
import { ACCENT_LINE, ACCENT_TEXT, type Accent } from "./metrics";

export type GrowthPoint = {
  label: string; // x 轴短标签
  value: number | null; // 该周期代表值（快照）；null = 无数据
  isCurrent: boolean; // 当前（尚未结束的）周期
};

/**
 * 轻量折线趋势图（纯 SVG + Tailwind，无第三方依赖；移动端 tap 友好）。
 * 与 TrendChart 同范式：选中点高亮 + 顶部数值、无数据断线、当前期虚线圈。
 * 体重/身高等「连续测量值」用折线比柱状更能体现增长趋势。
 *
 * 布局：外层 relative，两层叠放——
 * 1) 视觉层（pointer-events-none）：折线 SVG + 圆点 div + 数值标签
 * 2) 交互层：透明按钮横排（仅负责点击 + 底部 x 轴标签）
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
  const PLOT_H = 128; // 绘图区高度（px），与 TrendChart 对齐
  const LABEL_H = 20; // x 轴标签高度
  const PAD_TOP = 16; // 顶部留白放数值标签
  const PAD_BOTTOM = 6;
  const plotH = PLOT_H - PAD_TOP - PAD_BOTTOM;

  const values = points.map((p) => p.value).filter((v): v is number => v != null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  // y 轴留 12% 上下边距，避免折线贴顶/贴底
  const span = max - min > 0 ? max - min : 1;
  const lo = min - span * 0.12;
  const hi = max + span * 0.12;
  const range = hi - lo || 1;

  const n = points.length;
  const xPercent = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yPx = (v: number) => PAD_TOP + (1 - (v - lo) / range) * plotH;

  // 连续有数据的段（遇到 null 断开），每段生成一条 polyline
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

  const dotBg =
    accent === "pink"
      ? "bg-pink-500 dark:bg-pink-400"
      : accent === "cyan"
        ? "bg-cyan-500 dark:bg-cyan-400"
        : "bg-primary";

  return (
    <div className="relative" style={{ height: PLOT_H + LABEL_H }}>
      {/* ── 视觉层：折线 + 圆点 + 数值标签（不拦截点击） ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* 折线（SVG viewBox 横向 0..100 与 xPercent 对齐；纵向用实际 px） */}
        <svg
          className="absolute inset-x-0 top-0"
          style={{ height: PLOT_H }}
          viewBox="0 0 100 128"
          preserveAspectRatio="none"
        >
          {segments.map((seg, si) =>
            seg.length >= 2 ? (
              <polyline
                key={si}
                points={seg
                  .map((idx) => {
                    const v = points[idx].value as number;
                    return `${xPercent(idx).toFixed(2)},${yPx(v).toFixed(2)}`;
                  })
                  .join(" ")}
                className={cn(ACCENT_LINE[accent], "fill-none")}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null
          )}
        </svg>

        {/* 圆点 + 选中数值标签（HTML 绝对定位，避免 SVG 缩放致圆变椭圆） */}
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
              {selected && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-bold tabular-nums",
                    ACCENT_TEXT[accent]
                  )}
                  style={{ bottom: "100%", marginBottom: 2 }}
                >
                  {formatValue(v)}
                </div>
              )}
              {p.isCurrent && !selected && (
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-foreground/30"
                  )}
                />
              )}
              <div
                className={cn(
                  "rounded-full ring-2 ring-card transition-transform",
                  dotBg,
                  selected ? "size-2.5" : "size-1.5 opacity-50"
                )}
              />
            </div>
          );
        })}

        {/* 无数据点：底部一道虚线（与 TrendChart 一致） */}
        {points.map((p, i) =>
          p.value == null ? (
            <div
              key={i}
              className="absolute bottom-5 w-full max-w-[26px] -translate-x-1/2 border-t-2 border-dashed border-muted-foreground/25"
              style={{ left: `${xPercent(i)}%` }}
            />
          ) : null
        )}
      </div>

      {/* ── 交互层：透明按钮横排，仅负责点击 + x 轴标签 ── */}
      <div className="absolute inset-0 flex items-end gap-1">
        {points.map((p, i) => {
          const selected = i === selectedIndex;
          const has = p.value != null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={selected}
              aria-label={`${p.label}${has ? `：${formatValue(p.value as number)}` : "：无数据"}${p.isCurrent ? "（进行中）" : ""}`}
              className="flex h-full flex-1 flex-col items-center justify-end focus-visible:outline-none"
            >
              <span style={{ height: PLOT_H }} />
              <span
                className={cn(
                  "mt-1 text-[0.62rem] tabular-nums transition-colors",
                  selected ? "font-bold text-foreground" : "text-muted-foreground",
                  !has && "opacity-50"
                )}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
