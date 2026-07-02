// 生成 iOS「添加到主屏幕」启动图：用 assets/splash-source.jpg 居中 cover 到各机型物理像素。运行：node scripts/gen-splash.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "assets/splash-source.jpg";

await mkdir("public/icons", { recursive: true });

// iOS 全面屏/经典机型物理像素尺寸（portrait）
const sizes = [
  [640, 1136], // iPhone 5/SE (320×568 @2)
  [750, 1334], // iPhone 6/7/8 (375×667 @2)
  [1125, 2436], // iPhone X/XS/11 Pro & 12–15 mini (375×812 @3)
  [1170, 2532], // iPhone 12–15 & 16 (390×844 @3)
  [1179, 2556], // iPhone 15 Pro / 16 (393×852 @3)
  [1206, 2622], // iPhone 16 Pro (402×869 @3)
  [1242, 2688], // iPhone XS Max / 11 Pro Max (414×896 @3)
  [1284, 2778], // iPhone 12–15 Plus / Pro Max (428×926 @3)
  [1290, 2796], // iPhone 16 Plus (430×932 @3)
  [1320, 2868], // iPhone 16 Pro Max (440×956 @3)
];

for (const [w, h] of sizes) {
  await sharp(SRC)
    .resize(w, h, { fit: "cover", position: "center" })
    .png()
    .toFile(`public/icons/splash-${w}x${h}.png`);
}
console.log("✓ generated apple splash screens from assets/splash-source.jpg:", sizes.map(([w, h]) => `${w}x${h}`).join(", "));
