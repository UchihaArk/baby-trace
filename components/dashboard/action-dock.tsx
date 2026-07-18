"use client";

import { useState } from "react";
import { useLogEntry } from "@/components/log-entry/log-entry-provider";
import { useElapsed, useTodayStats } from "@/lib/hooks";
import { toggleSleep } from "@/lib/mutations";
import { formatClock, formatRelative } from "@/lib/time";
import type { LogApi } from "@/lib/types";

function BigButton({
  onClick,
  emoji,
  label,
  sub,
  className,
  disabled,
}: {
  onClick: () => void;
  emoji: string;
  label: string;
  sub?: string;
  className: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "flex flex-col items-center justify-center gap-0.5 rounded-3xl py-5 text-white shadow-lg transition duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:brightness-105 active:scale-[.97] disabled:opacity-60 " +
        className
      }
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="text-base font-semibold">{label}</span>
      {sub && <span className="text-xs font-medium text-white/85">{sub}</span>}
    </button>
  );
}

function CareButton({
  onClick,
  emoji,
  label,
  className,
}: {
  onClick: () => void;
  emoji: string;
  label: string;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-center justify-center gap-0.5 rounded-2xl py-3 text-white shadow-lg transition duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:brightness-105 active:scale-[.97] " +
        className
      }
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function LastCareCard({
  emoji,
  label,
  last,
}: {
  emoji: string;
  label: string;
  last?: LogApi | null;
}) {
  return (
    <div className="ui-card p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{emoji}</span>
        <span>上次{label}</span>
      </div>
      <div className="mt-1 truncate text-sm font-semibold">
        {last ? formatRelative(last.startTime) : "暂无"}
      </div>
    </div>
  );
}

export function ActionDock({ babyId }: { babyId: number }) {
  const { openFeed, openDiaper, openPump, openBath, openHaircut, openNail } = useLogEntry();
  const { data } = useTodayStats(babyId);
  const elapsed = useElapsed(data?.openSleep?.startTime ?? null);
  const [toggling, setToggling] = useState(false);

  const sleeping = !!data?.openSleep;

  async function onSleep() {
    setToggling(true);
    await toggleSleep(babyId);
    setToggling(false);
  }

  return (
    <div className="space-y-6">
      {/* 喂养区 */}
      <section className="space-y-3">
        <h3 className="px-1 text-xs font-semibold text-muted-foreground">喂养</h3>
        <div className="grid grid-cols-3 gap-3">
          <BigButton onClick={() => openFeed()} emoji="🍼" label="喂奶" className="bg-gradient-to-b from-rose-500 to-rose-600 shadow-rose-500/25" />
          <BigButton onClick={() => openDiaper()} emoji="🧻" label="换尿布" className="bg-gradient-to-b from-amber-500 to-amber-600 shadow-amber-500/25" />
          <BigButton onClick={() => openPump()} emoji="🥛" label="吸奶" className="bg-gradient-to-b from-teal-500 to-teal-600 shadow-teal-500/25" />
        </div>
        <BigButton
          onClick={onSleep}
          disabled={toggling}
          emoji="💤"
          label={sleeping ? "停止睡眠" : "开始睡眠"}
          sub={sleeping && elapsed != null ? `已睡 ${formatClock(elapsed)}` : "点击计时"}
          className="bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-indigo-500/25 w-full"
        />
      </section>

      {/* 护理区 */}
      <section className="space-y-3">
        <h3 className="px-1 text-xs font-semibold text-muted-foreground">护理</h3>
        <div className="grid grid-cols-3 gap-3">
          <LastCareCard emoji="🛁" label="洗澡" last={data?.lastBath} />
          <LastCareCard emoji="💈" label="理发" last={data?.lastHaircut} />
          <LastCareCard emoji="✂️" label="剪指甲" last={data?.lastNail} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <CareButton onClick={() => openBath()} emoji="🛁" label="洗澡" className="bg-gradient-to-b from-sky-500 to-sky-600 shadow-sky-500/25" />
          <CareButton onClick={() => openHaircut()} emoji="💈" label="理发" className="bg-gradient-to-b from-violet-500 to-violet-600 shadow-violet-500/25" />
          <CareButton onClick={() => openNail()} emoji="✂️" label="剪指甲" className="bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-emerald-500/25" />
        </div>
      </section>
    </div>
  );
}
