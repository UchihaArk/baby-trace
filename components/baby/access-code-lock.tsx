"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BabyAvatar } from "./baby-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyBabyAccessCode } from "@/lib/mutations";
import { markUnlocked } from "@/lib/access-lock";
import { cn } from "@/lib/utils";
import type { Baby } from "@/lib/types";

/**
 * 访问暗号锁屏：该宝宝设置了暗号且当前未解锁时，由 BabyShell 渲染此全屏页面，
 * 替代 header / 底栏 / 内容，直到输入正确暗号。
 */
export function AccessCodeLock({ baby }: { baby: Baby }) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || verifying) return;
    setVerifying(true);
    setError(null);
    const ok = await verifyBabyAccessCode(baby.id, code);
    setVerifying(false);
    if (ok) {
      // 记录解锁所对应的 version；BabyShell 的 LockGate 会据此重渲染为已解锁
      markUnlocked(baby.id, baby.accessCodeVersion);
    } else {
      setError("暗号错误");
      setCode("");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="px-2 pt-[env(safe-area-inset-top)]">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-1 px-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
          宝贝清单
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <BabyAvatar emoji={baby.avatarEmoji} color={baby.avatarColor} className="mb-4 size-20 text-4xl" />
        <h1 className="text-lg font-bold">{baby.name}宝宝</h1>
        <p className="mt-1 text-sm text-muted-foreground">请输入访问暗号</p>

        <form onSubmit={submit} className="mt-6 w-full max-w-xs space-y-3">
          <Input
            autoComplete="off"
            autoFocus
            placeholder="访问暗号"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={32}
            aria-invalid={!!error}
            className={cn("h-12 text-center text-lg", error && "border-destructive")}
          />
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={verifying || !code}>
            {verifying ? "验证中…" : "进入"}
          </Button>
        </form>
      </div>
    </div>
  );
}
