"use client";

import { Droplets, Moon, Baby, Utensils } from "lucide-react";
import { useElapsed, useTodayStats } from "@/lib/hooks";
import { formatClock, formatRelative } from "@/lib/time";
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
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-6 items-center justify-center rounded-full", accentBg)}>
          <Icon className={cn("size-3.5", accentText)} />
        </span>
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function TodaySummary({ babyId }: { babyId: number }) {
  const { data } = useTodayStats(babyId);
  const elapsed = useElapsed(data?.openSleep?.startTime ?? null);

  const bottleMl = data?.bottleMl ?? 0;
  const breastMin = data?.breastMin ?? 0;
  const diaperCount = data?.diaperCount ?? 0;
  const lastFeed = data?.lastFeed;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="今日奶量"
        value={`${bottleMl}`}
        sub={breastMin > 0 ? `ml · 亲喂 ${breastMin} 分` : "ml"}
        icon={Utensils}
        accentText="text-rose-600 dark:text-rose-400"
        accentBg="bg-rose-500/10"
      />
      <StatCard
        label="今日尿布"
        value={`${diaperCount}`}
        sub="次"
        icon={Baby}
        accentText="text-amber-600 dark:text-amber-400"
        accentBg="bg-amber-500/10"
      />
      <StatCard
        label="上次喂奶"
        value={lastFeed ? formatRelative(lastFeed.startTime) : "—"}
        sub={lastFeed ? undefined : "暂无记录"}
        icon={Droplets}
        accentText="text-rose-600 dark:text-rose-400"
        accentBg="bg-rose-500/10"
      />
      <StatCard
        label="睡眠"
        value={data?.openSleep && elapsed != null ? formatClock(elapsed) : "—"}
        sub={data?.openSleep ? "进行中 · 点击停止" : "未开始"}
        icon={Moon}
        accentText="text-indigo-600 dark:text-indigo-400"
        accentBg="bg-indigo-500/10"
      />
    </div>
  );
}
