"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useBaby } from "@/components/baby/baby-provider";
import { TimelineItem } from "@/components/dashboard/timeline-item";
import { Chip } from "@/components/log-entry/chip";
import { HISTORY_PAGE_SIZE, useBabyLogsInfinite } from "@/lib/hooks";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { subscribeLogsMutated } from "@/lib/log-events";
import { dateLabel, formatDate, startOfLocalDaySec } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { ActivityType, LogApi } from "@/lib/types";

type Group = { key: string; label: string; dayStart: number; logs: LogApi[] };
type Filter = "all" | ActivityType;

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

function groupByDay(logs: LogApi[]): Group[] {
  const todayStart = startOfLocalDaySec();
  const map = new Map<number, LogApi[]>();
  for (const log of logs) {
    const dayStart = startOfLocalDaySec(new Date(log.startTime * 1000));
    const arr = map.get(dayStart) ?? [];
    arr.push(log);
    map.set(dayStart, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, dayLogs]) => ({
      key: String(dayStart),
      dayStart,
      label: dateLabel(dayStart, todayStart),
      logs: dayLogs,
    }));
}

export default function HistoryPage() {
  const { baby, isLoading: babyLoading } = useBaby();
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data, setSize, isValidating, mutate: mutateLogs } = useBabyLogsInfinite(baby?.id ?? null);
  const { pull, refreshing, pulling } = usePullToRefresh(async () => {
    await mutateLogs();
  });
  const pages = data ?? [];
  const allLogs = pages.flat();
  const lastPage = pages[pages.length - 1];
  const reachedEnd = pages.length > 0 && (!lastPage || lastPage.length < HISTORY_PAGE_SIZE);
  const initialLoading = pages.length === 0 && isValidating;

  const groups = useMemo(() => groupByDay(allLogs), [allLogs]);
  const filteredGroups = useMemo(() => {
    if (filter === "all") return groups;
    return groups
      .map((g) => ({ ...g, logs: g.logs.filter((l) => l.activityType === filter) }))
      .filter((g) => g.logs.length > 0);
  }, [groups, filter]);

  // 首次加载后默认展开“今天”
  useEffect(() => {
    if (initialized.current || groups.length === 0) return;
    initialized.current = true;
    const todayKey = String(startOfLocalDaySec());
    const hasToday = groups.some((g) => g.key === todayKey);
    setExpanded(new Set([hasToday ? todayKey : groups[0].key]));
  }, [groups]);

  // 日志增删改后，用 bound mutate 刷新无限滚动列表（useSWRInfinite 不响应全局 mutate）
  useEffect(() => subscribeLogsMutated(() => { void mutateLogs(); }), [mutateLogs]);

  // 无限滚动：底部哨兵进入视口时加载下一页
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || reachedEnd || isValidating || babyLoading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setSize((s) => s + 1);
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reachedEnd, isValidating, setSize, babyLoading]);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
      <div className="flex gap-2 overflow-x-auto pb-3">
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

      {initialLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          还没有记录
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          {reachedEnd ? "该类型暂无记录" : "加载中…"}
        </div>
      ) : (
        filteredGroups.map((g) => {
          const isOpen = expanded.has(g.key);
          return (
            <section key={g.key} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(g.key)}
                className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-2 text-left"
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{g.label}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(g.dayStart)}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {g.logs.length} 条
                  <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>
              {isOpen && (
                <div className="divide-y divide-border">
                  {g.logs.map((log) => (
                    <TimelineItem key={log.id} log={log} babyId={baby.id} showType />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}

      <div ref={sentinelRef} className="h-1" />
      {!reachedEnd && isValidating && pages.length > 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">加载更早的记录…</div>
      )}
      {reachedEnd && allLogs.length > 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">没有更早的记录了</div>
      )}
    </main>
  );
}
