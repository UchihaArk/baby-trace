"use client";

import { useEffect, useState } from "react";
import { Droplets, Baby, Utensils } from "lucide-react";
import { useTodayStats } from "@/lib/hooks";
import { formatRelative, nowSec } from "@/lib/time";
import { cn } from "@/lib/utils";

/** 喂奶间隔阈值（秒）：< FOCUS 关注 / > SUGGEST 建议喂养 */
const FEED_FOCUS_SEC = 2 * 3600;
const FEED_SUGGEST_SEC = 3 * 3600;

/** 每秒 tick 一次，驱动「上次喂奶」间隔实时更新 */
function useNowTick(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return nowSec();
}

/** 根据距上次喂奶的秒数，返回间隔状态 */
function feedGapState(gapSec: number): {
  level: "ok" | "focus" | "suggest";
  label: string;
  dotClass: string;
  textClass: string;
} {
  if (gapSec >= FEED_SUGGEST_SEC) {
    return {
      level: "suggest",
      label: "建议喂养",
      dotClass: "bg-rose-500 animate-pulse",
      textClass: "text-rose-600 dark:text-rose-400",
    };
  }
  if (gapSec >= FEED_FOCUS_SEC) {
    return {
      level: "focus",
      label: "该关注了",
      dotClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  return { level: "ok", label: "", dotClass: "bg-emerald-500", textClass: "" };
}

/** 把秒数格式化为「X时Y分」/「X分」 */
function gapClock(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h} 时 ${mm} 分` : `${h} 时`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentText,
  accentBg,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accentText: string;
  accentBg: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-6 items-center justify-center rounded-full", accentBg)}>
          <Icon className={cn("size-3.5", accentText)} />
        </span>
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** 数字 + ml 内联展示，并用 nowrap 避免单位换行 */
function MlValue({ ml }: { ml: number }) {
  return (
    <span className="whitespace-nowrap">
      {ml}
      <span className="ml-1 text-base font-semibold text-muted-foreground">ml</span>
    </span>
  );
}

export function TodaySummary({ babyId }: { babyId: number }) {
  const { data } = useTodayStats(babyId);

  const bottleMl = data?.bottleMl ?? 0;
  const breastMin = data?.breastMin ?? 0;
  const diaperCount = data?.diaperCount ?? 0;
  const wetCount = data?.wetCount ?? 0;
  const dirtyCount = data?.dirtyCount ?? 0;
  const lastFeed = data?.lastFeed;
  const pumpMl = data?.pumpMl ?? 0;
  const lastPump = data?.lastPump;

  // 「上次喂奶」间隔：有 lastFeed 时每秒 tick 实时更新
  const now = useNowTick(!!lastFeed);
  const feedGap = lastFeed ? Math.max(0, now - lastFeed.startTime) : 0;
  const gap = lastFeed ? feedGapState(feedGap) : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="今日喂奶"
        value={<MlValue ml={bottleMl} />}
        sub={breastMin > 0 ? `亲喂 ${breastMin} 分钟` : undefined}
        icon={Utensils}
        accentText="text-rose-600 dark:text-rose-400"
        accentBg="bg-rose-500/10"
      />
      <StatCard
        label="上次喂奶"
        value={
          lastFeed ? (
            <span className="flex items-center gap-1.5">
              {gap && <span className={cn("size-2 shrink-0 rounded-full", gap.dotClass)} />}
              {gapClock(feedGap)}
            </span>
          ) : (
            "—"
          )
        }
        sub={
          lastFeed ? (
            <span className={cn(gap?.textClass && "font-medium", gap?.textClass)}>
              {gap?.label && `${gap.label} · `}
              {formatRelative(lastFeed.startTime)}
            </span>
          ) : (
            "今天还没喂"
          )
        }
        icon={Droplets}
        accentText="text-rose-600 dark:text-rose-400"
        accentBg="bg-rose-500/10"
      />
      <StatCard
        label="今日产奶"
        value={<MlValue ml={pumpMl} />}
        sub={lastPump ? `上次吸奶 ${formatRelative(lastPump.startTime)}` : "暂无记录"}
        icon={Droplets}
        accentText="text-teal-600 dark:text-teal-400"
        accentBg="bg-teal-500/10"
      />
      <StatCard
        label="今日尿布"
        value={
          <span className="whitespace-nowrap">
            {diaperCount}
            <span className="ml-1 text-base font-semibold text-muted-foreground">次</span>
          </span>
        }
        sub={`💩 ${dirtyCount} · 💧 ${wetCount}`}
        icon={Baby}
        accentText="text-amber-600 dark:text-amber-400"
        accentBg="bg-amber-500/10"
      />
    </div>
  );
}
