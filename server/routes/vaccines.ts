import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { createVaccineSchema, updateVaccineSchema } from "../inputs";
import { nowSec } from "../lib";

const listQuerySchema = z.object({
  babyId: z.string(),
});

export const vaccinesRoutes = new Hono<AppEnv>()
  /**
   * GET /vaccines?babyId=
   * 返回该宝宝的全部接种记录，按接种时间升序（最旧在前，即接种历史顺序）。
   */
  .get("/", zValidator("query", listQuerySchema), async (c) => {
    const q = c.req.valid("query");
    const db = createDb(c.env.DB);
    const babyId = Number(q.babyId);

    const rows = await db
      .select()
      .from(schema.babyVaccines)
      .where(eq(schema.babyVaccines.babyId, babyId))
      .orderBy(asc(schema.babyVaccines.vaccinatedAt))
      .all();

    return c.json(rows);
  })

  /** POST /vaccines —— 新增一条接种记录 */
  .post("/", zValidator("json", createVaccineSchema), async (c) => {
    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const [row] = await db
      .insert(schema.babyVaccines)
      .values({
        babyId: body.babyId,
        name: body.name,
        dose: body.dose ?? null,
        vaccinatedAt: body.vaccinatedAt,
        notes: body.notes ?? null,
        createdAt: nowSec(),
      })
      .returning();

    return c.json(row, 201);
  })

  /** PATCH /vaccines/:id —— 编辑接种记录 */
  .patch("/:id", zValidator("json", updateVaccineSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.dose !== undefined) patch.dose = body.dose;
    if (body.vaccinatedAt !== undefined) patch.vaccinatedAt = body.vaccinatedAt;
    if (body.notes !== undefined) patch.notes = body.notes;

    const [row] = await db
      .update(schema.babyVaccines)
      .set(patch)
      .where(eq(schema.babyVaccines.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  })

  /** DELETE /vaccines/:id —— 删除接种记录 */
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const [row] = await db
      .delete(schema.babyVaccines)
      .where(eq(schema.babyVaccines.id, id))
      .returning();

    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ ok: true, id });
  });
