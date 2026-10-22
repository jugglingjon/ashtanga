// Renders the PNG app icons from public/icons/icon.svg. Run once after changing the SVG:
//   node scripts/make-icons.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');
// Square, full-bleed version for iOS and maskable icons (the OS applies its own mask).
const square = svg.replaceAll('rx="112"', 'rx="0"');
const maskable = square.replace(/<circle[\s\S]*<\/g>/, (m) => `<g transform="translate(51.2 51.2) scale(.8)">${m}</g>`);

const targets = [
  ['icon-192.png', svg, 192],
  ['icon-512.png', svg, 512],
  ['icon-maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', square, 180]
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
for (const [name, markup, size] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const data = Buffer.from(markup).toString('base64');
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style><img src="data:image/svg+xml;base64,${data}" width="${size}" height="${size}">`
  );
  await page.screenshot({ path: join(dir, name), omitBackground: true });
  console.log('wrote', name);
}
await browser.close();
