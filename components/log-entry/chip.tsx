"use client";

import { cn } from "@/lib/utils";

/** 大号可选 chip（单手盲操友好） */
export function Chip({
  selected,
  selectedClass,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  selectedClass?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        selected
          ? selectedClass ?? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
