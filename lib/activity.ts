import { Baby, Bath, Droplets, Hand, Moon, Scissors, Soup, Utensils, type LucideIcon } from "lucide-react";
import { formatDuration } from "./time";
import type { ActivityType, DiaperDetails, FoodDetails, LogApi, NailDetails } from "./types";

type Meta = {
  label: string;
  emoji: string;
  icon: LucideIcon;
  text: string; // 文字色
  bgSolid: string; // 实心背景
  bgSoft: string; // 柔和背景
  ring: string; // 描边/聚焦
  border: string; // 边框
};

/** 各类活动的色彩与图标（全程 Tailwind 工具类） */
export const activityMeta: Record<ActivityType, Meta> = {
  feed: {
    label: "喂奶",
    emoji: "🍼",
    icon: Utensils,
    text: "text-rose-600 dark:text-rose-400",
    bgSolid: "bg-rose-500",
    bgSoft: "bg-rose-500/10",
    ring: "ring-rose-500/30",
    border: "border-rose-500/20",
  },
  diaper: {
    label: "换尿布",
    emoji: "🧻",
    icon: Baby,
    text: "text-amber-600 dark:text-amber-400",
    bgSolid: "bg-amber-500",
    bgSoft: "bg-amber-500/10",
    ring: "ring-amber-500/30",
    border: "border-amber-500/20",
  },
  sleep: {
    label: "睡眠",
    emoji: "💤",
    icon: Moon,
    text: "text-indigo-600 dark:text-indigo-400",
    bgSolid: "bg-indigo-500",
    bgSoft: "bg-indigo-500/10",
    ring: "ring-indigo-500/30",
    border: "border-indigo-500/20",
  },
  pump: {
    label: "吸奶",
    emoji: "🥛",
    icon: Droplets,
    text: "text-teal-600 dark:text-teal-400",
    bgSolid: "bg-teal-700",
    bgSoft: "bg-teal-500/10",
    ring: "ring-teal-500/30",
    border: "border-teal-500/20",
  },
  bath: {
    label: "洗澡",
    emoji: "🛁",
    icon: Bath,
    text: "text-sky-600 dark:text-sky-400",
    bgSolid: "bg-sky-500",
    bgSoft: "bg-sky-500/10",
    ring: "ring-sky-500/30",
    border: "border-sky-500/20",
  },
  haircut: {
    label: "理发",
    emoji: "💈",
    icon: Scissors,
    text: "text-violet-600 dark:text-violet-400",
    bgSolid: "bg-violet-500",
    bgSoft: "bg-violet-500/10",
    ring: "ring-violet-500/30",
    border: "border-violet-500/20",
  },
  nail: {
    label: "剪指甲",
    emoji: "✂️",
    icon: Hand,
    text: "text-emerald-600 dark:text-emerald-400",
    bgSolid: "bg-emerald-700",
    bgSoft: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
    border: "border-emerald-500/20",
  },
  food: {
    label: "辅食",
    emoji: "🥣",
    icon: Soup,
    text: "text-orange-600 dark:text-orange-400",
    bgSolid: "bg-orange-500",
    bgSoft: "bg-orange-500/10",
    ring: "ring-orange-500/30",
    border: "border-orange-500/20",
  },
};

const diaperTypeLabel: Record<"wet" | "dirty" | "both", string> = {
  wet: "嘘嘘",
  dirty: "粑粑",
  both: "嘘嘘+粑粑",
};
const breastSideLabel: Record<"left" | "right" | "both", string> = {
  left: "左",
  right: "右",
  both: "双侧",
};
const nailTypeLabel: Record<"fingers" | "toes" | "both", string> = {
  fingers: "手指",
  toes: "脚趾",
  both: "手指+脚趾",
};

/** 一条记录的简要描述（不含时间） */
export function describeLog(log: LogApi): string {
  switch (log.activityType) {
    case "feed": {
      const d = log.details;
      if (d && "method" in d && d.method === "bottle") {
        const milkLabel = d.milk === "formula" ? "奶粉" : "母乳";
        return `${milkLabel} ${log.amount ?? 0} ml`;
      }
      if (d && "method" in d && d.method === "breast") {
        const side = d.side ? ` · ${breastSideLabel[d.side]}` : "";
        return `亲喂${side} ${log.amount ?? 0} 分钟`;
      }
      return `${log.amount ?? 0} ml`;
    }
    case "diaper": {
      const d = log.details as DiaperDetails | null;
      return d ? diaperTypeLabel[d.type] : "已换";
    }
    case "pump": {
      const d = log.details;
      const side = d && "side" in d && d.side ? pumpSideText(d.side) : "";
      return `${side} ${log.amount ?? 0} ml`.trim();
    }
    case "nail": {
      const d = log.details as NailDetails | null;
      return d ? nailTypeLabel[d.type] : "剪指甲";
    }
    case "bath":
      return "洗澡";
    case "haircut":
      return "理发";
    case "food": {
      const d = log.details as FoodDetails | null;
      return d?.name ?? "辅食";
    }
    case "sleep":
    default:
      return log.endTime && log.startTime ? formatDuration(log.endTime - log.startTime) : "进行中";
  }
}

function pumpSideText(side: "left" | "right" | "both"): string {
  return side === "both" ? "双侧" : side === "left" ? "左侧" : "右侧";
}
