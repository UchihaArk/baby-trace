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
import { createMeasurement, updateMeasurement } from "@/lib/mutations";
import { localInputToSec, nowSec, secToLocalInput } from "@/lib/time";
import { cmToMm, formatCm, formatKg, kgToGrams } from "@/lib/measure";
import type {
  BabyMeasurement,
  CreateMeasurementInput,
  MeasurementKind,
} from "@/lib/types";

/** 各 kind 的录入配置：单位、步进、预设、显示换算 */
type KindConfig = {
  label: string; // 抽屉标题里的名称
  emoji: string;
  unit: string; // kg / cm
  step: number; // ±按钮步进（以存储单位计：克 / 毫米）
  presets: number[]; // 预设快捷值（存储单位）
  /** 存储单位 → 输入框展示字符串（小数） */
  toInput: (v: number) => string;
  /** 输入框字符串 → 存储单位（非法返回 null） */
  fromInput: (s: string) => number | null;
  /** 主题色（Tailwind 字面量） */
  accent: string;
};

const KIND_CONFIG: Record<MeasurementKind, KindConfig> = {
  weight: {
    label: "体重",
    emoji: "⚖️",
    unit: "kg",
    // 100g = 0.1kg，需与 formatKg 的展示精度（toFixed(1)）对齐。
    // 否则 50g 步进会被四舍五入吞掉，表现为加减按钮失灵。
    step: 100,
    presets: [3000, 5000, 7000, 9000], // 3.0 / 5.0 / 7.0 / 9.0 kg
    toInput: formatKg,
    fromInput: kgToGrams,
    accent: "pink",
  },
  height: {
    label: "身高",
    emoji: "📏",
    unit: "cm",
    step: 5, // 5mm = 0.5cm
    presets: [500, 550, 600, 700], // 50.0 / 55.0 / 60.0 / 70.0 cm
    toInput: formatCm,
    fromInput: cmToMm,
    accent: "cyan",
  },
};

const ACCENT_SOLID: Record<string, string> = {
  pink: "bg-pink-500 hover:bg-pink-500/90",
  cyan: "bg-cyan-500 hover:bg-cyan-500/90",
};
const ACCENT_CHIP: Record<string, string> = {
  pink: "border-transparent bg-pink-500 text-white",
  cyan: "border-transparent bg-cyan-500 text-white",
};

export function MeasurementDrawer({
  open,
  kind,
  editing,
  onOpenChange,
  babyId,
}: {
  open: boolean;
  kind: MeasurementKind;
  editing: BabyMeasurement | null;
  onOpenChange: (o: boolean) => void;
  babyId: number | null;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <MeasurementForm
          key={`measure-${kind}-${editing?.id ?? "new"}`}
          babyId={babyId}
          kind={kind}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function MeasurementForm({
  kind,
  editing,
  onDone,
  babyId,
}: {
  kind: MeasurementKind;
  editing: BabyMeasurement | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const cfg = KIND_CONFIG[kind];
  const [inputValue, setInputValue] = useState<string>(() =>
    editing ? cfg.toInput(editing.valueGrams) : kind === "weight" ? "3.5" : "50.0"
  );
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.measuredAt ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // 当前输入对应的存储值（非法时回退到 0，提交时再拦截）
  const currentValue = cfg.fromInput(inputValue) ?? 0;

  function adjust(delta: number) {
    const next = Math.max(0, currentValue + delta);
    setInputValue(cfg.toInput(next));
  }

  async function submit() {
    if (babyId == null) return;
    const valueGrams = cfg.fromInput(inputValue);
    if (valueGrams == null || valueGrams <= 0) {
      return;
    }
    setSaving(true);
    const payload: CreateMeasurementInput = {
      babyId,
      kind,
      measuredAt: localInputToSec(at),
      valueGrams,
      notes: notes.trim() || null,
    };
    // 立即关闭抽屉：记录走乐观更新即时呈现，保存与刷新在后台进行，失败会 toast 并回滚
    onDone();
    if (editing) {
      await updateMeasurement(editing.id, babyId, kind, {
        measuredAt: payload.measuredAt,
        valueGrams: payload.valueGrams,
        notes: payload.notes,
      });
    } else {
      await createMeasurement(babyId, payload);
    }
  }

  return (
    <>
      <DrawerHeader className="text-center">
        <DrawerTitle className="text-base font-semibold">
          {editing ? `编辑${cfg.label}` : `${cfg.emoji} 记录${cfg.label}`}
        </DrawerTitle>
        <DrawerDescription className="sr-only">{cfg.label}测量值</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-lg" onClick={() => adjust(-cfg.step)} aria-label="减少">
              <Minus />
            </Button>
            <div className="text-center">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border-0 bg-transparent p-0 text-center text-4xl font-bold tabular-nums shadow-none focus-visible:ring-0"
                aria-label={cfg.label}
              />
              <div className="text-xs text-muted-foreground">{cfg.unit}</div>
            </div>
            <Button variant="outline" size="icon-lg" onClick={() => adjust(cfg.step)} aria-label="增加">
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {cfg.presets.map((p) => (
              <Chip
                key={p}
                selected={currentValue === p}
                onClick={() => setInputValue(cfg.toInput(p))}
                selectedClass={ACCENT_CHIP[cfg.accent]}
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {cfg.toInput(p)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`measure-time-${kind}`}>测量时间</Label>
          <Input
            id={`measure-time-${kind}`}
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`measure-notes-${kind}`}>备注（可选）</Label>
          <Input
            id={`measure-notes-${kind}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`例如：${kind === "weight" ? "体检称重" : "体检量身高"}`}
            className="text-base"
          />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button
          size="lg"
          className={`h-12 text-base text-white ${ACCENT_SOLID[cfg.accent]}`}
          disabled={saving}
          onClick={submit}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
