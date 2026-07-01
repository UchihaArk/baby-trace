// 生成 PWA 图标（奶瓶图标，白底玫瑰红）。运行：node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#f43f5e"/>
  <g fill="#ffffff">
    <rect x="216" y="88" width="80" height="64" rx="22"/>
    <rect x="202" y="148" width="108" height="34" rx="12"/>
    <rect x="178" y="182" width="156" height="240" rx="44"/>
  </g>
  <g stroke="#f43f5e" stroke-width="16" stroke-linecap="round">
    <line x1="212" y1="250" x2="300" y2="250"/>
    <line x1="212" y1="302" x2="300" y2="302"/>
    <line x1="212" y1="354" x2="300" y2="354"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
const buf = Buffer.from(svg);
for (const s of [180, 192, 512]) {
  await sharp(buf).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
}
await sharp(buf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
console.log("✓ generated icons (180/192/512 + apple-touch-icon)");
