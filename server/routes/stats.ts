import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
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
  lastFeed: ReturnType<typeof toLog> | null;
  openSleep: ReturnType<typeof toLog> | null;
};

function safeParse(s: string): { method?: string } | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
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

    for (const r of todayRows) {
      if (r.activityType === "feed") {
        const d = r.details ? safeParse(r.details) : null;
        if (d?.method === "bottle") bottleMl += r.amount ?? 0;
        else if (d?.method === "breast") breastMin += r.amount ?? 0;
      } else if (r.activityType === "diaper") {
        diaperCount += 1;
      }
    }

    const [lastFeed] = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), eq(schema.babyLogs.activityType, "feed")))
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

    const stats: TodayStats = {
      bottleMl,
      breastMin,
      diaperCount,
      lastFeed: lastFeed ? toLog(lastFeed) : null,
      openSleep: openSleep ? toLog(openSleep) : null,
    };
    return c.json(stats);
  });
