"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { useLogEntry } from "@/components/log-entry/log-entry-provider";
import { activityMeta, describeLog } from "@/lib/activity";
import { deleteLog } from "@/lib/mutations";
import { formatClockTime, formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { LogApi } from "@/lib/types";

const EDITABLE = ["feed", "diaper", "pump", "bath", "haircut", "nail"] as const;

export function TimelineItem({
  log,
  babyId,
  showActions = true,
  showType = false,
}: {
  log: LogApi;
  babyId: number;
  showActions?: boolean;
  showType?: boolean;
}) {
  const meta = activityMeta[log.activityType];
  const desc = describeLog(log);
  const { openFeed, openDiaper, openPump, openBath, openHaircut, openNail } = useLogEntry();
  const [openDel, setOpenDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = (EDITABLE as readonly string[]).includes(log.activityType);

  function onEdit() {
    switch (log.activityType) {
      case "feed":
        return openFeed(log);
      case "diaper":
        return openDiaper(log);
      case "pump":
        return openPump(log);
      case "bath":
        return openBath(log);
      case "haircut":
        return openHaircut(log);
      case "nail":
        return openNail(log);
    }
  }

  async function onDelete() {
    setDeleting(true);
    await deleteLog(log.id, babyId);
    setDeleting(false);
    setOpenDel(false);
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-lg", meta.bgSoft)}>
        <span>{meta.emoji}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {showType && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold text-white",
                meta.bgSolid
              )}
            >
              {meta.label}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-medium">{desc}</span>
        </div>
        {!showType && (
          <div className="truncate text-xs text-muted-foreground">{formatRelative(log.startTime)}</div>
        )}
        {log.notes && (
          <div className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground/80">
            📝 {log.notes}
          </div>
        )}
      </div>

      <time className="w-20 shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">
        {log.activityType === "sleep" && log.endTime
          ? `${formatClockTime(log.startTime)}–${formatClockTime(log.endTime)}`
          : formatClockTime(log.startTime)}
      </time>

      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5">
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="编辑">
              <Pencil />
            </Button>
          )}
          <AlertDialog open={openDel} onOpenChange={setOpenDel}>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="删除" />}>
              <Trash2 />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除这条记录？</AlertDialogTitle>
                <AlertDialogDescription>
                  {meta.label} · {desc}，删除后不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/80"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? "删除中…" : "删除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
