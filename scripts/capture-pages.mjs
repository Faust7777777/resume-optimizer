import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const routes = ['/', '/analytics', '/diagnosis', '/editor', '/experience', '/interview', '/settings', '/templates'];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(process.cwd(), 'screenshots', `pages-${stamp}`);

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();

const results = [];

for (const route of routes) {
  const safeName = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[\/\\]/g, '_');
  const url = `${baseUrl}${route}`;
  const filePath = path.join(outDir, `${safeName}.png`);

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: filePath, fullPage: true });
    results.push({ route, status: response?.status() ?? 0, file: filePath, ok: true });
  } catch (error) {
    results.push({ route, status: 0, file: filePath, ok: false, error: String(error) });
  }
}

await browser.close();

const reportPath = path.join(outDir, 'report.json');
fs.writeFileSync(reportPath, JSON.stringify({ baseUrl, outDir, results }, null, 2), 'utf8');

console.log(JSON.stringify({ outDir, reportPath, results }, null, 2));
