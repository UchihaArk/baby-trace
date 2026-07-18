"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, PieChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBaby } from "@/components/baby/baby-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { baby } = useBaby();
  const base = baby ? `/${encodeURIComponent(baby.name)}` : "";

  const items = [
    { href: base, label: "仪表盘", icon: LayoutDashboard, active: pathname === base },
    {
      href: `${base}/history`,
      label: "记录详情",
      icon: History,
      active: pathname.startsWith(`${base}/history`),
    },
    {
      href: `${base}/stats`,
      label: "统计",
      icon: PieChart,
      active: pathname.startsWith(`${base}/stats`),
    },
    {
      href: `${base}/manage`,
      label: "设置",
      icon: Settings,
      active: pathname === `${base}/manage`,
    },
  ];

  return (
    <nav className="ui-bar ui-hairline-t sticky bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              prefetch
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] transition-colors",
                it.active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-6", it.active && "text-primary")} />
              <span className={cn(it.active && "font-semibold")}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
