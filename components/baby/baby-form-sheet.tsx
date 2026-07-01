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
import { BabyAvatar } from "./baby-avatar";
import { BABY_COLOR_OPTIONS, BABY_EMOJI_OPTIONS, GENDER_OPTIONS } from "@/lib/baby";
import { createBaby, updateBaby } from "@/lib/mutations";
import { cn } from "@/lib/utils";
import type { Baby, CreateBabyInput } from "@/lib/types";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BabyFormSheet({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Baby | null;
  onSaved?: (baby: Baby) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <BabyForm key={editing?.id ?? "new"} editing={editing} onDone={() => onOpenChange(false)} onSaved={onSaved} />
      </DrawerContent>
    </Drawer>
  );
}

function BabyForm({
  editing,
  onDone,
  onSaved,
}: {
  editing?: Baby | null;
  onDone: () => void;
  onSaved?: (baby: Baby) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [birthDate, setBirthDate] = useState(editing?.birthDate ?? todayStr());
  const [gender, setGender] = useState<"male" | "female" | "other" | undefined>(
    editing?.gender ?? undefined
  );
  const [emoji, setEmoji] = useState(editing?.avatarEmoji ?? "👶");
  const [color, setColor] = useState<string>(editing?.avatarColor ?? "rose");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || !birthDate) return;
    setSaving(true);
    const input: CreateBabyInput = {
      name: name.trim(),
      birthDate,
      gender,
      avatarEmoji: emoji,
      avatarColor: color as CreateBabyInput["avatarColor"],
    };
    const result = editing
      ? await updateBaby(editing.id, editing.name, input)
      : await createBaby(input);
    setSaving(false);
    if (result) {
      onSaved?.(result);
      onDone();
    }
  }

  return (
    <>
      <DrawerHeader className="items-center text-center">
        <BabyAvatar emoji={emoji} color={color} className="mx-auto mb-1 size-16 text-3xl" />
        <DrawerTitle>{editing ? "编辑宝宝" : "添加宝宝"}</DrawerTitle>
        <DrawerDescription className="sr-only">乳名、出生日期、性别、头像</DrawerDescription>
      </DrawerHeader>

      <div className="space-y-5 overflow-y-auto px-4 pb-2">
        <div className="space-y-1.5">
          <Label htmlFor="baby-name">乳名</Label>
          <Input
            id="baby-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：小满"
            maxLength={20}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="baby-birth">出生日期</Label>
          <Input
            id="baby-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-1.5">
          <Label>性别</Label>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((g) => (
              <Chip
                key={g.value}
                selected={gender === g.value}
                onClick={() => setGender(gender === g.value ? undefined : g.value)}
                selectedClass="border-transparent bg-primary text-primary-foreground"
              >
                {g.emoji} {g.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>头像</Label>
          <div className="grid grid-cols-8 gap-2">
            {BABY_EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl text-xl transition",
                  emoji === em ? "bg-primary/15 ring-2 ring-primary" : "bg-muted"
                )}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>主题色</Label>
          <div className="flex flex-wrap gap-2.5">
            {BABY_COLOR_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                aria-label={c.label}
                className={cn(
                  "size-8 rounded-full transition",
                  c.dot,
                  color === c.key && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <DrawerFooter className="pt-2">
        <Button size="lg" className="h-12 text-base" disabled={saving || !name.trim()} onClick={submit}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </DrawerFooter>
    </>
  );
}
