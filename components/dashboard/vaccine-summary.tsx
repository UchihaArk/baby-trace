"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { VaccineFormDrawer } from "@/components/vaccine/vaccine-form-drawer";
import { VaccineHistoryDrawer } from "@/components/vaccine/vaccine-history-drawer";
import { useVaccines } from "@/lib/hooks";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * 仪表盘「疫苗」卡片：
 * - 显示上次接种的疫苗名 + 时间（relative）。
 * - 「已接种 N 针」为可点击的数字，打开接种历史抽屉（按接种时间正序）。
 * - 右上角 + 按钮快速录入。
 */
export function VaccineSummary({ babyId }: { babyId: number }) {
  const { data } = useVaccines(babyId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const list = data ?? [];
  const count = list.length;
  const last = count > 0 ? list[count - 1] : null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground">疫苗</h3>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 transition active:scale-95 dark:text-blue-400"
        >
          <Plus className="size-3.5" /> 记录
        </button>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3">
          {/* 左：上次接种信息 */}
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">上次接种</div>
            {last ? (
              <>
                <div className="mt-1 truncate text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {last.name}
                  {last.dose ? ` · ${last.dose}` : ""}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {formatRelative(last.vaccinatedAt)}
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-sm font-semibold text-muted-foreground/40">暂无记录</div>
                <div className="mt-0.5 text-xs text-muted-foreground">点击右侧记录首次接种</div>
              </>
            )}
          </div>

          {/* 右：已接种针数（可点击查看历史） */}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className={cn(
              "flex shrink-0 flex-col items-center justify-center rounded-2xl px-5 py-2 transition active:scale-95",
              count > 0 ? "bg-blue-500/10" : "bg-muted/40"
            )}
            aria-label={`查看接种记录，共 ${count} 针`}
          >
            <span
              className={cn(
                "text-3xl font-bold tabular-nums leading-none",
                count > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/40"
              )}
            >
              {count}
            </span>
            <span
              className={cn(
                "mt-1 text-[0.65rem] font-medium",
                count > 0 ? "text-blue-600/80 dark:text-blue-400/80" : "text-muted-foreground"
              )}
            >
              已接种针
            </span>
          </button>
        </div>
      </div>

      <VaccineHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} babyId={babyId} />
      <VaccineFormDrawer open={formOpen} editing={null} onOpenChange={setFormOpen} babyId={babyId} />
    </section>
  );
}
