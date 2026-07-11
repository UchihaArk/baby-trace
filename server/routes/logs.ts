import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, lt, or } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { createLogSchema, updateLogSchema } from "../inputs";
import { nowSec, toLog } from "../lib";

const listQuerySchema = z.object({
  babyId: z.string(),
  limit: z.string().optional(),
  beforeTs: z.string().optional(), // 游标：加载更早的记录
  beforeId: z.string().optional(),
  day: z.string().optional(), // 某日 0 点 unix 秒：返回 [day, day+1天) 全部记录
});

export const logsRoutes = new Hono<AppEnv>()
  /**
   * GET /logs?babyId=&limit=&beforeTs=&beforeId=
   * GET /logs?babyId=&day=<unix秒>
   * - 带 day：返回该自然日 [day, day+86400) 全部记录（按时间倒序，不分页）。
   * - 不带 day：游标分页，最近 N 条 / 早于 (beforeTs, beforeId) 的 N 条。
   */
  .get("/", zValidator("query", listQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);

    // 单日查询：历史页用，返回该日全部记录
    if (q.day != null) {
      const day = Number(q.day);
      if (Number.isFinite(day) && day > 0) {
        const rows = await db
          .select()
          .from(schema.babyLogs)
          .where(
            and(
              eq(schema.babyLogs.babyId, babyId),
              gte(schema.babyLogs.startTime, day),
              lt(schema.babyLogs.startTime, day + 86400)
            )
          )
          .orderBy(desc(schema.babyLogs.startTime), desc(schema.babyLogs.id))
          .all();
        return c.json(rows.map(toLog));
      }
    }

    const limit = Math.min(Math.max(Number(q.limit ?? "30"), 1), 100);
    const beforeTs = q.beforeTs != null ? Number(q.beforeTs) : null;
    const beforeId = q.beforeId != null ? Number(q.beforeId) : null;

    const cursor =
      beforeTs != null && beforeId != null
        ? or(
            lt(schema.babyLogs.startTime, beforeTs),
            and(eq(schema.babyLogs.startTime, beforeTs), lt(schema.babyLogs.id, beforeId))
          )
        : undefined;

    const rows = await db
      .select()
      .from(schema.babyLogs)
      .where(and(eq(schema.babyLogs.babyId, babyId), cursor))
      .orderBy(desc(schema.babyLogs.startTime), desc(schema.babyLogs.id))
      .limit(limit)
      .all();

    return c.json(rows.map(toLog));
  })

  /** POST /logs —— 新建记录（含 babyId） */
  .post("/", zValidator("json", createLogSchema), async (c) => {
    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const [row] = await db
      .insert(schema.babyLogs)
      .values({
        babyId: body.babyId,
        activityType: body.activityType,
        startTime: body.startTime,
        endTime: body.endTime ?? null,
        amount: body.amount ?? null,
        details: body.details ? JSON.stringify(body.details) : null,
        notes: body.notes ?? null,
        createdAt: nowSec(),
      })
      .returning();

    return c.json(toLog(row), 201);
  })

  /** PATCH /logs/:id —— 编辑记录 */
  .patch("/:id", zValidator("json", updateLogSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const patch: Record<string, unknown> = {};
    if (body.activityType !== undefined) patch.activityType = body.activityType;
    if (body.startTime !== undefined) patch.startTime = body.startTime;
    if (body.endTime !== undefined) patch.endTime = body.endTime;
    if (body.amount !== undefined) patch.amount = body.amount;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.details !== undefined) {
      patch.details = body.details === null ? null : JSON.stringify(body.details);
    }

    const [row] = await db
      .update(schema.babyLogs)
      .set(patch)
      .where(eq(schema.babyLogs.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(toLog(row));
  })

  /** DELETE /logs/:id —— 删除记录 */
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const [row] = await db
      .delete(schema.babyLogs)
      .where(eq(schema.babyLogs.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ ok: true, id });
  });
