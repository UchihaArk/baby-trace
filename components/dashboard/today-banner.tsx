"use client";

import { useBaby } from "@/components/baby/baby-provider";
import { formatBabyAge } from "@/lib/time";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 仪表盘顶部：今日日期 + 周几，与出生周数/年龄放在一起。 */
export function TodayBanner() {
  const { baby } = useBaby();
  if (!baby) return null;

  const now = new Date();
  const today = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  const age = formatBabyAge(new Date(baby.birthDate));

  return (
    <div className="rounded-2xl bg-muted/50 px-4 py-3">
      <div className="text-sm">
        <span className="mr-1.5">📅</span>
        <span className="font-medium">今天 · {today}</span>
      </div>
      <div className="mt-1.5 text-sm">
        <span className="mr-1.5">🎂</span>
        <span className="font-bold">{age.primary}</span>
        {age.secondary && <span className="ml-1.5 text-muted-foreground">· {age.secondary}</span>}
      </div>
    </div>
  );
}
