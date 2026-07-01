# 宝宝全记录 · Baby Tracker Edge

为「单手抱娃、严重缺觉」的新生儿父母设计的移动端优先记录看板：一键记录 **🍼 喂奶 / 🧻 换尿布 / 💤 睡眠**，秒级反馈，可编辑可删除。

部署在 Cloudflare：**单个 Worker**（Next.js 经 OpenNext + Hono API + D1）。

## 技术栈

- **前端**：Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn UI (base-nova) + Lucide
- **后端**：Hono（作为 `/api/[[...route]]` 路由处理器）+ `@hono/zod-validator`
- **数据库**：Cloudflare D1 + Drizzle ORM
- **部署**：`@opennextjs/cloudflare`（OpenNext 适配器，输出单个 Worker）
- **数据层**：SWR（乐观更新）+ Sonner（Toast）+ next-themes（暗黑模式）

## 本地开发

```bash
pnpm install
pnpm db:migrate:local   # 应用 D1 迁移到本地 .wrangler/state
pnpm dev                # next dev，经 OpenNext dev 代理提供 D1 绑定
```

打开 http://localhost:3000 。API 直接访问：`curl http://localhost:3000/api/stats/today?since=0`

> `next dev` 通过 `initOpenNextCloudflareForDev()` 自动把 `wrangler.jsonc` 中的 D1 绑定注入到 `getCloudflareContext()`。若想跑真实 Worker bundle，用 `pnpm preview`（OpenNext build + wrangler dev）。

## 部署到 Cloudflare

1. `npx wrangler login`
2. `npx wrangler d1 create baby-trace-db`，把返回的 `database_id` 填入 `wrangler.jsonc`
3. `pnpm db:migrate:remote`（在远端 D1 建表）
4. `pnpm deploy`（`opennextjs-cloudflare build && wrangler deploy`）

## 项目结构

```
app/
  (app)/            # 带底部导航的应用页（仪表盘 / 历史）
  api/[[...route]]/ # Hono 挂载点（getCloudflareContext → D1）
server/             # Hono app + Drizzle schema + routes(logs/stats/sleep)
components/         # dashboard / drawers / layout / ui(shadcn)
lib/                # api-client(hono/client) / hooks(SWR) / mutations(乐观) / activity / time
drizzle/            # 迁移 SQL（也是 wrangler migrations_dir）
```

## 数据模型

`baby_logs`：`activity_type`(feed/diaper/sleep) · `start_time` · `end_time`(睡眠进行中为 null) · `amount`(奶瓶=ml / 亲喂=分钟) · `details`(JSON: 喂养方式 / 尿布类型) · `notes` · `created_at`。

色彩约定：喂奶=rose、尿布=amber、睡眠=indigo（见 `lib/activity.ts`）。
