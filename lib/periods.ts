export type Period = "day" | "week" | "month" | "quarter" | "year";

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "quarter", label: "季" },
  { value: "year", label: "年" },
];

const DAY = 86400;

function toSec(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

/** 按本地时区计算某周期的 [from, to) 区间（unix 秒）+ 天数 + 文案。offset=0 当前，-1 上一个。 */
export function periodRange(period: Period, offset: number): {
  from: number;
  to: number;
  days: number;
  label: string;
} {
  const now = new Date();

  if (period === "day") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const from = toSec(d);
    return { from, to: from + DAY, days: 1, label: dayLabel(offset, d) };
  }

  if (period === "week") {
    // 周一为一周开始
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + offset * 7);
    const from = toSec(monday);
    return { from, to: from + 7 * DAY, days: 7, label: weekLabel(offset, monday) };
  }

  if (period === "month") {
    const total = now.getFullYear() * 12 + now.getMonth() + offset;
    const y = Math.floor(total / 12);
    const mm = ((total % 12) + 12) % 12;
    const from = toSec(new Date(y, mm, 1));
    const to = toSec(new Date(y, mm + 1, 1));
    return { from, to, days: Math.round((to - from) / DAY), label: monthLabel(offset, y, mm) };
  }

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const totalQ = now.getFullYear() * 4 + q + offset;
    const y = Math.floor(totalQ / 4);
    const qq = totalQ % 4;
    const from = toSec(new Date(y, qq * 3, 1));
    const to = toSec(new Date(y, qq * 3 + 3, 1));
    return { from, to, days: Math.round((to - from) / DAY), label: quarterLabel(offset, y, qq + 1) };
  }

  // year
  const y = now.getFullYear() + offset;
  const from = toSec(new Date(y, 0, 1));
  const to = toSec(new Date(y + 1, 0, 1));
  return { from, to, days: Math.round((to - from) / DAY), label: yearLabel(offset, y) };
}

function dayLabel(offset: number, d: Date): string {
  if (offset === 0) return "今天";
  if (offset === -1) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function weekLabel(offset: number, monday: Date): string {
  if (offset === 0) return "本周";
  if (offset === -1) return "上周";
  return `${monday.getMonth() + 1}月${monday.getDate()}日 起`;
}
function monthLabel(offset: number, y: number, mm: number): string {
  if (offset === 0) return "本月";
  if (offset === -1) return "上月";
  return `${y}年${mm + 1}月`;
}
function quarterLabel(offset: number, y: number, q: number): string {
  if (offset === 0) return "本季度";
  if (offset === -1) return "上季度";
  return `${y}年 第${q}季度`;
}
function yearLabel(offset: number, y: number): string {
  if (offset === 0) return "今年";
  if (offset === -1) return "去年";
  return `${y}年`;
}
