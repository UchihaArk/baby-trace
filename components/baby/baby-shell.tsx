"use client";

import { BabyProvider } from "./baby-provider";
import { BabyHeader } from "./baby-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogEntryProvider } from "@/components/log-entry/log-entry-provider";

/** 宝宝作用域的外壳：按 name 加载宝宝，提供头部/底栏/录入抽屉。 */
export function BabyShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <BabyProvider name={name}>
      <LogEntryProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <BabyHeader />
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
      </LogEntryProvider>
    </BabyProvider>
  );
}
