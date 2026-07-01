"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BabyAvatar } from "./baby-avatar";
import { useBaby } from "./baby-provider";
import { formatBabyAge } from "@/lib/time";

export function BabyHeader() {
  const { baby } = useBaby();
  const age = baby ? formatBabyAge(new Date(baby.birthDate)) : null;

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {baby ? (
            <BabyAvatar emoji={baby.avatarEmoji} color={baby.avatarColor} className="size-9 text-lg" />
          ) : (
            <div className="size-9 rounded-full bg-muted" />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">
              {baby ? `${baby.name}宝宝` : "加载中…"}
            </h1>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {age ? `${age.primary}${age.secondary ? ` · ${age.secondary}` : ""}` : " "}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
