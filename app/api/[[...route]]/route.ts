import { getCloudflareContext } from "@opennextjs/cloudflare";
import app from "@/server/app";

/**
 * Hono 挂载点：所有 /api/* 请求交给 Hono。
 * - D1 绑定通过 OpenNext 的 getCloudflareContext 注入到 Hono 的 c.env.DB。
 * - 去掉 /api 前缀，使 Hono 内部路由（/logs、/stats、/sleep）能正确匹配。
 * - `{ async: true }` 在本地 next dev 与线上 Worker 环境下都安全可用。
 */
async function handler(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const stripped = new URL(url.pathname.replace(/^\/api/, "") || "/", url.origin);
  stripped.search = url.search;
  return app.fetch(new Request(stripped, req), env);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
