"use client";

import { useEffect, useState } from "react";
import { Droplets, Baby, Utensils } from "lucide-react";
import { useBaby } from "@/components/baby/baby-provider";
import { useTodayStats } from "@/lib/hooks";
import { completedMonths, gapClock, gapState, suggestIntervalSec, type GapLevel } from "@/lib/feed-intervals";
import { nowSec } from "@/lib/time";
import { cn } from "@/lib/utils";

/** 每秒 tick 一次，驱动「上次喂奶/吸奶」间隔实时更新 */
function useNowTick(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return nowSec();
}

/** 卡片铺色：按间隔状态给整张卡上背景/边框。Tailwind 字面量。 */
const TONE_CARD: Record<GapLevel | "default", string> = {
  ok: "bg-emerald-500/10 ring-emerald-500/30",
  focus: "bg-amber-500/10 ring-amber-500/30",
  suggest: "bg-rose-500/10 ring-rose-500/30",
  default: "bg-card ring-foreground/10",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentText,
  accentBg,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accentText: string;
  accentBg: string;
  tone?: GapLevel | "default";
}) {
  return (
    <div className={cn("rounded-2xl p-4 ring-1 transition-colors", TONE_CARD[tone])}>
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
  const { baby } = useBaby();
  const { data } = useTodayStats(babyId);

  const bottleMl = data?.bottleMl ?? 0;
  const breastMin = data?.breastMin ?? 0;
  const diaperCount = data?.diaperCount ?? 0;
  const wetCount = data?.wetCount ?? 0;
  const dirtyCount = data?.dirtyCount ?? 0;
  const lastFeed = data?.lastFeed;
  const lastBreastFeed = data?.lastBreastFeed;
  const pumpMl = data?.pumpMl ?? 0;
  const lastPump = data?.lastPump;
  const lastDiaper = data?.lastDiaper;

  // 月龄 → 喂奶/吸奶/换尿布的建议间隔（按宝宝实际年龄分段）
  const months = baby ? completedMonths(new Date(baby.birthDate)) : 0;
  const feedInterval = suggestIntervalSec("feed", months);
  const pumpInterval = suggestIntervalSec("pump", months);
  const diaperInterval = suggestIntervalSec("diaper", months);

  // 有任一「上次」记录时启动每秒 tick
  const now = useNowTick(!!lastFeed || !!lastPump || !!lastBreastFeed || !!lastDiaper);

  const feedGap = lastFeed ? Math.max(0, now - lastFeed.startTime) : 0;
  const feedGapSt = lastFeed ? gapState(feedGap, feedInterval, "喂养") : null;
  // 今日产奶时差：取上次吸奶与上次亲喂中更近的一次（亲喂也算变相产奶）
  const lastMilkSec = Math.max(
    ...[lastPump?.startTime, lastBreastFeed?.startTime].filter(
      (t): t is number => typeof t === "number"
    ),
    -Infinity
  );
  const hasLastMilk = Number.isFinite(lastMilkSec);
  const pumpGap = hasLastMilk ? Math.max(0, now - lastMilkSec) : 0;
  const pumpGapSt = hasLastMilk ? gapState(pumpGap, pumpInterval, "吸奶") : null;
  const diaperGap = lastDiaper ? Math.max(0, now - lastDiaper.startTime) : 0;
  const diaperGapSt = lastDiaper ? gapState(diaperGap, diaperInterval, "更换") : null;

  // 今日喂奶：瓶喂为 0 但有亲喂时，重点突出亲喂时长
  const feedBreastOnly = bottleMl === 0 && breastMin > 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="今日喂奶"
        value={
          feedBreastOnly ? (
            <span className="whitespace-nowrap">
              亲喂 {breastMin}
              <span className="ml-1 text-base font-semibold text-muted-foreground">分钟</span>
            </span>
          ) : (
            <MlValue ml={bottleMl} />
          )
        }
        sub={
          feedBreastOnly
            ? `瓶喂 ${bottleMl} ml`
            : breastMin > 0
              ? `亲喂 ${breastMin} 分钟`
              : undefined
        }
        icon={Utensils}
        accentText="text-rose-600 dark:text-rose-400"
        accentBg="bg-rose-500/10"
      />
      <StatCard
        label="上次喂奶"
        tone={feedGapSt?.level ?? "default"}
        value={lastFeed ? gapClock(feedGap) : "—"}
        sub={
          lastFeed ? (
            <span className={cn(feedGapSt?.textClass && "font-medium", feedGapSt?.textClass)}>
              {feedGapSt?.label ?? "距上次"}
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
        tone={pumpMl === 0 && breastMin === 0 ? "default" : pumpGapSt?.level ?? "default"}
        value={<MlValue ml={pumpMl} />}
        sub={
          pumpMl === 0 && breastMin === 0 ? (
            <span>今天还没有吸奶 💪</span>
          ) : pumpMl === 0 && breastMin > 0 ? (
            <span className={cn(pumpGapSt?.textClass && "font-medium", pumpGapSt?.textClass)}>
              今日均用于亲喂 · 距上次 {gapClock(pumpGap)}
            </span>
          ) : (
            <span className={cn(pumpGapSt?.textClass && "font-medium", pumpGapSt?.textClass)}>
              {pumpGapSt?.label
                ? `${pumpGapSt.label} · 距上次 ${gapClock(pumpGap)}`
                : `距上次 ${gapClock(pumpGap)}`}
            </span>
          )
        }
        icon={Droplets}
        accentText="text-teal-600 dark:text-teal-400"
        accentBg="bg-teal-500/10"
      />
      <StatCard
        label="今日尿布"
        tone={diaperGapSt?.level ?? "default"}
        value={
          <span className="whitespace-nowrap">
            {diaperCount}
            <span className="ml-1 text-base font-semibold text-muted-foreground">次</span>
          </span>
        }
        sub={
          lastDiaper ? (
            <span className={cn(diaperGapSt?.textClass && "font-medium", diaperGapSt?.textClass)}>
              {diaperGapSt?.label
                ? `${diaperGapSt.label} · 距上次 ${gapClock(diaperGap)}`
                : `💩 ${dirtyCount} · 距上次 ${gapClock(diaperGap)}`}
            </span>
          ) : (
            `💩 ${dirtyCount} · 💧 ${wetCount}`
          )
        }
        icon={Baby}
        accentText="text-amber-600 dark:text-amber-400"
        accentBg="bg-amber-500/10"
      />
    </div>
  );
}
