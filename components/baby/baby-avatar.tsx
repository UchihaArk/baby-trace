import { cn } from "@/lib/utils";
import { babyColorBg } from "@/lib/baby";

export function BabyAvatar({
  emoji,
  color,
  className,
}: {
  emoji: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        babyColorBg[color] ?? "bg-muted",
        className
      )}
    >
      <span>{emoji}</span>
    </div>
  );
}
