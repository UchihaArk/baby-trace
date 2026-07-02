"use client";

import { useState } from "react";
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
import type { CreateLogInput, DiaperDetails, LogApi } from "@/lib/types";

type DiaperType = "wet" | "dirty" | "both";

const OPTIONS: { value: DiaperType; label: string; emoji: string }[] = [
  { value: "both", label: "都有", emoji: "💦" },
  { value: "dirty", label: "粑粑", emoji: "💩" },
  { value: "wet", label: "嘘嘘", emoji: "💧" },
];

function initType(editing: LogApi | null): DiaperType {
  const d = editing?.details as DiaperDetails | null;
  return d?.type ?? "both";
}

export function DiaperDrawer({
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
        <DiaperForm key={`diaper-${editing?.id ?? "new"}`} babyId={babyId} editing={editing} onDone={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function DiaperForm({
  editing,
  onDone,
  babyId,
}: {
  editing: LogApi | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const [type, setType] = useState<DiaperType>(() => initType(editing));
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (babyId == null) return;
    setSaving(true);
    const details: DiaperDetails = { type };
    const payload: CreateLogInput = {
      babyId,
      activityType: "diaper",
      startTime: localInputToSec(at),
      endTime: null,
      amount: null,
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
          {editing ? "编辑换尿布" : "🧻 记录换尿布"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">都有 / 粑粑 / 嘘嘘</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="flex gap-2">
          {OPTIONS.map((o) => (
            <Chip
              key={o.value}
              selected={type === o.value}
              onClick={() => setType(o.value)}
              selectedClass="border-transparent bg-amber-500 text-white"
            >
              <span className="mr-1">{o.emoji}</span>
              {o.label}
            </Chip>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diaper-time">时间</Label>
          <Input id="diaper-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diaper-notes">备注（可选）</Label>
          <Input id="diaper-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：换得很及时" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button size="lg" className="h-12 bg-amber-500 text-base text-white hover:bg-amber-500/90" disabled={saving} onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
