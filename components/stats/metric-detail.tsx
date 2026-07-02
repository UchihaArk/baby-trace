"use client";

import type { BucketAgg } from "@/lib/types";
import { formatDurationLong, formatMl, formatMinutes, type Metric } from "./metrics";

const dash = "—";

function Cell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

/** 选中周期的指标明细；字段随 metric 自适应 */
export function MetricDetail({ metric, agg }: { metric: Metric; agg: BucketAgg }) {
  if (metric === "feed") {
    const days = agg.daysWithData.bottle;
    const avg = days > 0 ? agg.bottleMl / days : null;
    const perFeed = agg.bottleCount > 0 ? agg.bottleMl / agg.bottleCount : null;
    return (
      <div className="grid grid-cols-3 gap-3">
        <Cell label="日均奶量" value={avg != null ? formatMl(avg) : dash} />
        <Cell label="总奶量" value={formatMl(agg.bottleMl)} />
        <Cell label="奶瓶次数" value={`${agg.bottleCount}`} unit="次" />
        <Cell label="单次均" value={perFeed != null ? formatMl(perFeed) : dash} />
        <Cell label="最大" value={agg.bottleCount > 0 ? formatMl(agg.bottleMax) : dash} />
        <Cell label="亲喂" value={agg.breastMinutes > 0 ? formatMinutes(agg.breastMinutes) : dash} />
      </div>
    );
  }

  if (metric === "pump") {
    const days = agg.daysWithData.pump;
    const avg = days > 0 ? agg.pumpMl / days : null;
    const perPump = agg.pumpCount > 0 ? agg.pumpMl / agg.pumpCount : null;
    return (
      <div className="grid grid-cols-3 gap-3">
        <Cell label="日均" value={avg != null ? formatMl(avg) : dash} />
        <Cell label="总量" value={formatMl(agg.pumpMl)} />
        <Cell label="次数" value={`${agg.pumpCount}`} unit="次" />
        <Cell label="单次均" value={perPump != null ? formatMl(perPump) : dash} />
        <Cell label="最大" value={agg.pumpCount > 0 ? formatMl(agg.pumpMax) : dash} />
        <Cell label="有数据" value={`${days}`} unit="天" />
      </div>
    );
  }

  if (metric === "diaper") {
    const days = agg.daysWithData.diaper;
    const avg = days > 0 ? agg.diaperCount / days : null;
    return (
      <div className="grid grid-cols-3 gap-3">
        <Cell label="日均" value={avg != null ? avg.toFixed(1) : dash} unit="张" />
        <Cell label="总数" value={`${agg.diaperCount}`} unit="张" />
        <Cell label="有数据" value={`${days}`} unit="天" />
        <Cell label="💧 嘘嘘" value={`${agg.wetCount}`} unit="次" />
        <Cell label="💩 粑粑" value={`${agg.dirtyCount}`} unit="次" />
      </div>
    );
  }

  // sleep
  const days = agg.daysWithData.sleep;
  const avg = days > 0 ? agg.sleepSeconds / days : null;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Cell label="日均时长" value={avg != null ? formatDurationLong(avg) : dash} />
      <Cell label="总时长" value={formatDurationLong(agg.sleepSeconds)} />
      <Cell label="次数" value={`${agg.sleepCount}`} unit="次" />
      <Cell label="最长单次" value={agg.sleepMax > 0 ? formatDurationLong(agg.sleepMax) : dash} />
      <Cell label="有数据" value={`${days}`} unit="天" />
    </div>
  );
}
