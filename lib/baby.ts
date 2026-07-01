/** 宝宝主题色预设（与 server/inputs.ts 的 babyColorKeys 对应） */
export const BABY_COLOR_OPTIONS = [
  { key: "rose", label: "玫瑰", dot: "bg-rose-500" },
  { key: "amber", label: "暖橙", dot: "bg-amber-500" },
  { key: "indigo", label: "靛蓝", dot: "bg-indigo-500" },
  { key: "teal", label: "青绿", dot: "bg-teal-500" },
  { key: "violet", label: "紫罗兰", dot: "bg-violet-500" },
  { key: "sky", label: "天蓝", dot: "bg-sky-500" },
  { key: "emerald", label: "翠绿", dot: "bg-emerald-500" },
  { key: "orange", label: "橘色", dot: "bg-orange-500" },
] as const;

/**
 * 头像 emoji 预设（100+）：
 * 先是男孩/女孩/婴儿/儿童（含不同肤色），再是可爱动物，再是物件/自然/食物。
 */
export const BABY_EMOJI_OPTIONS = [
  // —— 男孩 ——
  "👦", "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿",
  // —— 女孩 ——
  "👧", "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿",
  // —— 婴儿 ——
  "👶", "👶🏻", "👶🏼", "👶🏽", "👶🏾", "👶🏿",
  // —— 儿童 ——
  "🧒", "🧒🏻", "🧒🏼", "🧒🏽", "🧒🏾", "🧒🏿",
  // —— 动物 ——
  "🐰", "🐱", "🐶", "🐼", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮",
  "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦉", "🐴", "🦄",
  "🐝", "🦋", "🐢", "🐙", "🦕", "🦖", "🐬", "🐳", "🐠", "🐡",
  "🦔", "🐹", "🐭", "🦘", "🦝", "🦓", "🦒", "🐘", "🦏", "🐐",
  // —— 物件 / 自然 / 食物 ——
  "🎈", "🧸", "⭐", "🌙", "☀️", "🌈", "🌸", "🌺", "🌻", "🌼",
  "🌷", "🌹", "🍀", "🍁", "🌵", "🌴", "⚽", "🏀", "🎯", "🎨",
  "🎸", "🚲", "✈️", "🍎", "🍓", "🍒", "🍑", "🍉", "🍇", "🍊",
  "🍋", "🍍", "🥝", "🍅", "🥕", "🍰", "🍦", "🍩", "🍪", "🍼",
  "🧃", "❤️", "💖", "✨", "🎁",
];

/** 头像柔和背景色（按 color key） */
export const babyColorBg: Record<string, string> = {
  rose: "bg-rose-500/15",
  amber: "bg-amber-500/15",
  indigo: "bg-indigo-500/15",
  teal: "bg-teal-500/15",
  violet: "bg-violet-500/15",
  sky: "bg-sky-500/15",
  emerald: "bg-emerald-500/15",
  orange: "bg-orange-500/15",
};

/** 性别选项 */
export const GENDER_OPTIONS: { value: "male" | "female" | "other"; label: string; emoji: string }[] = [
  { value: "male", label: "男孩", emoji: "👦" },
  { value: "female", label: "女孩", emoji: "👧" },
  { value: "other", label: "不填写", emoji: "🚻" },
];
