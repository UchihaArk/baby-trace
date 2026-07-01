"use client";

import { memo } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BabyAvatar } from "./baby-avatar";
import { useBaby } from "./baby-provider";

/** memo：切换底部 Tab（父级重渲染）时，baby 不变则不重渲染 */
export const BabyHeader = memo(function BabyHeader() {
  const { baby } = useBaby();

  return (
    <header className="sticky top-0 z-30 bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {baby ? (
            <BabyAvatar emoji={baby.avatarEmoji} color={baby.avatarColor} className="size-9 text-lg" />
          ) : (
            <div className="size-9 rounded-full bg-muted" />
          )}
          <h1 className="truncate text-base font-bold">
            {baby ? `${baby.name}宝宝` : "加载中…"}
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
});
