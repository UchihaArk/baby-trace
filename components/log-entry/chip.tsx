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
        "inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold transition duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        selected
          ? cn("shadow-sm", selectedClass ?? "bg-primary text-primary-foreground")
          : "bg-muted/60 text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
