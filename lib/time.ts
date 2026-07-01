export const nowSec = () => Math.floor(Date.now() / 1000);

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 中文今日日期：2026年7月1日 · 周二 */
export function formatChineseDate(d = new Date()): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAYS[d.getDay()]}`;
}

/** 本地“今天 0 点”的 Unix 秒（避免 Worker(UTC) 时区偏移，前端按本地时区计算后传给后端） */
export function startOfLocalDaySec(d = new Date()): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000);
}

/** 相对时间（中文，精确到分钟）：刚刚 / X分钟前 / X小时Y分前 / X天前 / 日期 */
export function formatRelative(tsSec: number, now = nowSec()): string {
  const diff = Math.max(0, now - tsSec);
  if (diff < 60) return "刚刚";
  const totalMin = Math.floor(diff / 60);
  if (totalMin < 60) return `${totalMin} 分钟前`;
  if (diff < 86400) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h} 小时 ${m} 分前` : `${h} 小时前`;
  }
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days} 天前`;
  return formatDate(tsSec);
}

/** YYYY-MM-DD（本地） */
export function formatDate(tsSec: number): string {
  const d = new Date(tsSec * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 日期分组标题：今天 / 昨天 / 日期 */
export function dateLabel(tsSec: number, todayStart = startOfLocalDaySec()): string {
  if (tsSec >= todayStart) return "今天";
  if (tsSec >= todayStart - 86400) return "昨天";
  return formatDate(tsSec);
}

/** 秒 → 中文时长：1时23分 / 45分 */
export function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}时${m}分`;
  return `${m}分`;
}

/** 秒 → 间隔时长：>=1天显示「X.X 天」，否则「X 小时」/「X 分钟」 */
export function formatInterval(seconds: number): string {
  if (seconds >= 86400) return `${(seconds / 86400).toFixed(1)} 天`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} 小时`;
  return `${Math.max(1, Math.round(seconds / 60))} 分钟`;
}

/** 计时器 mm:ss */
export function formatClock(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** HH:mm（本地） */
export function formatClockTime(tsSec: number): string {
  const d = new Date(tsSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** unix 秒 → datetime-local 输入值（本地 YYYY-MM-DDTHH:mm） */
export function secToLocalInput(tsSec: number): string {
  const d = new Date(tsSec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local 输入值 → unix 秒 */
export function localInputToSec(val: string): number {
  const t = new Date(val).getTime();
  return Number.isNaN(t) ? nowSec() : Math.floor(t / 1000);
}

/** 当地 0 点的 Date */
function startOfDayDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 宝宝年龄的“合理显示”：按年龄阶段切换主单位（天 → 周 → 月 → 岁），
 * 始终附带累计天数。
 * - 出生当天：出生第 1 天
 * - < 1 个月：出生 N 天 · 第 N 周
 * - 1~11 个月：X 个月 Y 天 · 出生 N 天
 * - ≥ 1 岁：X 岁 X 个月 · 出生 N 天
 */
export function formatBabyAge(
  birth: Date,
  now = new Date()
): { primary: string; secondary?: string } {
  const MS_PER_DAY = 86_400_000;
  const totalDays = Math.max(
    0,
    Math.floor((startOfDayDate(now).getTime() - startOfDayDate(birth).getTime()) / MS_PER_DAY)
  );

  // 日历年龄（年/月/天）
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (totalDays === 0) return { primary: "出生第 1 天", secondary: "今天出生 🎉" };
  if (years >= 1) {
    return {
      primary: `${years} 岁${months > 0 ? ` ${months} 个月` : ""}`,
      secondary: `出生 ${totalDays} 天`,
    };
  }
  if (months >= 1) {
    return {
      primary: `${months} 个月${days > 0 ? ` ${days} 天` : ""}`,
      secondary: `出生 ${totalDays} 天`,
    };
  }
  const weekNo = Math.floor(totalDays / 7) + 1;
  return { primary: `出生 ${totalDays} 天`, secondary: `第 ${weekNo} 周` };
}
