// 生成 iOS「添加到主屏幕」启动图（白底 + 居中大号奶瓶，与 app 图标呼应）。运行：node scripts/gen-splash.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// 奶瓶路径与 gen-icons.mjs 一致，但去掉红底、瓶身改玫瑰红，刻度改白，以便印在白底上
function splashSvg(w, h) {
  const tx = (w - 512) / 2; // 水平居中
  const ty = Math.round(h * 0.3); // 偏上，给底部留白
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  <g transform="translate(${tx} ${ty})">
    <path d="M214 150 C214 96 298 96 298 150 Z" fill="#f43f5e"/>
    <rect x="200" y="138" width="112" height="44" rx="14" fill="#f43f5e"/>
    <rect x="174" y="180" width="164" height="248" rx="46" fill="#f43f5e"/>
    <rect x="192" y="272" width="128" height="108" rx="32" fill="#ffe4e7"/>
    <g stroke="#ffffff" stroke-width="14" stroke-linecap="round">
      <line x1="208" y1="306" x2="244" y2="306"/>
      <line x1="208" y1="352" x2="244" y2="352"/>
    </g>
  </g>
</svg>`;
}

await mkdir("public/icons", { recursive: true });

// 现代全面屏 iPhone 主流物理像素尺寸（portrait）
const sizes = [
  [1125, 2432], // iPhone X/XS/11 Pro & 12–15 mini
  [1170, 2532], // iPhone 12–15 (6.1")
  [1179, 2556], // iPhone 15/16 Pro (6.1")
  [1284, 2778], // iPhone Plus / Pro Max (6.7")
];

for (const [w, h] of sizes) {
  await sharp(Buffer.from(splashSvg(w, h))).png().toFile(`public/icons/apple-splash-${w}-${h}.png`);
}
console.log("✓ generated apple splash screens:", sizes.map(([w, h]) => `${w}x${h}`).join(", "));
