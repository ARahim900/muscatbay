// scripts/screenshots.ts — `pnpm screenshots`
// Captures the ten pages at 1440x900 in light and dark into ./screenshots.
// Requires: pnpm add -D playwright && npx playwright install chromium
// Add to package.json:  "screenshots": "tsx scripts/screenshots.ts"
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.APP_URL ?? 'http://localhost:3000';
const PAGES = ['/', '/water', '/electricity', '/stp', '/contractors', '/hvac', '/assets', '/pest-control', '/firefighting', '/settings'];

mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: process.env.STORAGE_STATE });

for (const theme of ['light', 'dark'] as const) {
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.evaluate(t => { document.documentElement.className = t; }, theme);
    await page.waitForTimeout(500);
    const name = (path === '/' ? 'dashboard' : path.slice(1).replace(/\//g, '-')) + `-${theme}.png`;
    await page.screenshot({ path: `screenshots/${name}`, fullPage: true });
    console.log('saved', name);
  }
}
await browser.close();
