/**
 * Hono 运行环境类型。
 * Cloudflare Workers 通过 wrangler 绑定把 D1 注入到 env.DB。
 * D1Database 全局类型由 `wrangler types` 生成的 worker-configuration.d.ts 提供。
 */
export type AppEnv = {
  Bindings: {
    DB: D1Database;
  };
};
