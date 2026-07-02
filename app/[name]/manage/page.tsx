"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BabyFormSheet } from "@/components/baby/baby-form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBaby } from "@/components/baby/baby-provider";
import { getBirthExtras } from "@/lib/chinese-calendar";
import { GENDER_OPTIONS } from "@/lib/baby";
import { clearBabyAccessCode, setBabyAccessCode } from "@/lib/mutations";

export default function ManagePage() {
  const { baby, isLoading, mutateBaby } = useBaby();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [codeDialog, setCodeDialog] = useState(false);
  const [clearDialog, setClearDialog] = useState(false);

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const genderLabel = baby.gender
    ? GENDER_OPTIONS.find((g) => g.value === baby.gender)?.label ?? "未填写"
    : "未填写";
  const extras = getBirthExtras(baby.birthDate);

  return (
    <main className="space-y-4 px-4 pb-8 pt-3">
      {/* 宝宝资料 */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">宝宝资料</h2>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            编辑
          </Button>
        </div>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">乳名</dt>
            <dd className="font-medium">{baby.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">出生日期</dt>
            <dd className="whitespace-nowrap text-right font-medium">
              {baby.birthDate}
              {extras && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">（农历{extras.lunar}）</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">性别</dt>
            <dd className="font-medium">{genderLabel}</dd>
          </div>
          {extras && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">星座</dt>
                <dd className="font-medium">{extras.zodiac}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">属相</dt>
                <dd className="font-medium">{extras.shengxiao}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      {/* 访问暗号 */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold text-muted-foreground">访问暗号</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          设置后，进入{baby.name}宝宝的记录前需先输入暗号。
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium">{baby.hasAccessCode ? "已设置" : "未设置"}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCodeDialog(true)}>
              {baby.hasAccessCode ? "修改" : "设置"}
            </Button>
            {baby.hasAccessCode && (
              <Button variant="ghost" size="sm" onClick={() => setClearDialog(true)}>
                关闭
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 切换宝宝 */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold text-muted-foreground">切换宝宝</h2>
        <p className="mt-1 text-xs text-muted-foreground">退出当前宝宝，回到宝宝选择列表。</p>
        <Link
          href="/"
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium transition hover:bg-muted active:scale-[.98]"
        >
          <LogOut className="size-4" />
          退出当前宝宝
        </Link>
      </section>

      <BabyFormSheet
        open={editing}
        onOpenChange={setEditing}
        editing={baby}
        onSaved={async (updated) => {
          setEditing(false);
          await mutateBaby(updated, { revalidate: false });
          if (updated.name !== baby.name) {
            router.push(`/${encodeURIComponent(updated.name)}/manage`);
          }
        }}
      />

      {/* 设置/修改访问暗号 */}
      <Dialog open={codeDialog} onOpenChange={setCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{baby.hasAccessCode ? "修改访问暗号" : "设置访问暗号"}</DialogTitle>
            <DialogDescription>用于进入{baby.name}宝宝的记录，1–32 位字符。</DialogDescription>
          </DialogHeader>
          <AccessCodeForm
            key={String(baby.accessCodeVersion)}
            onSubmit={async (code) => {
              const updated = await setBabyAccessCode(baby.id, code);
              if (updated) {
                // 设置/修改暗号 ≠ 已输入暗号：不写永久解锁，回到首页后需用新暗号重新进入
                await mutateBaby(updated, { revalidate: false });
                setCodeDialog(false);
                router.push("/");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 关闭访问暗号 */}
      <AlertDialog open={clearDialog} onOpenChange={setClearDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>关闭访问暗号？</AlertDialogTitle>
            <AlertDialogDescription>
              关闭后任何人打开应用都能直接进入{baby.name}宝宝的记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                const ok = await clearBabyAccessCode(baby.id);
                if (ok) {
                  await mutateBaby();
                  setClearDialog(false);
                }
              }}
            >
              关闭暗号
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function AccessCodeForm({ onSubmit }: { onSubmit: (code: string) => Promise<void> }) {
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const trimmed = code.trim();
    if (!trimmed) {
      setError("请输入暗号");
      return;
    }
    if (trimmed !== confirm.trim()) {
      setError("两次输入不一致");
      return;
    }
    setError(null);
    setSaving(true);
    await onSubmit(trimmed);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="ac-code">访问暗号</Label>
        <Input
          id="ac-code"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={32}
          className="text-base"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ac-confirm">确认暗号</Label>
        <Input
          id="ac-confirm"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          maxLength={32}
          className="text-base"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" type="button" />}>取消</DialogClose>
        <Button type="submit" disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </DialogFooter>
    </form>
  );
}
