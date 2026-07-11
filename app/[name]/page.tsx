"use client";

import { RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";
import { TodayBanner } from "@/components/dashboard/today-banner";
import { TodaySummary } from "@/components/dashboard/today-summary";
import { ActionDock } from "@/components/dashboard/action-dock";
import { BodySummary } from "@/components/dashboard/body-summary";
import { useBaby } from "@/components/baby/baby-provider";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { baby, isLoading } = useBaby();
  const { mutate } = useSWRConfig();
  const { pull, refreshing, pulling } = usePullToRefresh(async () => {
    if (!baby) return;
    // 重验本宝宝的「今日统计」「最近动态」与「身体测量」
    await mutate(
      (k) =>
        typeof k === "string" &&
        (k.startsWith(`stats:${baby.id}:`) ||
          k.startsWith(`logs:${baby.id}:`) ||
          k.startsWith(`measurements:${baby.id}:`))
    );
  });

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  return (
    <>
      {/* 下拉刷新指示器（全宽，置于 px-4 容器之外，不参与 space-y） */}
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden text-muted-foreground",
          !pulling && "transition-[height] duration-200 ease-out"
        )}
        style={{ height: refreshing ? 56 : pull }}
      >
        <RefreshCw className={cn("size-5 transition-transform", refreshing && "animate-spin")} />
      </div>
      <div className="space-y-6 px-4 pb-8 pt-3">
        <TodayBanner />
        <TodaySummary babyId={baby.id} />
        <BodySummary babyId={baby.id} />
        <ActionDock babyId={baby.id} />
      </div>
    </>
  );
}
