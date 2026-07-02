"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { useBabies } from "@/lib/hooks";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import { BabyFormSheet } from "@/components/baby/baby-form-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatBabyAge } from "@/lib/time";
import { Button } from "@/components/ui/button";

export default function BabyListPage() {
  const { data: babies, isLoading } = useBabies();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <header className="sticky top-0 z-30 bg-background px-4 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between">
          <h1 className="text-lg font-bold">宝贝清单</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="space-y-3 px-4 pb-28 pt-3">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">加载中…</p>
        ) : babies && babies.length > 0 ? (
          babies.map((b) => {
            const age = formatBabyAge(new Date(b.birthDate));
            return (
              <Link
                key={b.id}
                href={`/${encodeURIComponent(b.name)}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5 transition active:scale-[.99]"
              >
                <BabyAvatar emoji={b.avatarEmoji} color={b.avatarColor} className="size-12 text-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold">{b.name}宝宝</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {age.primary}
                    {age.secondary ? ` · ${age.secondary}` : ""}
                  </div>
                </div>
                {b.hasAccessCode && <Lock className="size-4 shrink-0 text-muted-foreground" />}
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
            还没有添加宝宝
            <br />
            点击下方按钮添加 👶
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button size="lg" className="h-12 w-full text-base" onClick={() => setAdding(true)}>
          <Plus /> 添加宝宝
        </Button>
      </div>

      <BabyFormSheet
        open={adding}
        onOpenChange={setAdding}
        onSaved={(b) => {
          setAdding(false);
          router.push(`/${encodeURIComponent(b.name)}`);
        }}
      />
    </div>
  );
}
