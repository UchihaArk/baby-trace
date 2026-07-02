"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// 状态栏/地址栏的 theme-color，取与 --background 一致的值，让顶部与界面融为一体
const COLOR_BY_THEME = {
  light: "#ffffff", // oklch(1 0 0)
  dark: "#0a0a0a", // oklch(0.145 0 0)
} as const;

/**
 * 让移动端状态栏 theme-color 跟随当前界面主题。
 * viewport 里已用 prefers-color-scheme 兜底（跟随系统），本组件额外处理
 * 用户在 app 内手动切换主题的情形——此时 resolvedTheme 与系统不一致，
 * 需要用 JS 把所有 theme-color meta 同步为当前主题对应的背景色。
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const color = resolvedTheme === "dark" ? COLOR_BY_THEME.dark : COLOR_BY_THEME.light;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", color));
  }, [resolvedTheme]);
  return null;
}
