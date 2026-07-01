// 生成 PWA 图标（奶瓶图标，白底玫瑰红）。运行：node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#f43f5e"/>
  <g>
    <path d="M214 150 C214 96 298 96 298 150 Z" fill="#ffffff"/>
    <rect x="200" y="138" width="112" height="44" rx="14" fill="#ffffff"/>
    <rect x="174" y="180" width="164" height="248" rx="46" fill="#ffffff"/>
    <rect x="192" y="272" width="128" height="108" rx="32" fill="#ffe4e7"/>
    <g stroke="#f43f5e" stroke-width="14" stroke-linecap="round">
      <line x1="208" y1="306" x2="244" y2="306"/>
      <line x1="208" y1="352" x2="244" y2="352"/>
    </g>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
const buf = Buffer.from(svg);
for (const s of [180, 192, 512]) {
  await sharp(buf).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
}
await sharp(buf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
console.log("✓ generated icons (180/192/512 + apple-touch-icon)");
