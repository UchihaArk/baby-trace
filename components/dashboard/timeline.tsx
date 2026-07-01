"use client";

import { useRecentLogs } from "@/lib/hooks";
import { TimelineItem } from "./timeline-item";

export function Timeline({ babyId }: { babyId: number }) {
  const { data, isLoading } = useRecentLogs(babyId);

  return (
    <section>
      <h2 className="mb-1 px-1 text-sm font-semibold text-muted-foreground">最近动态</h2>
      {isLoading ? (
        <div className="space-y-1 px-1 py-2 text-sm text-muted-foreground">加载中…</div>
      ) : data && data.length > 0 ? (
        <div className="divide-y divide-border">
          {data.map((log) => (
            <TimelineItem key={log.id} log={log} babyId={babyId} showActions={false} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          还没有记录
          <br />
          点击下方按钮开始吧 👶
        </div>
      )}
    </section>
  );
}
