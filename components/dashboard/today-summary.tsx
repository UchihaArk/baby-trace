"use client";

import { Droplets, Baby, Utensils } from "lucide-react";
import { useTodayStats } from "@/lib/hooks";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

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
  const feedCount = data?.feedCount ?? 0;
  const lastFeed = data?.lastFeed;
  const pumpMl = data?.pumpMl ?? 0;
  const lastPump = data?.lastPump;

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
        value={lastFeed ? formatRelative(lastFeed.startTime) : "—"}
        sub={`今天已喂 ${feedCount} 次`}
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
