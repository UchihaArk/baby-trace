"use client";

import { Plus, Pencil } from "lucide-react";
import { useLogEntry } from "@/components/log-entry/log-entry-provider";
import { useMeasurements } from "@/lib/hooks";
import { formatHeight, formatWeight } from "@/lib/measure";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { MeasurementKind } from "@/lib/types";

type KindConfig = {
  emoji: string;
  label: string;
  format: (v: number) => string;
  accentText: string;
  accentBg: string;
  accentRing: string;
};

const KIND_CONFIG: Record<MeasurementKind, KindConfig> = {
  weight: {
    emoji: "⚖️",
    label: "体重",
    format: formatWeight,
    accentText: "text-pink-600 dark:text-pink-400",
    accentBg: "bg-pink-500/10",
    accentRing: "ring-pink-500/20",
  },
  height: {
    emoji: "📏",
    label: "身高",
    format: formatHeight,
    accentText: "text-cyan-600 dark:text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentRing: "ring-cyan-500/20",
  },
};

function MeasureCard({
  kind,
  babyId,
}: {
  kind: MeasurementKind;
  babyId: number;
}) {
  const cfg = KIND_CONFIG[kind];
  const { data } = useMeasurements(babyId, kind);
  const { openWeight, openHeight } = useLogEntry();
  const open = kind === "weight" ? openWeight : openHeight;

  const latest = data && data.length > 0 ? data[data.length - 1] : null;
  const prev = data && data.length >= 2 ? data[data.length - 2] : null;

  // 与上次测量的变化量（正/负箭头）
  let delta: string | null = null;
  if (latest && prev) {
    const diff = latest.valueGrams - prev.valueGrams;
    if (diff !== 0) {
      const signed = diff > 0 ? `+${cfg.format(diff)}` : `-${cfg.format(-diff)}`;
      delta = signed;
    }
  }

  return (
    <div className={cn("rounded-2xl bg-card p-4 ring-1 ring-foreground/[0.06] shadow-sm", latest && cfg.accentRing)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {cfg.emoji} {cfg.label}
        </span>
        {latest && (
          <button
            type="button"
            onClick={() => open(latest)}
            className={cn("flex size-6 items-center justify-center rounded-full", cfg.accentBg)}
            aria-label={`编辑${cfg.label}`}
          >
            <Pencil className={cn("size-3.5", cfg.accentText)} />
          </button>
        )}
      </div>
      {latest ? (
        <>
          <div className={cn("mt-1.5 text-2xl font-bold tabular-nums tracking-tight", cfg.accentText)}>
            {cfg.format(latest.valueGrams)}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            上次测量 {formatRelative(latest.measuredAt)}
            {delta && ` · ${delta}`}
          </div>
        </>
      ) : (
        <>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-muted-foreground/40">—</div>
          <div className="truncate text-xs text-muted-foreground">暂无记录</div>
        </>
      )}
    </div>
  );
}

export function BodySummary({ babyId }: { babyId: number }) {
  const { openWeight, openHeight } = useLogEntry();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground">身体</h3>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => openWeight()}
            className="flex items-center gap-1 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-600 transition active:scale-95 dark:text-pink-400"
          >
            <Plus className="size-3.5" /> 体重
          </button>
          <button
            type="button"
            onClick={() => openHeight()}
            className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 transition active:scale-95 dark:text-cyan-400"
          >
            <Plus className="size-3.5" /> 身高
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MeasureCard kind="weight" babyId={babyId} />
        <MeasureCard kind="height" babyId={babyId} />
      </div>
    </section>
  );
}
