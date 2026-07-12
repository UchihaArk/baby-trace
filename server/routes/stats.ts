import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { toLog } from "../lib";

const todayQuerySchema = z.object({
  babyId: z.string(),
  since: z.string().optional(),
});

export type TodayStats = {
  bottleMl: number;
  breastMin: number;
  diaperCount: number;
  wetCount: number;
  dirtyCount: number;
  feedCount: number;
  pumpMl: number;
  lastFeed: ReturnType<typeof toLog> | null;
  lastPump: ReturnType<typeof toLog> | null;
  lastDiaper: ReturnType<typeof toLog> | null;
  openSleep: ReturnType<typeof toLog> | null;
  lastBath: ReturnType<typeof toLog> | null;
  lastHaircut: ReturnType<typeof toLog> | null;
  lastNail: ReturnType<typeof toLog> | null;
};

const summaryQuerySchema = z.object({
  babyId: z.string(),
  from: z.string(),
  to: z.string(),
});

const careQuerySchema = z.object({ babyId: z.string() });

/** 趋势：starts 为升序 unix 秒（本地 0 点对齐），to 为末周期结束（exclusive） */
const trendQuerySchema = z
  .object({
    babyId: z.string(),
    starts: z.string().regex(/^\d+(,\d+)*$/),
    to: z.string(),
  })
  .refine(
    (v) => {
      const xs = v.starts.split(",").map(Number);
      if (xs.length < 1 || xs.length > 31) return false;
      for (let i = 0; i < xs.length; i++) {
        if (!Number.isFinite(xs[i])) return false;
        if (i > 0 && xs[i] <= xs[i - 1]) return false;
      }
      return Number(v.to) > xs[xs.length - 1];
    },
    { message: "starts 必须为升序 unix 秒，且 to 须大于最后一个 start" }
  );

export type CareInterval = { avgSeconds: number; count: number } | null;
export type CareSummary = { bath: CareInterval; haircut: CareInterval; nail: CareInterval };
export type Summary = {
  feed: { avg: number; max: number; min: number; count: number } | null;
  breastMinutes: number;
  diaperCount: number;
  pumpMl: number;
  sleepSeconds: number;
  care: CareSummary;
};

/** 单个趋势桶的全部指标聚合（前端按索引与 trendBuckets 对齐） */
export type BucketAgg = {
  bottleMl: number;
  bottleCount: number;
  bottleMax: number;
  bottleMin: number;
  breastMinutes: number;
  diaperCount: number;
  wetCount: number;
  dirtyCount: number;
  pumpMl: number;
  pumpCount: number;
  pumpMax: number;
  sleepSeconds: number;
  sleepCount: number;
  sleepMax: number;
  bathCount: number;
  haircutCount: number;
  nailCount: number;
  /** 各指标「有数据的天数」——日均的分母；0 表示该期该指标无记录 */
  daysWithData: {
    bottle: number;
    diaper: number;
    pump: number;
    sleep: number;
  };
};

export type TrendResponse = BucketAgg[];

function safeParse(s: string): { method?: string; type?: string } | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** 相邻两次的的平均间隔（秒） */
function careInterval(rows: { startTime: number }[]): CareInterval {
  if (rows.length < 2) return null;
  const sorted = rows.map((r) => r.startTime).sort((a, b) => a - b);
  let gap = 0;
  for (let i = 1; i < sorted.length; i++) gap += sorted[i] - sorted[i - 1];
  return { avgSeconds: Math.round(gap / (sorted.length - 1)), count: sorted.length };
}

