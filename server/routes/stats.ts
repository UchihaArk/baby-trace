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
  pumpMl: number;
  lastFeed: ReturnType<typeof toLog> | null;
  lastPump: ReturnType<typeof toLog> | null;
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

export type CareInterval = { avgSeconds: number; count: number } | null;
export type Summary = {
  feed: { avg: number; max: number; min: number; count: number } | null;
  breastMinutes: number;
  diaperCount: number;
  pumpMl: number;
  sleepSeconds: number;
  care: { bath: CareInterval; haircut: CareInterval; nail: CareInterval };
};

function safeParse(s: string): { method?: string } | null {
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
    let pumpMl = 0;

    for (const r of todayRows) {
      if (r.activityType === "feed") {
        const d = r.details ? safeParse(r.details) : null;
        if (d?.method === "bottle") bottleMl += r.amount ?? 0;
        else if (d?.method === "breast") breastMin += r.amount ?? 0;
      } else if (r.activityType === "diaper") {
        diaperCount += 1;
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
      pumpMl,
      lastFeed: lastFeed ? toLog(lastFeed) : null,
      lastPump: lastPump ? toLog(lastPump) : null,
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
  });
