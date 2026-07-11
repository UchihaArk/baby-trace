import { Hono } from "hono";
import { logger } from "hono/logger";
import type { AppEnv } from "./env";
import { babiesRoutes } from "./routes/babies";
import { logsRoutes } from "./routes/logs";
import { measurementsRoutes } from "./routes/measurements";
import { statsRoutes } from "./routes/stats";
import { sleepRoutes } from "./routes/sleep";

const app = new Hono<AppEnv>()
  .use("*", logger())
  .route("/babies", babiesRoutes)
  .route("/logs", logsRoutes)
  .route("/measurements", measurementsRoutes)
  .route("/stats", statsRoutes)
  .route("/sleep", sleepRoutes);

app
  .onError((err, c) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return c.json({ error: message }, 500);
  })
  .notFound((c) => c.json({ error: "Not found" }, 404));

export type AppType = typeof app;
export default app;
