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
import type { CreateLogInput, FoodDetails, LogApi } from "@/lib/types";

/** 辅食分类：点击作为名称快捷填充，可自由编辑为更具体的食物名 */
const CATEGORIES = [
  "谷物主食",
  "冲调辅食",
  "果蔬肉泥",
  "辅食零食",
  "调味与油",
] as const;

function initName(editing: LogApi | null): string {
  const d = editing?.details;
  return d && "name" in d ? d.name : "";
}

export function FoodDrawer({
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
        <FoodForm
          key={`food-${editing?.id ?? "new"}`}
          babyId={babyId}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function FoodForm({
  editing,
  onDone,
  babyId,
}: {
  editing: LogApi | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const [name, setName] = useState<string>(() => initName(editing));
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (babyId == null) return;
    const trimmed = name.trim();
    if (!trimmed) return; // 名称必填
    setSaving(true);
    const details: FoodDetails = { name: trimmed };
    const payload: CreateLogInput = {
      babyId,
      activityType: "food",
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
          {editing ? "编辑辅食" : "🥣 记录辅食"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">记录辅食</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="space-y-2">
          <Label>分类（点选填充名称）</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                selected={name === c}
                onClick={() => setName(c)}
                selectedClass="border-transparent bg-orange-500 text-white"
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="food-name">名称</Label>
          <Input
            id="food-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：米粉、苹果泥"
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="food-time">时间</Label>
          <Input id="food-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="food-notes">备注（可选）</Label>
          <Input id="food-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：吃得很好" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button
          size="lg"
          className="h-12 bg-orange-500 text-base text-white hover:bg-orange-500/90"
          disabled={saving || !name.trim()}
          onClick={submit}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
