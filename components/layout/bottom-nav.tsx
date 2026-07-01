"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings } from "lucide-react";
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
      label: "历史",
      icon: History,
      active: pathname.startsWith(`${base}/history`),
    },
    {
      href: `${base}/manage`,
      label: "设置",
      icon: Settings,
      active: pathname === `${base}/manage`,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors",
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
