"use client";

import { TodaySummary } from "@/components/dashboard/today-summary";
import { ActionDock } from "@/components/dashboard/action-dock";
import { Timeline } from "@/components/dashboard/timeline";
import { useBaby } from "@/components/baby/baby-provider";

export default function DashboardPage() {
  const { baby, isLoading } = useBaby();
  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }
  return (
    <div className="space-y-6 px-4 pb-8 pt-3">
      <TodaySummary babyId={baby.id} />
      <ActionDock babyId={baby.id} />
      <Timeline babyId={baby.id} />
    </div>
  );
}
