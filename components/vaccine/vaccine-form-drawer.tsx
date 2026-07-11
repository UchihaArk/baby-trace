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
import { Chip } from "@/components/log-entry/chip";
import { createVaccine, updateVaccine } from "@/lib/mutations";
import { localInputToSec, nowSec, secToLocalInput } from "@/lib/time";
import type { BabyVaccine, CreateVaccineInput } from "@/lib/types";

/** 常见疫苗预设（datalist 辅助输入，不强制选择） */
const COMMON_VACCINES = [
  "乙肝疫苗",
  "卡介苗",
  "脊灰疫苗",
  "百白破疫苗",
  "白破疫苗",
  "麻腮风疫苗",
  "麻风疫苗",
  "乙脑疫苗",
  "A群流脑疫苗",
  "A+C群流脑疫苗",
  "甲肝疫苗",
  "乙肝加强",
  "轮状病毒疫苗",
  "Hib疫苗",
  "水痘疫苗",
  "流感疫苗",
  "肺炎疫苗",
  "手足口(EV71)疫苗",
];

const DOSE_OPTIONS = ["第1针", "第2针", "第3针", "第4针", "加强针"];

export function VaccineFormDrawer({
  open,
  editing,
  onOpenChange,
  babyId,
}: {
  open: boolean;
  editing: BabyVaccine | null;
  onOpenChange: (o: boolean) => void;
  babyId: number | null;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <VaccineForm
          key={`vaccine-${editing?.id ?? "new"}`}
          babyId={babyId}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function VaccineForm({
  editing,
  onDone,
  babyId,
}: {
  editing: BabyVaccine | null;
  onDone: () => void;
  babyId: number | null;
}) {
  const [name, setName] = useState<string>(() => editing?.name ?? "");
  const [dose, setDose] = useState<string>(() => editing?.dose ?? "");
  const [at, setAt] = useState<string>(() => secToLocalInput(editing?.vaccinatedAt ?? nowSec()));
  const [notes, setNotes] = useState<string>(() => editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (babyId == null) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    const payload: CreateVaccineInput = {
      babyId,
      name: trimmedName,
      dose: dose.trim() || null,
      vaccinatedAt: localInputToSec(at),
      notes: notes.trim() || null,
    };
    // 立即关闭抽屉：记录走乐观更新即时呈现，保存与刷新在后台进行，失败会 toast 并回滚
    onDone();
    if (editing) {
      await updateVaccine(editing.id, babyId, {
        name: payload.name,
        dose: payload.dose,
        vaccinatedAt: payload.vaccinatedAt,
        notes: payload.notes,
      });
    } else {
      await createVaccine(babyId, payload);
    }
  }

  const canSave = name.trim().length > 0;

  return (
    <>
      <DrawerHeader className="text-center">
        <DrawerTitle className="text-base font-semibold">
          {editing ? "编辑疫苗" : "💉 记录疫苗"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">记录已接种的疫苗</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2">
        <div className="space-y-1.5">
          <Label htmlFor="vaccine-name">疫苗名称</Label>
          <Input
            id="vaccine-name"
            list="common-vaccines"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：乙肝疫苗"
            className="text-base"
            maxLength={40}
            autoFocus
          />
          <datalist id="common-vaccines">
            {COMMON_VACCINES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label>剂次（可选）</Label>
          <div className="flex flex-wrap gap-2">
            {DOSE_OPTIONS.map((d) => (
              <Chip
                key={d}
                selected={dose === d}
                onClick={() => setDose(dose === d ? "" : d)}
                selectedClass="border-transparent bg-blue-500 text-white"
                className="min-h-9 flex-none px-3 py-1.5 text-xs"
              >
                {d}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vaccine-time">接种时间</Label>
          <Input
            id="vaccine-time"
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vaccine-notes">备注（可选）</Label>
          <Input
            id="vaccine-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例如：社区医院、接种反应"
            className="text-base"
          />
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button
          size="lg"
          className="h-12 bg-blue-500 text-base text-white hover:bg-blue-500/90"
          disabled={saving || !canSave}
          onClick={submit}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
