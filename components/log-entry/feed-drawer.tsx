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
import type { CreateLogInput, FeedDetails, LogApi } from "@/lib/types";

type Method = "bottle" | "breast";
type Milk = "breastmilk" | "formula";
type Side = "left" | "right" | "both";

const BOTTLE_PRESETS = [60, 90, 120, 150, 180];
const BREAST_PRESETS = [5, 10, 15, 20, 30];

function initMethod(editing: LogApi | null): Method {
  const d = editing?.details;
  return d && "method" in d && d.method === "breast" ? "breast" : "bottle";
}
function initMilk(editing: LogApi | null): Milk {
  const d = editing?.details;
  return d && "method" in d && d.method === "bottle" && d.milk === "formula" ? "formula" : "breastmilk";
}
function initAmount(editing: LogApi | null, method: Method): number {
  if (editing?.amount != null) return editing.amount;
  return method === "bottle" ? 120 : 15;
}
function initSide(editing: LogApi | null): Side {
  const d = editing?.details;
  return d && "method" in d && d.method === "breast" && d.side ? d.side : "left";
}

export function FeedDrawer({
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
        <FeedForm key={`feed-${editing?.id ?? "new"}`} babyId={babyId} editing={editing} onDone={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function FeedForm({
  editing,
  onDone,
  babyId,
}: {
  editing: LogApi | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const initialMethod = initMethod(editing);
  const [method, setMethod] = useState<Method>(initialMethod);
  const [milk, setMilk] = useState<Milk>(() => initMilk(editing));
  const [amount, setAmount] = useState<number>(() => initAmount(editing, initialMethod));
  const [side, setSide] = useState<Side>(() => initSide(editing));
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.startTime ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const unit = method === "bottle" ? "ml" : "分钟";
  const step = method === "bottle" ? 10 : 1;
  const minVal = method === "bottle" ? 5 : 1;
  const presets = method === "bottle" ? BOTTLE_PRESETS : BREAST_PRESETS;

  function adjust(delta: number) {
    setAmount((a) => Math.max(minVal, a + delta));
  }

  async function submit() {
    if (babyId == null) return;
    setSaving(true);
    const details: FeedDetails =
      method === "bottle" ? { method: "bottle", milk } : { method: "breast", side };
    const payload: CreateLogInput = {
      babyId,
      activityType: "feed",
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
          {editing ? "编辑喂奶" : "🍼 记录喂奶"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">奶瓶或亲喂</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="flex gap-2">
          <Chip selected={method === "bottle"} onClick={() => setMethod("bottle")} selectedClass="border-transparent bg-rose-500 text-white">
            🍼 奶瓶
          </Chip>
          <Chip selected={method === "breast"} onClick={() => setMethod("breast")} selectedClass="border-transparent bg-rose-500 text-white">
            🤱 亲喂
          </Chip>
        </div>

        {method === "bottle" && (
          <div className="flex gap-2">
            <Chip selected={milk === "breastmilk"} onClick={() => setMilk("breastmilk")} selectedClass="border-transparent bg-rose-500 text-white">
              母乳
            </Chip>
            <Chip selected={milk === "formula"} onClick={() => setMilk("formula")} selectedClass="border-transparent bg-rose-500 text-white">
              奶粉
            </Chip>
          </div>
        )}

        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-lg" onClick={() => adjust(-step)} aria-label="减少">
              <Minus />
            </Button>
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums">{amount}</div>
              <div className="text-xs text-muted-foreground">{unit}</div>
            </div>
            <Button variant="outline" size="icon-lg" onClick={() => adjust(step)} aria-label="增加">
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {presets.map((p) => (
              <Chip
                key={p}
                selected={amount === p}
                onClick={() => setAmount(p)}
                selectedClass="border-transparent bg-rose-500 text-white"
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {method === "breast" && (
          <div className="flex gap-2">
            {(["left", "right", "both"] as const).map((s) => (
              <Chip
                key={s}
                selected={side === s}
                onClick={() => setSide(s)}
                selectedClass="border-transparent bg-rose-500 text-white"
              >
                {s === "left" ? "左侧" : s === "right" ? "右侧" : "双侧"}
              </Chip>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="feed-time">时间</Label>
          <Input id="feed-time" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="text-base" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="feed-notes">备注（可选）</Label>
          <Input id="feed-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="例如：吃完就睡了" className="text-base" />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button size="lg" className="h-12 bg-rose-500 text-base text-white hover:bg-rose-500/90" disabled={saving} onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
