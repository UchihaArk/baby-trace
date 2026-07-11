"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useBaby } from "@/components/baby/baby-provider";
import { TimelineItem } from "@/components/dashboard/timeline-item";
import { Chip } from "@/components/log-entry/chip";
import { useLogsByDay } from "@/lib/hooks";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { formatDate, startOfLocalDaySec } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

type Filter = "all" | ActivityType;

const DAY = 86400;

const FILTERS: { value: Filter; label: string; selectedClass?: string }[] = [
  { value: "all", label: "全部" },
  { value: "feed", label: "🍼 喂奶", selectedClass: "border-transparent bg-rose-500 text-white" },
  { value: "diaper", label: "🧻 尿布", selectedClass: "border-transparent bg-amber-500 text-white" },
  { value: "pump", label: "🥛 吸奶", selectedClass: "border-transparent bg-teal-500 text-white" },
  { value: "sleep", label: "💤 睡眠", selectedClass: "border-transparent bg-indigo-500 text-white" },
  { value: "bath", label: "🛁 洗澡", selectedClass: "border-transparent bg-sky-500 text-white" },
  { value: "haircut", label: "💈 理发", selectedClass: "border-transparent bg-violet-500 text-white" },
  { value: "nail", label: "✂️ 剪指甲", selectedClass: "border-transparent bg-emerald-500 text-white" },
];

export default function HistoryPage() {
  const { baby, isLoading: babyLoading } = useBaby();
  const [filter, setFilter] = useState<Filter>("all");
  // 当前查看的日期（YYYY-MM-DD 字符串，用于 <input type="date">）
  const todayStr = formatDate(startOfLocalDaySec());
  const [dayStr, setDayStr] = useState<string>(todayStr);

  // dayStr → 当日 0 点 unix 秒
  const dayStart = useMemo(() => {
    const [y, m, d] = dayStr.split("-").map(Number);
    if (!y || !m || !d) return startOfLocalDaySec();
    return startOfLocalDaySec(new Date(y, m - 1, d));
  }, [dayStr]);

  const { data, isLoading, mutate: mutateDay } = useLogsByDay(baby?.id ?? null, dayStart);
  const { pull, refreshing, pulling } = usePullToRefresh(async () => {
    if (!baby) return;
    await mutateDay();
  });

  const logs = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.activityType === filter)),
    [logs, filter]
  );

  // 是否为今天（禁用「下一天」按钮）
  const isToday = dayStr === todayStr;

  function shiftDay(delta: number) {
    const next = dayStart + delta * DAY;
    setDayStr(formatDate(next));
  }

  if (babyLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  return (
    <main className="px-4 pb-8 pt-2">
      {/* 下拉刷新指示器 */}
      <div
        className={cn(
          "-mx-4 flex items-center justify-center overflow-hidden text-muted-foreground",
          !pulling && "transition-[height] duration-200 ease-out"
        )}
        style={{ height: refreshing ? 56 : pull }}
      >
        <RefreshCw className={cn("size-5 transition-transform", refreshing && "animate-spin")} />
      </div>

      {/* 日期选择器：左右箭头 + date input */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-2">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95"
          aria-label="前一天"
        >
          <ChevronLeft className="size-5" />
        </button>
        <input
          type="date"
          value={dayStr}
          max={todayStr}
          onChange={(e) => {
            const v = e.target.value;
            if (v) setDayStr(v > todayStr ? todayStr : v);
          }}
          className="flex-1 rounded-xl bg-muted/60 px-3 py-2 text-center text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          disabled={isToday}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95 disabled:opacity-30"
          aria-label="后一天"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 overflow-x-auto py-3">
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            selectedClass={f.selectedClass}
            onClick={() => setFilter(f.value)}
            className="min-h-9 flex-none px-3.5 py-1.5 text-xs"
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {/* 当日记录 */}
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {logs.length === 0 ? "这天没有记录" : "该类型暂无记录"}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((log) => (
            <TimelineItem key={log.id} log={log} babyId={baby.id} showType />
          ))}
        </div>
      )}
    </main>
  );
}
