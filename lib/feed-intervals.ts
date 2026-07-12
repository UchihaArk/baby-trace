/**
 * 喂奶 / 吸奶 / 换尿布的月龄分段建议间隔。
 * 根据宝宝出生日期计算「完整月龄」，返回该阶段的建议间隔（秒）。
 *
 * 阈值依据（育儿常识，仅作提示参考，非医学处方）：
 * - 喂奶：0–6 月 3h、≥6 月 4h（添加辅食后频次降低）。
 * - 吸奶：0–6 周（≈1.5 月）3h（建立泌乳、防涨奶）、1.5–6 月 4h（供需平衡期）、≥6 月 6h。
 * - 尿布：5h 一次，避免久捂。
 */
export type FeedKind = "feed" | "pump" | "diaper";

/** 从出生到指定时刻的完整月数（本月还没到出生日则少算一个月） */
export function completedMonths(birth: Date, now = new Date()): number {
  const n = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return now.getDate() < birth.getDate() ? n - 1 : n;
}

/** 按月龄返回某类的建议间隔（秒）。 */
export function suggestIntervalSec(kind: FeedKind, months: number): number {
  const HOUR = 3600;
  if (kind === "feed") {
    return months >= 6 ? 4 * HOUR : 3 * HOUR;
  }
  if (kind === "pump") {
    if (months < 2) return 3 * HOUR; // 0–约 6 周：建立泌乳期
    if (months < 6) return 4 * HOUR; // 1.5–6 月：供需平衡期
    return 6 * HOUR; // ≥ 6 月：辅食期，频次明显降低
  }
  // diaper
  return 5 * HOUR;
}

export type GapLevel = "ok" | "focus" | "suggest";

export type GapState = {
  level: GapLevel;
  label: string; // 「该关注了」/「建议喂养」/「建议吸奶」/「」
  /** 状态圆点类（Tailwind 字面量） */
  dotClass: string;
  /** 文字色（Tailwind 字面量）；ok 时为空串 */
  textClass: string;
};

/** 围绕建议间隔的 ±30 分钟窗口 */
const WINDOW = 30 * 60;

/** 根据距上次操作的秒数 + 建议间隔，返回间隔状态：
 * - < 建议间隔 - 30min：正常
 * - 建议间隔 - 30min ~ 建议间隔 + 30min：该关注了（临近建议时间）
 * - ≥ 建议间隔 + 30min：建议操作（喂养/吸奶） */
export function gapState(gapSec: number, intervalSec: number, action: string): GapState {
  if (gapSec >= intervalSec + WINDOW) {
    return {
      level: "suggest",
      label: `建议${action}`,
      dotClass: "bg-rose-500 animate-pulse",
      textClass: "text-rose-600 dark:text-rose-400",
    };
  }
  if (gapSec >= intervalSec - WINDOW) {
    return {
      level: "focus",
      label: "该关注了",
      dotClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }
  return { level: "ok", label: "", dotClass: "bg-emerald-500", textClass: "" };
}

/** 把秒数格式化为「X时Y分」/「X分」（展示间隔用） */
export function gapClock(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h} 时 ${mm} 分` : `${h} 时`;
}
