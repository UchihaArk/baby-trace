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
import { activityMeta } from "@/lib/activity";
import { createLog, updateLog } from "@/lib/mutations";
import { localInputToSec, nowSec, secToLocalInput } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { CreateLogInput, LogApi, NailDetails } from "@/lib/types";

export type CareType = "bath" | "haircut" | "nail";
type NailType = "fingers" | "toes" | "both";

const NAIL_OPTIONS: { value: NailType; label: string }[] = [
  { value: "fingers", label: "手指" },
  { value: "toes", label: "脚趾" },
  { value: "both", label: "都有" },
];

function initNailType(editing: LogApi | null): NailType {
  const d = editing?.details as NailDetails | null;
  return d?.type ?? "fingers";
}

export function CareDrawer({
  open,
  careType,
  editing,
  babyId,
  onOpenChange,
}: {
  open: boolean;
  careType: CareType;
  editing: LogApi | null;
  babyId: number | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <CareForm
          key={`${careType}-${editing?.id ?? "new"}`}
          careType={careType}
          babyId={babyId}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function CareForm({
  careType,
  babyId,
  editing,
  onDone,
}: {
  careType: CareType;
  babyId: number | null;
  editing: LogApi | null;
  onDone: () => void;
}) {
  const meta = activityMeta[careType];
  const [nailType, setNailType] = useState<NailType>(() => initNailType(editing));
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (babyId == null) return;
    setSaving(true);
    const details = careType === "nail" ? ({ type: nailType } as NailDetails) : null;
    const payload: CreateLogInput = {
      babyId,
      activityType: careType,
      startTime: localInputToSec(at),
      endTime: null,
      amount: null,
      details,
      notes: notes.trim() || null,
    };
    const ok = editing
      ? await updateLog(editing.id, babyId, payload)
      : !!(await createLog(babyId, payload));
    setSaving(false);
    if (ok) onDone();
  }

  return (
    <>
      <DrawerHeader className="text-center">
        <DrawerTitle className="text-base font-semibold">
          {editing ? `编辑${meta.label}` : `${meta.emoji} 记录${meta.label}`}
        </DrawerTitle>
        <DrawerDescription className="sr-only">{meta.label}</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        {careType === "nail" && (
          <div className="flex gap-2">
            {NAIL_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                selected={nailType === o.value}
                onClick={() => setNailType(o.value)}
                selectedClass="border-transparent bg-emerald-500 text-white"
              >
                {o.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="care-time">时间</Label>
          <Input id="care-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="care-notes">备注（可选）</Label>
          <Input id="care-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button
          size="lg"
          className={cn("h-12 text-base text-white hover:opacity-90", meta.bgSolid)}
          disabled={saving}
          onClick={submit}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
