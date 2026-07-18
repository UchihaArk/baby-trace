"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { VaccineFormDrawer } from "./vaccine-form-drawer";
import { useVaccines } from "@/lib/hooks";
import { deleteVaccine } from "@/lib/mutations";
import { formatChineseDate, formatClockTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { BabyVaccine } from "@/lib/types";

/**
 * 接种历史抽屉：按接种时间正序（最旧在前）展示全部接种记录。
 * 顶部「+ 记录疫苗」打开录入抽屉；每条可编辑/删除。
 * 由疫苗卡片上的「针次」数字点击触发。
 */
export function VaccineHistoryDrawer({
  open,
  onOpenChange,
  babyId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  babyId: number | null;
}) {
  const { data } = useVaccines(babyId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BabyVaccine | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const list = data ?? [];

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(v: BabyVaccine) {
    setEditing(v);
    setFormOpen(true);
  }
  async function doDelete() {
    if (babyId == null || deletingId == null) return;
    setBusy(true);
    await deleteVaccine(deletingId, babyId);
    setBusy(false);
    setDeletingId(null);
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-base font-semibold">💉 接种记录</DrawerTitle>
            <DrawerDescription className="sr-only">按接种时间正序的接种历史</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <Button
              onClick={openNew}
              className="mb-3 h-11 w-full bg-blue-500 text-base text-white hover:bg-blue-500/90"
            >
              <Plus className="size-4" /> 记录疫苗
            </Button>

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                还没有接种记录
              </div>
            ) : (
              <ol className="space-y-2">
                {list.map((v, i) => (
                  <li
                    key={v.id}
                    className={cn(
                      "flex items-center gap-3 ui-card p-3",
                      v.id === deletingId && "opacity-60"
                    )}
                  >
                    {/* 序号（接种顺序） */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {i + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{v.name}</span>
                        {v.dose && (
                          <span className="shrink-0 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-blue-600 dark:text-blue-400">
                            {v.dose}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {formatChineseDate(new Date(v.vaccinatedAt * 1000))} · {formatClockTime(v.vaccinatedAt)}
                      </div>
                      {v.notes && (
                        <div className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground/80">
                          📝 {v.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)} aria-label="编辑">
                        <Pencil />
                      </Button>
                      <AlertDialog open={deletingId === v.id} onOpenChange={(o) => setDeletingId(o ? v.id : null)}>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="删除" />}>
                          <Trash2 />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除这条接种记录？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {v.name}
                              {v.dose ? ` · ${v.dose}` : ""}，删除后不可恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/80"
                              onClick={doDelete}
                              disabled={busy}
                            >
                              {busy ? "删除中…" : "删除"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <VaccineFormDrawer open={formOpen} editing={editing} onOpenChange={setFormOpen} babyId={babyId} />
    </>
  );
}
