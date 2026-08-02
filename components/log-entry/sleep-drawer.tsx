"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "./chip";
import { createLog, updateLog } from "@/lib/mutations";
import { localInputToSec, nowSec, secToLocalInput } from "@/lib/time";
import type { CreateLogInput, LogApi } from "@/lib/types";

const STEP = 0.5;
const MIN_HOURS = 0.5;
const MAX_HOURS = 12;
const DEFAULT_HOURS = 2;
const PRESETS = [1, 1.5, 2, 2.5, 3];

/** 编辑时从 startTime/endTime 反推小时数；无 endTime（历史「进行中」记录）则回退默认值 */
function initHours(editing: LogApi | null): number {
  if (editing?.endTime && editing.startTime) {
    const h = (editing.endTime - editing.startTime) / 3600;
    // 取 0.5 步长的最近值，并夹到合法区间
    const snapped = Math.round(h * 2) / 2;
    if (Number.isFinite(snapped)) return Math.min(MAX_HOURS, Math.max(MIN_HOURS, snapped));
  }
  return DEFAULT_HOURS;
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export function SleepDrawer({
  open,
  editing,
  onOpenChange,
  babyId,
}: {
  open: boolean;
  editing: LogApi | null;
  onOpenChange: (o: boolean) => void;
  babyId: number | null;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <SleepForm
          key={`sleep-${editing?.id ?? "new"}`}
          babyId={babyId}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function SleepForm({
  editing,
  onDone,
  babyId,
}: {
  editing: LogApi | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const [hours, setHours] = useState<number>(() => initHours(editing));
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function adjust(delta: number) {
    setHours((h) => Math.min(MAX_HOURS, Math.max(MIN_HOURS, roundHalf(h + delta))));
  }

  async function submit() {
    if (babyId == null) return;
    setSaving(true);
    const startTime = localInputToSec(at);
    // 由手动输入的小时数推导 endTime，复用 start/end 机制，现有统计/展示零改动
    const endTime = startTime + Math.round(hours * 3600);
    const payload: CreateLogInput = {
      babyId,
      activityType: "sleep",
      startTime,
      endTime,
      amount: null,
      details: null,
      notes: notes.trim() || null,
    };
    // 立即关闭抽屉：记录走乐观更新即时呈现，保存与刷新在后台进行，失败会 toast 并回滚
    onDone();
    if (editing) await updateLog(editing.id, babyId, payload);
    else await createLog(babyId, payload);
  }

  return (
    <>
      <DrawerHeader className="text-center">
        <DrawerTitle className="text-base font-semibold">
          {editing ? "编辑睡眠" : "💤 记录睡眠"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">手动记录睡眠时长</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-lg" onClick={() => adjust(-STEP)} aria-label="减少">
              <Minus />
            </Button>
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums tracking-tight">{hours.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">小时</div>
            </div>
            <Button variant="outline" size="icon-lg" onClick={() => adjust(STEP)} aria-label="增加">
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p}
                selected={hours === p}
                onClick={() => setHours(p)}
                selectedClass="border-transparent bg-indigo-500 text-white"
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sleep-time">时间</Label>
          <Input id="sleep-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sleep-notes">备注（可选）</Label>
          <Input id="sleep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：睡得很安稳" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button
          size="lg"
          className="h-12 bg-indigo-500 text-base text-white hover:bg-indigo-500/90"
          disabled={saving}
          onClick={submit}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
