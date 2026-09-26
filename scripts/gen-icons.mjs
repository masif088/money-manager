// Generates PWA icons from an inline SVG. Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#0f766e"/>
  <g transform="translate(256 256) scale(${pad ? 0.72 : 1}) translate(-256 -256)">
    <rect x="96" y="150" width="320" height="220" rx="36" fill="#ffffff"/>
    <rect x="96" y="150" width="320" height="64" rx="32" fill="#d5efeb"/>
    <circle cx="352" cy="292" r="26" fill="#0f766e"/>
    <text x="178" y="318" font-family="Arial, sans-serif" font-weight="700" font-size="92" fill="#0f766e" text-anchor="middle">Rp</text>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const jobs = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/icon-maskable-512.png", 512, true],
  ["public/icons/apple-touch-icon.png", 180, true],
];
for (const [out, size, maskable] of jobs) {
  await sharp(Buffer.from(svg(maskable))).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}
