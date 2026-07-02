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
 * - viewport 里用 prefers-color-scheme 兜底（跟随系统）。
 * - 本组件处理「app 内手动切换主题」：resolvedTheme 与系统不一致时，
 *   用 JS 把所有 theme-color meta 同步为当前主题对应的背景色。
 * - 用 MutationObserver 守卫：客户端导航（切 Tab）时 Next 可能重写 viewport
 *   的 theme-color meta 回静态值，导致暗黑模式下状态栏瞬间回白——监听到变化立即纠正。
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  const target = resolvedTheme === "dark" ? COLOR_BY_THEME.dark : COLOR_BY_THEME.light;

  useEffect(() => {
    const apply = () => {
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        if (m.getAttribute("content") !== target) m.setAttribute("content", target);
      });
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
      childList: true,
    });
    return () => observer.disconnect();
  }, [target]);

  return null;
}
