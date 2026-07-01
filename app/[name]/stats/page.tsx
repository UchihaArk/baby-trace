"use client";

import { useState } from "react";
import { useBaby } from "@/components/baby/baby-provider";
import { Chip } from "@/components/log-entry/chip";
import { useStatsSummary } from "@/lib/hooks";
import { PERIOD_OPTIONS, periodRange, type Period } from "@/lib/periods";
import { formatDuration, formatInterval } from "@/lib/time";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  unit,
  big,
}: {
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-bold tabular-nums", big ? "text-2xl" : "text-lg")}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

const dash = "—";

export default function StatsPage() {
  const { baby, isLoading } = useBaby();
  const [period, setPeriod] = useState<Period>("month");
  const [offset, setOffset] = useState(0);
  const range = periodRange(period, offset);
  const { data, isValidating } = useStatsSummary(baby?.id ?? null, range.from, range.to);

  if (isLoading || !baby) {
    return <div className="px-4 py-24 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const sleepSeconds = data?.sleepSeconds ?? 0;
  const care = data?.care;

  return (
    <main className="space-y-5 px-4 pb-8 pt-3">
      {/* 周期切换 */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((p) => (
          <Chip
            key={p.value}
            selected={period === p.value}
            onClick={() => {
              setPeriod(p.value);
              setOffset(0);
            }}
            selectedClass="border-transparent bg-primary text-primary-foreground"
            className="min-h-9 flex-none px-4 py-1.5 text-xs"
          >
            {p.label}
          </Chip>
        ))}
      </div>

      {/* 区间导航 */}
      <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-2 py-2 text-sm">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          className="flex size-9 items-center justify-center rounded-full text-xl hover:bg-muted"
          aria-label="上一段"
        >
          ‹
        </button>
        <span className="font-medium">
          {range.label}
          {isValidating && !data ? " · 加载中…" : ""}
        </span>
        <button
          type="button"
          disabled={offset >= 0}
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          className="flex size-9 items-center justify-center rounded-full text-xl hover:bg-muted disabled:opacity-30"
          aria-label="下一段"
        >
          ›
        </button>
      </div>

      {/* 喂养 */}
      <Section title="🍼 喂养（奶瓶单次奶量）">
        {data?.feed ? (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="平均" value={`${data.feed.avg}`} unit="ml" />
            <Stat label="最大" value={`${data.feed.max}`} unit="ml" />
            <Stat label="最小" value={`${data.feed.min}`} unit="ml" />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            该时段暂无奶瓶记录
          </div>
        )}
        {data && data.breastMinutes > 0 && (
          <div className="mt-2 px-1 text-xs text-muted-foreground">亲喂共 {data.breastMinutes} 分钟</div>
        )}
      </Section>

      {/* 尿布 */}
      <Section title="🧻 尿布">
        <Stat label="使用" value={`${data?.diaperCount ?? 0}`} unit="张" big />
      </Section>

      {/* 吸奶 */}
      <Section title="🥛 吸奶（母乳产出）">
        <Stat label="产出" value={`${data?.pumpMl ?? 0}`} unit="ml" big />
      </Section>

      {/* 睡眠 */}
      <Section title="💤 睡眠">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="总时长" value={formatDuration(sleepSeconds)} />
          <Stat label="日均" value={formatDuration(Math.round(sleepSeconds / range.days))} />
        </div>
      </Section>

      {/* 护理 */}
      <Section title="✂️ 护理（平均间隔 · 按全部历史）">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="🛁 洗澡" value={care?.bath ? formatInterval(care.bath.avgSeconds) : dash} />
          <Stat label="💈 理发" value={care?.haircut ? formatInterval(care.haircut.avgSeconds) : dash} />
          <Stat label="✂️ 剪指甲" value={care?.nail ? formatInterval(care.nail.avgSeconds) : dash} />
        </div>
      </Section>
    </main>
  );
}
