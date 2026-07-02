"use client";

import { useBaby } from "@/components/baby/baby-provider";
import { formatBabyAge } from "@/lib/time";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一"];

/** 从出生到现在的完整月数（本月还没到出生日则少算一个月） */
function completedMonths(birth: Date, now: Date): number {
  const n = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return now.getDate() < birth.getDate() ? n - 1 : n;
}

/** 整月/整年里程碑盖章文案；未满月返回 null */
function milestoneLabel(n: number): string | null {
  if (n < 1) return null;
  const years = Math.floor(n / 12);
  const months = n % 12;
  if (years === 0) return months === 1 ? "满月" : `${CN[months - 1]}月`;
  const yearLabel = years === 1 ? "一岁" : years === 2 ? "两岁" : `${CN[years - 1]}岁`;
  if (months === 0) return years === 1 ? "周岁" : yearLabel;
  return `${yearLabel}${CN[months - 1]}月`;
}

/** 仪表盘顶部：今日日期 + 周几，出生周数/年龄，以及整月/整年里程碑盖章 */
export function TodayBanner() {
  const { baby } = useBaby();
  if (!baby) return null;

  const now = new Date();
  const today = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  const age = formatBabyAge(new Date(baby.birthDate));
  const stamp = milestoneLabel(completedMonths(new Date(baby.birthDate), now));

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
      <div className="min-w-0">
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
      {stamp && (
        <span className="inline-flex shrink-0 -rotate-6 items-center rounded-md border-2 border-red-600 bg-red-600/5 px-2.5 py-1 text-sm font-extrabold tracking-[0.15em] text-red-600 shadow-sm dark:border-red-400 dark:bg-red-400/10 dark:text-red-400">
          {stamp}
        </span>
      )}
    </div>
  );
}
