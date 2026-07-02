import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import type { AppEnv } from "../env";
import { createDb, schema } from "../db";
import { accessCodeSchema, createBabySchema, updateBabySchema } from "../inputs";
import { hashAccessCode, nowSec, toPublicBaby, verifyAccessCode } from "../lib";

export const babiesRoutes = new Hono<AppEnv>()
  /** GET /babies —— 列出所有宝宝 */
  .get("/", async (c) => {
    const db = createDb(c.env.DB);
    const rows = await db
      .select()
      .from(schema.babies)
      .orderBy(schema.babies.createdAt)
      .all();
    return c.json(rows.map(toPublicBaby));
  })

  /** POST /babies —— 新建宝宝 */
  .post("/", zValidator("json", createBabySchema), async (c) => {
    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(schema.babies)
      .where(eq(schema.babies.name, body.name))
      .limit(1)
      .all();
    if (existing) return c.json({ error: "该乳名已存在" }, 409);

    const [row] = await db
      .insert(schema.babies)
      .values({
        name: body.name,
        birthDate: body.birthDate,
        gender: body.gender ?? null,
        avatarEmoji: body.avatarEmoji,
        avatarColor: body.avatarColor,
        createdAt: nowSec(),
      })
      .returning();
    return c.json(toPublicBaby(row), 201);
  })

  /** GET /babies/:name —— 按乳名查询（路由页用） */
  .get("/:name", async (c) => {
    const db = createDb(c.env.DB);
    const [row] = await db
      .select()
      .from(schema.babies)
      .where(eq(schema.babies.name, c.req.param("name")))
      .limit(1)
      .all();
    if (!row) return c.json({ error: "未找到该宝宝" }, 404);
    return c.json(toPublicBaby(row));
  })

  /** PATCH /babies/:id —— 编辑宝宝 */
  .patch("/:id", zValidator("json", updateBabySchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const body = c.req.valid("json");

    if (body.name) {
      const [dup] = await db
        .select()
        .from(schema.babies)
        .where(eq(schema.babies.name, body.name))
        .limit(1)
        .all();
      if (dup && dup.id !== id) return c.json({ error: "该乳名已存在" }, 409);
    }

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) if (v !== undefined) patch[k] = v;

    const [row] = await db
      .update(schema.babies)
      .set(patch)
      .where(eq(schema.babies.id, id))
      .returning();
    if (!row) return c.json({ error: "未找到" }, 404);
    return c.json(toPublicBaby(row));
  })

  /** PUT /babies/:id/access-code —— 设置/修改访问暗号（版本自增使旧解锁失效） */
  .put("/:id/access-code", zValidator("json", accessCodeSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const body = c.req.valid("json");
    const hash = await hashAccessCode(body.code);

    const [row] = await db
      .update(schema.babies)
      .set({
        accessCodeHash: hash,
        accessCodeVersion: sql`${schema.babies.accessCodeVersion} + 1`,
      })
      .where(eq(schema.babies.id, id))
      .returning();
    if (!row) return c.json({ error: "未找到" }, 404);
    return c.json(toPublicBaby(row));
  })

  /** DELETE /babies/:id/access-code —— 关闭访问暗号（版本仍自增） */
  .delete("/:id/access-code", async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const [row] = await db
      .update(schema.babies)
      .set({
        accessCodeHash: null,
        accessCodeVersion: sql`${schema.babies.accessCodeVersion} + 1`,
      })
      .where(eq(schema.babies.id, id))
      .returning();
    if (!row) return c.json({ error: "未找到" }, 404);
    return c.json(toPublicBaby(row));
  })

  /** POST /babies/:id/verify-code —— 校验访问暗号 */
  .post("/:id/verify-code", zValidator("json", accessCodeSchema), async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    const [row] = await db
      .select()
      .from(schema.babies)
      .where(eq(schema.babies.id, id))
      .limit(1)
      .all();
    if (!row) return c.json({ error: "未找到" }, 404);
    if (!row.accessCodeHash) return c.json({ error: "未设置暗号" }, 400);

    const body = c.req.valid("json");
    const ok = await verifyAccessCode(row.accessCodeHash, body.code);
    if (!ok) return c.json({ error: "暗号错误" }, 401);
    return c.json({ ok: true });
  })

  /** DELETE /babies/:id —— 删除宝宝（同时删除其所有记录） */
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);

    const db = createDb(c.env.DB);
    await db.delete(schema.babyLogs).where(eq(schema.babyLogs.babyId, id)).run();
    const [row] = await db
      .delete(schema.babies)
      .where(eq(schema.babies.id, id))
      .returning();
    if (!row) return c.json({ error: "未找到" }, 404);
    return c.json({ ok: true, id });
  });
