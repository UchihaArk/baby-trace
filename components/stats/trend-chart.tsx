"use client";

import { cn } from "@/lib/utils";
import { ACCENT_BAR, ACCENT_TEXT, type Accent } from "./metrics";

export type TrendBar = {
  label: string; // x 轴短标签
  value: number | null; // 日均；null = 无数据
  isCurrent: boolean; // 当前（尚未结束的）周期
};

/**
 * 轻量柱状趋势图（纯 div + Tailwind，无第三方依赖；移动端 tap 友好）。
 * - 选中柱：满色 + 顶部数值
 * - 当前期：未选中时加虚线环，提示"进行中/不完整"
 * - 无数据：底部一道虚线
 * - 柱高上限 86%，顶部留白放数值标签
 */
export function TrendChart({
  bars,
  accent,
  formatValue,
  selectedIndex,
  onSelect,
}: {
  bars: TrendBar[];
  accent: Accent;
  formatValue: (v: number) => string;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const PLOT_H = 128; // px，固定绘图区高度（% 高度需父级定高）
  const TOP = 86; // 柱高百分比上限，留顶部空间放数值
  const max = bars.reduce((m, b) => (b.value != null && b.value > m ? b.value : m), 0);

  return (
    <div className="flex items-end gap-1" style={{ height: PLOT_H + 20 }}>
      {bars.map((b, i) => {
        const selected = i === selectedIndex;
        const v = b.value;
        const has = v != null && v > 0;
        const pct = has && max > 0 ? Math.max(8, Math.min(TOP, (v / max) * TOP)) : 0;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected}
            aria-label={`${b.label}${v != null ? `：日均 ${formatValue(v)}` : "：无数据"}${b.isCurrent ? "（进行中）" : ""}`}
            className="group flex h-full flex-1 flex-col items-center justify-end focus-visible:outline-none"
          >
            <div className="relative flex w-full items-end justify-center" style={{ height: PLOT_H }}>
              {selected && v != null && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-bold tabular-nums",
                    ACCENT_TEXT[accent]
                  )}
                  style={{ bottom: `${pct}%`, marginBottom: 2 }}
                >
                  {formatValue(v)}
                </div>
              )}
              {has ? (
                <div
                  className={cn(
                    "w-full max-w-[26px] rounded-t-md transition-all duration-200",
                    ACCENT_BAR[accent],
                    selected ? "opacity-100" : "opacity-40 group-active:opacity-70",
                    b.isCurrent && !selected && "ring-1 ring-inset ring-foreground/20"
                  )}
                  style={{ height: `${pct}%` }}
                />
              ) : (
                <div className="w-full max-w-[26px] border-t-2 border-dashed border-muted-foreground/25" />
              )}
            </div>
            <span
              className={cn(
                "mt-1 text-[0.62rem] tabular-nums transition-colors",
                selected ? "font-bold text-foreground" : "text-muted-foreground",
                v == null && "opacity-50"
              )}
            >
              {b.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
