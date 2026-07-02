"use client";

import { BabyProvider, useBaby } from "./baby-provider";
import { BabyHeader } from "./baby-header";
import { AccessCodeLock } from "./access-code-lock";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogEntryProvider } from "@/components/log-entry/log-entry-provider";
import { useAccessUnlocked } from "@/lib/access-lock";
import type { Baby } from "@/lib/types";

/** 宝宝作用域的外壳：按 name 加载宝宝，提供头部/底栏/录入抽屉，并按需门禁访问暗号。 */
export function BabyShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <BabyProvider name={name}>
      <LogEntryProvider>
        <BabyShellBody>{children}</BabyShellBody>
      </LogEntryProvider>
    </BabyProvider>
  );
}

function BabyShellBody({ children }: { children: React.ReactNode }) {
  const { baby, isLoading } = useBaby();
  if (isLoading) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }
  if (!baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">未找到该宝宝</div>;
  }
  return <LockGate baby={baby}>{children}</LockGate>;
}

/** 访问暗号门禁：设置了暗号且当前 version 未解锁 → 渲染锁屏，否则渲染正常布局。 */
function LockGate({ baby, children }: { baby: Baby; children: React.ReactNode }) {
  const unlocked = useAccessUnlocked(baby.id, baby.accessCodeVersion);
  if (baby.hasAccessCode && !unlocked) {
    return <AccessCodeLock baby={baby} />;
  }
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <BabyHeader />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
