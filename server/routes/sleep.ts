import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { nowSec, toLog } from "../lib";
import { toggleSleepSchema } from "../inputs";

export const sleepRoutes = new Hono<AppEnv>()
  /** GET /sleep?babyId= —— 当前是否有进行中的睡眠 */
  .get("/", async (c) => {
    const db = createDb(c.env.DB);
    const babyId = Number(c.req.query("babyId"));
    const [open] = await db
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
    return c.json({ openSleep: open ? toLog(open) : null });
  })

  /** POST /sleep/toggle —— 按 babyId 一键开始/停止 */
  .post("/toggle", zValidator("json", toggleSleepSchema), async (c) => {
    const { babyId } = c.req.valid("json");
    const db = createDb(c.env.DB);
    const now = nowSec();

    const [open] = await db
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

    if (open) {
      const [row] = await db
        .update(schema.babyLogs)
        .set({ endTime: Math.max(now, open.startTime + 1) })
        .where(eq(schema.babyLogs.id, open.id))
        .returning();
      return c.json({ state: "stopped" as const, log: toLog(row) });
    }

    const [row] = await db
      .insert(schema.babyLogs)
      .values({
        babyId,
        activityType: "sleep",
        startTime: now,
        endTime: null,
        amount: null,
        details: null,
        notes: null,
        createdAt: now,
      })
      .returning();
    return c.json({ state: "started" as const, log: toLog(row) }, 201);
  });
