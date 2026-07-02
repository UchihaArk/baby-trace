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
import type { CreateLogInput, LogApi, PumpDetails } from "@/lib/types";

type Side = "left" | "right" | "both";

const PRESETS = [60, 90, 120, 150, 180];
const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: "both", label: "双侧" },
  { value: "left", label: "左侧" },
  { value: "right", label: "右侧" },
];

function initSide(editing: LogApi | null): Side {
  const d = editing?.details;
  return d && "side" in d && d.side ? d.side : "both";
}

export function PumpDrawer({
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
        <PumpForm key={`pump-${editing?.id ?? "new"}`} babyId={babyId} editing={editing} onDone={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function PumpForm({
  editing,
  onDone,
  babyId,
}: {
  editing: LogApi | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const [side, setSide] = useState<Side>(() => initSide(editing));
  const [amount, setAmount] = useState<number>(() => editing?.amount ?? 120);
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function adjust(delta: number) {
    setAmount((a) => Math.max(5, a + delta));
  }

  async function submit() {
    if (babyId == null) return;
    setSaving(true);
    const details: PumpDetails = { side };
    const payload: CreateLogInput = {
      babyId,
      activityType: "pump",
      startTime: localInputToSec(at),
      endTime: null,
      amount,
      details,
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
          {editing ? "编辑吸奶" : "🥛 记录吸奶"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">吸奶器吸母乳</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="flex gap-2">
          {SIDE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              selected={side === o.value}
              onClick={() => setSide(o.value)}
              selectedClass="border-transparent bg-teal-500 text-white"
            >
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-lg" onClick={() => adjust(-10)} aria-label="减少">
              <Minus />
            </Button>
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums">{amount}</div>
              <div className="text-xs text-muted-foreground">ml</div>
            </div>
            <Button variant="outline" size="icon-lg" onClick={() => adjust(10)} aria-label="增加">
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p}
                selected={amount === p}
                onClick={() => setAmount(p)}
                selectedClass="border-transparent bg-teal-500 text-white"
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pump-time">时间</Label>
          <Input id="pump-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pump-notes">备注（可选）</Label>
          <Input id="pump-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：存了一瓶" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button size="lg" className="h-12 bg-teal-500 text-base text-white hover:bg-teal-500/90" disabled={saving} onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
