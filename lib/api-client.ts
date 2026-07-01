import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/** 端到端类型化的 API 客户端（基于 Hono 路由定义自动推导类型）。 */
export const api = hc<AppType>("/api");
