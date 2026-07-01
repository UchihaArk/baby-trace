import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 在本地 `next dev` 时为路由提供 Cloudflare 绑定（D1 等）。
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // 禁用 Next 自带图片优化（Cloudflare Workers 环境无需 sharp）。
  images: { unoptimized: true },
};

export default nextConfig;