export const statsRoutes = new Hono<AppEnv>()
  /** GET /stats/today?babyId=&since= */
  .get("/today", zValidator("query", todayQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);
    const sinceRaw = Number(q.since);
    const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? sinceRaw : 0;

    const todayRows = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), gte(schema.babyLogs.startTime, since)))
      .orderBy(desc(schema.babyLogs.startTime))
      .all();

    let bottleMl = 0;
    let breastMin = 0;
    let diaperCount = 0;
    let wetCount = 0;
    let dirtyCount = 0;
    let feedCount = 0;
    let pumpMl = 0;

    for (const r of todayRows) {
      if (r.activityType === "feed") {
        feedCount += 1;
        const d = r.details ? safeParse(r.details) : null;
        if (d?.method === "bottle") bottleMl += r.amount ?? 0;
        else if (d?.method === "breast") breastMin += r.amount ?? 0;
      } else if (r.activityType === "diaper") {
        diaperCount += 1;
        const dd = r.details ? safeParse(r.details) : null;
        if (dd?.type === "wet" || dd?.type === "both") wetCount += 1;
        if (dd?.type === "dirty" || dd?.type === "both") dirtyCount += 1;
      } else if (r.activityType === "pump") {
        pumpMl += r.amount ?? 0;
      }
    }

    const [lastFeed] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "feed")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();

    const [lastPump] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "pump")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();

    const [lastDiaper] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "diaper")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();

    const [openSleep] = await db
      .select()
      .from(schema.babyLogs)
      .where(
        and(
          eq(schema.babyLogs.babyId, babyId),
          eq(schema.babyLogs.activityType, "sleep"),
          isNull(schema.babyLogs.endTime)
        )
      )
      .limit(1)
      .all();

    const [lastBath] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "bath")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();
    const [lastHaircut] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "haircut")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();
    const [lastNail] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "nail")))
      .orderBy(desc(schema.babyLogs.startTime))
      .limit(1)
      .all();

    const stats: TodayStats = {
      bottleMl,
      breastMin,
      diaperCount,
      wetCount,
      dirtyCount,
      feedCount,
      pumpMl,
      lastFeed: lastFeed ? toLog(lastFeed) : null,
      lastPump: lastPump ? toLog(lastPump) : null,
      lastDiaper: lastDiaper ? toLog(lastDiaper) : null,
      openSleep: openSleep ? toLog(openSleep) : null,
      lastBath: lastBath ? toLog(lastBath) : null,
      lastHaircut: lastHaircut ? toLog(lastHaircut) : null,
      lastNail: lastNail ? toLog(lastNail) : null,
    };
    return c.json(stats);
  })

  /**
   * GET /stats/summary?babyId=&from=&to=
   * 按时间区间聚合：喂养(奶瓶单次均/最大/最小)、尿布次数、吸奶产出、睡眠时长；
   * 护理(洗澡/理发/剪指甲)平均间隔按全部历史计算。
   */
  .get("/summary", zValidator("query", summaryQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);
    const from = Number(q.from);
    const to = Number(q.to);

    const rows = await db
      .select()
      .from(schema.babyLogs)
      .where(
        and(
          eq(schema.babyLogs.babyId, babyId),
          gte(schema.babyLogs.startTime, from),
          lt(schema.babyLogs.startTime, to)
        )
      )
      .orderBy(desc(schema.babyLogs.startTime))
      .all();

    const bottle: number[] = [];
    let breastMinutes = 0;
    let diaperCount = 0;
    let pumpMl = 0;
    let sleepSeconds = 0;

    for (const r of rows) {
      if (r.activityType === "feed") {
        const d = r.details ? safeParse(r.details) : null;
        if (d?.method === "bottle" && r.amount != null) bottle.push(r.amount);
        else if (d?.method === "breast" && r.amount != null) breastMinutes += r.amount;
      } else if (r.activityType === "diaper") {
        diaperCount += 1;
      } else if (r.activityType === "pump") {
        pumpMl += r.amount ?? 0;
      } else if (r.activityType === "sleep" && r.endTime) {
        sleepSeconds += r.endTime - r.startTime;
      }
    }

    const feed =
      bottle.length > 0
        ? {
            avg: Math.round(bottle.reduce((a, b) => a + b, 0) / bottle.length),
            max: Math.max(...bottle),
            min: Math.min(...bottle),
            count: bottle.length,
          }
        : null;

    // 护理平均间隔（全部历史）
    const careRows = await db
      .select()
      .from(schema.babyLogs)
      .where(
        and(
          eq(schema.babyLogs.babyId, babyId),
          inArray(schema.babyLogs.activityType, ["bath", "haircut", "nail"])
        )
      )
      .orderBy(schema.babyLogs.startTime)
      .all();

    const summary: Summary = {
      feed,
      breastMinutes,
      diaperCount,
      pumpMl,
      sleepSeconds,
      care: {
        bath: careInterval(careRows.filter((r) => r.activityType === "bath")),
        haircut: careInterval(careRows.filter((r) => r.activityType === "haircut")),
        nail: careInterval(careRows.filter((r) => r.activityType === "nail")),
      },
    };
    return c.json(summary);
  })

  /**
   * GET /stats/trend?babyId=&starts=t0,t1,...&to=tEnd
   * 一次查询 trailing N 个周期，每周期返回全部指标聚合 + 各指标「有数据的天数」。
   * starts 为升序 unix 秒（本地 0 点对齐，由前端算好），to 为末周期结束。
   * 日均 = 总量 ÷ 该指标有数据的天数；当前不完整期与历史完整期因此可比。
   */
  .get("/trend", zValidator("query", trendQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);
    const starts = q.starts.split(",").map(Number);
    const to = Number(q.to);
    const n = starts.length;

    const rows = await db
      .select()
      .from(schema.babyLogs)
      .where(
        and(
          eq(schema.babyLogs.babyId, babyId),
          gte(schema.babyLogs.startTime, starts[0]),
          lt(schema.babyLogs.startTime, to)
        )
      )
      .all();

    const acc = Array.from({ length: n }, () => ({
      bottleMl: 0,
      bottleCount: 0,
      bottleMax: 0,
      bottleMin: Number.POSITIVE_INFINITY,
      breastMinutes: 0,
      diaperCount: 0,
      wetCount: 0,
      dirtyCount: 0,
      pumpMl: 0,
      pumpCount: 0,
      pumpMax: 0,
      sleepSeconds: 0,
      sleepCount: 0,
      sleepMax: 0,
      bathCount: 0,
      haircutCount: 0,
      nailCount: 0,
      // 单归属：一条记录只计入其 startTime 所在本地日；跨夜睡眠不拆分。
      daysBottle: new Set<number>(),
      daysDiaper: new Set<number>(),
      daysPump: new Set<number>(),
      daysSleep: new Set<number>(),
    }));

    for (const r of rows) {
      // 落桶：最大的 starts[i] <= startTime（starts 升序）
      let bi = 0;
      for (let i = 0; i < n; i++) {
        if (r.startTime >= starts[i]) bi = i;
        else break;
      }
      const a = acc[bi];
      // 本地日索引（starts[bi] 已是本地 0 点对齐；中国无 DST，精确）
      const dayIdx = Math.floor((r.startTime - starts[bi]) / 86400);

      if (r.activityType === "feed") {
        const d = r.details ? safeParse(r.details) : null;
        if (d?.method === "bottle" && r.amount != null) {
          a.bottleMl += r.amount;
          a.bottleCount += 1;
          if (r.amount > a.bottleMax) a.bottleMax = r.amount;
          if (r.amount < a.bottleMin) a.bottleMin = r.amount;
          a.daysBottle.add(dayIdx);
        } else if (d?.method === "breast" && r.amount != null) {
          a.breastMinutes += r.amount;
        }
      } else if (r.activityType === "diaper") {
        a.diaperCount += 1;
        const dd = r.details ? safeParse(r.details) : null;
        if (dd?.type === "wet" || dd?.type === "both") a.wetCount += 1;
        if (dd?.type === "dirty" || dd?.type === "both") a.dirtyCount += 1;
        a.daysDiaper.add(dayIdx);
      } else if (r.activityType === "pump") {
        const ml = r.amount ?? 0;
        a.pumpMl += ml;
        a.pumpCount += 1;
        if (ml > a.pumpMax) a.pumpMax = ml;
        a.daysPump.add(dayIdx);
      } else if (r.activityType === "sleep" && r.endTime) {
        const dur = r.endTime - r.startTime;
        a.sleepSeconds += dur;
        a.sleepCount += 1;
        if (dur > a.sleepMax) a.sleepMax = dur;
        a.daysSleep.add(dayIdx);
      } else if (r.activityType === "bath") {
        a.bathCount += 1;
      } else if (r.activityType === "haircut") {
        a.haircutCount += 1;
      } else if (r.activityType === "nail") {
        a.nailCount += 1;
      }
    }

    const res: TrendResponse = acc.map((a) => ({
      bottleMl: a.bottleMl,
      bottleCount: a.bottleCount,
      bottleMax: a.bottleMax,
      bottleMin: a.bottleCount > 0 ? a.bottleMin : 0,
      breastMinutes: a.breastMinutes,
      diaperCount: a.diaperCount,
      wetCount: a.wetCount,
      dirtyCount: a.dirtyCount,
      pumpMl: a.pumpMl,
      pumpCount: a.pumpCount,
      pumpMax: a.pumpMax,
      sleepSeconds: a.sleepSeconds,
      sleepCount: a.sleepCount,
      sleepMax: a.sleepMax,
      bathCount: a.bathCount,
      haircutCount: a.haircutCount,
      nailCount: a.nailCount,
      daysWithData: {
        bottle: a.daysBottle.size,
        diaper: a.daysDiaper.size,
        pump: a.daysPump.size,
        sleep: a.daysSleep.size,
      },
    }));

    return c.json(res);
  })

  /**
   * GET /stats/care?babyId=
   * 洗澡/理发/剪指甲 的全历史平均间隔（事件稀疏，独立于周期）。
   */
  .get("/care", zValidator("query", careQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);

    const careRows = await db
      .select()
      .from(schema.babyLogs)
      .where(
        and(
          eq(schema.babyLogs.babyId, babyId),
          inArray(schema.babyLogs.activityType, ["bath", "haircut", "nail"])
        )
      )
      .orderBy(schema.babyLogs.startTime)
      .all();

    const care: CareSummary = {
      bath: careInterval(careRows.filter((r) => r.activityType === "bath")),
      haircut: careInterval(careRows.filter((r) => r.activityType === "haircut")),
      nail: careInterval(careRows.filter((r) => r.activityType === "nail")),
    };
    return c.json(care);
  });
