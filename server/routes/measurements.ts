import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { createMeasurementSchema, updateMeasurementSchema } from "../inputs";
import { nowSec } from "../lib";

const listQuerySchema = z.object({
  babyId: z.string(),
  kind: z.enum(["weight", "height"]),
});

export const measurementsRoutes = new Hono<AppEnv>()
  /**
   * GET /measurements?babyId=&kind=
   * 返回该宝宝某种类的全部测量，按时间升序（最旧在前），供趋势图与「当前值」展示。
   */
  .get("/", zValidator("query", listQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);

    const rows = await db
      .select()
      .from(schema.babyMeasurements)
      .where(
        and(
          eq(schema.babyMeasurements.babyId, babyId),
          eq(schema.babyMeasurements.kind, q.kind)
        )
      )
      .orderBy(asc(schema.babyMeasurements.measuredAt))
      .all();

    return c.json(rows);
  })

  /** POST /measurements —— 新建测量记录 */
  .post("/", zValidator("json", createMeasurementSchema), async (c) => {
    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const [row] = await db
      .insert(schema.babyMeasurements)
      .values({
        babyId: body.babyId,
        kind: body.kind,
        measuredAt: body.measuredAt,
        valueGrams: body.valueGrams,
        notes: body.notes ?? null,
        createdAt: nowSec(),
      })
      .returning();

    return c.json(row, 201);
  })

  /** PATCH /measurements/:id —— 编辑测量记录 */
  .patch("/:id", zValidator("json", updateMeasurementSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const patch: Record<string, unknown> = {};
    if (body.kind !== undefined) patch.kind = body.kind;
    if (body.measuredAt !== undefined) patch.measuredAt = body.measuredAt;
    if (body.valueGrams !== undefined) patch.valueGrams = body.valueGrams;
    if (body.notes !== undefined) patch.notes = body.notes;

    const [row] = await db
      .update(schema.babyMeasurements)
      .set(patch)
      .where(eq(schema.babyMeasurements.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  })

  /** DELETE /measurements/:id —— 删除测量记录 */
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const [row] = await db
      .delete(schema.babyMeasurements)
      .where(eq(schema.babyMeasurements.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ ok: true, id });
  });
