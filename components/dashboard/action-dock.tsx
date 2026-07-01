"use client";

import { useState } from "react";
import { useLogEntry } from "@/components/log-entry/log-entry-provider";
import { useElapsed, useTodayStats } from "@/lib/hooks";
import { toggleSleep } from "@/lib/mutations";
import { formatClock } from "@/lib/time";

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
        "flex flex-col items-center justify-center gap-0.5 rounded-3xl py-5 text-white shadow-sm transition active:scale-[.98] disabled:opacity-60 " +
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
        "flex flex-col items-center justify-center gap-0.5 rounded-2xl py-3 text-white shadow-sm transition active:scale-[.98] " +
        className
      }
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
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
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <BigButton onClick={() => openFeed()} emoji="🍼" label="喂奶" className="bg-rose-500 hover:bg-rose-500/90" />
        <BigButton onClick={() => openDiaper()} emoji="🧻" label="换尿布" className="bg-amber-500 hover:bg-amber-500/90" />
        <BigButton onClick={() => openPump()} emoji="🥛" label="吸奶" className="bg-teal-500 hover:bg-teal-500/90" />
      </div>
      <BigButton
        onClick={onSleep}
        disabled={toggling}
        emoji="💤"
        label={sleeping ? "停止睡眠" : "开始睡眠"}
        sub={sleeping && elapsed != null ? `已睡 ${formatClock(elapsed)}` : "点击计时"}
        className="bg-indigo-500 hover:bg-indigo-500/90 w-full"
      />
      <div className="grid grid-cols-3 gap-3">
        <CareButton onClick={() => openBath()} emoji="🛁" label="洗澡" className="bg-sky-500 hover:bg-sky-500/90" />
        <CareButton onClick={() => openHaircut()} emoji="💈" label="理发" className="bg-violet-500 hover:bg-violet-500/90" />
        <CareButton onClick={() => openNail()} emoji="✂️" label="剪指甲" className="bg-emerald-500 hover:bg-emerald-500/90" />
      </div>
    </div>
  );
}
