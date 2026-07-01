"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BabyFormSheet } from "@/components/baby/baby-form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBaby } from "@/components/baby/baby-provider";
import { deleteBaby } from "@/lib/mutations";
import { getBirthExtras } from "@/lib/chinese-calendar";
import { GENDER_OPTIONS } from "@/lib/baby";

export default function ManagePage() {
  const { baby, isLoading, mutateBaby } = useBaby();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const genderLabel = baby.gender
    ? GENDER_OPTIONS.find((g) => g.value === baby.gender)?.label ?? "未填写"
    : "未填写";
  const extras = getBirthExtras(baby.birthDate);

  async function onDelete() {
    const ok = await deleteBaby(baby!.id, baby!.name);
    if (ok) router.push("/");
  }

  return (
    <main className="space-y-4 px-4 pb-8 pt-3">
      {/* 宝宝资料 + 删除宝宝（同一张卡片） */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
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

        <div className="my-4 border-t border-border" />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 transition hover:text-destructive hover:underline"
              />
            }
          >
            删除宝宝
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除「{baby.name}宝宝」？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将永久删除「{baby.name}宝宝」及其所有记录，且不可恢复。请输入宝宝的乳名 <b>{baby.name}</b> 以确认。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={`输入 ${baby.name} 确认`}
              className="text-base"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmName("")}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/80"
                disabled={confirmName !== baby.name}
                onClick={onDelete}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* 切换宝宝：单独区域，放在最后 */}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
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
    </main>
  );
}
