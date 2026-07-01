import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 使用官方助手生成完整且合法的 OpenNext 配置，
// 仅把缓存/队列改为不依赖 R2 的 dummy/direct 实现（适合免费档与本地）。
const config = defineCloudflareConfig({
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "direct",
});

export default config;
