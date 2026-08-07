"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import { ACCENT_TEXT, type Accent } from "./metrics";

export type GrowthPoint = {
  label: string; // x 轴短标签
  value: number | null; // 原始存储值（克/毫米）；null = 无数据
  isCurrent: boolean;
  index?: number; // 原始桶索引，点击时回传用于联动选中明细
};

const COLOR_VAR: Record<Accent, { light: string; dark: string }> = {
  rose: { light: "#f43f5e", dark: "#fb7185" },
  teal: { light: "#14b8a6", dark: "#2dd4bf" },
  amber: { light: "#f59e0b", dark: "#fbbf24" },
  indigo: { light: "#6366f1", dark: "#818cf8" },
  pink: { light: "#ec4899", dark: "#f472b6" },
  cyan: { light: "#06b6d4", dark: "#22d3ee" },
  violet: { light: "#8b5cf6", dark: "#a78bfa" },
};

function valueNumber(formatted: string): string {
  const parts = formatted.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(0, -1).join(" ") : formatted;
}
function valueUnit(formatted: string): string {
  const parts = formatted.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function ChartTooltip({
  active,
  payload,
  formatValue,
  accent,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: { fullLabel?: string } }>;
  formatValue: (v: number) => string;
  accent: Accent;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  const raw = p.value;
  const v = typeof raw === "number" ? raw : null;
  return (
    <div className="rounded-lg bg-card px-2.5 py-1.5 shadow-md ring-1 ring-foreground/[0.06]">
      <div className="text-[0.6rem] text-muted-foreground">{p.payload?.fullLabel}</div>
      <div className={`text-xs font-bold tabular-nums ${ACCENT_TEXT[accent]}`}>
        {v != null ? formatValue(v) : "无数据"}
      </div>
    </div>
  );
}

/**
 * 用 Recharts 的「显式宽高」写法（不依赖 ResponsiveContainer），
 * 避免容器高度探测失败导致只渲染 dot 不渲染线。
 */
export function GrowthChart({
  points,
  accent,
  formatValue,
  onSelect,
}: {
  points: GrowthPoint[];
  accent: Accent;
  formatValue: (v: number) => string;
  selectedIndex?: number;
  onSelect: (i: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const color = COLOR_VAR[accent][dark ? "dark" : "light"];

  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(200, el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // label 仅在有值时保留；fullLabel 给 tooltip；index 回传原始桶索引用于联动明细
  const data = points.map((p) => ({
    label: p.value != null ? p.label : "",
    fullLabel: p.label,
    value: p.value,
    index: p.index ?? 0,
  }));

  const values = points.map((p) => p.value).filter((v): v is number => v != null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const span = max - min > 0 ? max - min : Math.max(1, Math.abs(max) * 0.1);
  const yDomain: [number, number] = [
    Math.floor(min - span * 0.15),
    Math.ceil(max + span * 0.15),
  ];

  const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const axisColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const unit = values.length > 0 ? valueUnit(formatValue(max)) : "";

  const H = 170; // 图表总高（含 x 轴）
  const margin = { top: 8, right: 12, left: 0, bottom: 0 };

  return (
    <div ref={wrapRef} className="w-full">
      {unit && (
        <div className="relative h-4">
          <span className="absolute left-0 text-[0.6rem] tabular-nums text-muted-foreground">
            {unit}
          </span>
        </div>
      )}
      <LineChart
        width={w}
        height={H}
        data={data}
        margin={margin}
        onClick={(e: unknown) => {
          const ev = e as { activeTooltipIndex?: number | null } | undefined;
          const idx = ev?.activeTooltipIndex;
          if (typeof idx === "number") {
            const point = data[idx];
            if (point) onSelect(point.index);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: axisColor }}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
          interval={0}
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 10, fill: axisColor }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v: number) => valueNumber(formatValue(Math.round(v)))}
          allowDecimals={false}
        />
        <Tooltip
          content={<ChartTooltip formatValue={formatValue} accent={accent} />}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2.5, fill: color, stroke: dark ? "#1a1a1a" : "#fff", strokeWidth: 1 }}
          activeDot={{ r: 5, fill: color, stroke: dark ? "#1a1a1a" : "#fff", strokeWidth: 2 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}
