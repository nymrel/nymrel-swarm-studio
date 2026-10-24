// Optional local browser review. Tools stay outside the application dependencies.
// See docs/income-registry-evidence-verification.md for invocation and limitations.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const { chromium } = await import(process.env.INCOME_PLAYWRIGHT_MODULE ?? 'playwright');
const baseURL = process.env.INCOME_REVIEW_URL ?? 'http://127.0.0.1:4275/';
assert.equal(new URL(baseURL).hostname, '127.0.0.1', 'Review only the local preview');
const output = path.resolve('docs/evidence/income-registry-evidence');
await mkdir(output, { recursive: true });
const server = process.env.INCOME_USE_EXISTING_PREVIEW ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--port', new URL(baseURL).port], { stdio: 'ignore' });
let ready = false;
for (let attempt = 0; attempt < 50; attempt += 1) {
  try { ready = (await fetch(baseURL)).ok; } catch { /* preview is starting */ }
  if (ready) break;
  await new Promise(resolve => setTimeout(resolve, 100));
}
if (!ready) { server?.kill(); throw new Error('Local preview did not start'); }
const launchOptions = {
  headless: true,
  ...(process.env.INCOME_BROWSER_PATH ? { executablePath: process.env.INCOME_BROWSER_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process'],
};
let browser;
let browserVersion;
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }, { width: 320, height: 844 }]) {
    browser = await chromium.launch(launchOptions);
    browserVersion = await browser.version();
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const external = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === new URL(baseURL).origin) return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Income Registry', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '16 of 16' }).waitFor();
    assert.equal(await page.locator('.income-opportunity').count(), 16);
    await page.getByRole('searchbox', { name: 'Search opportunities' }).fill('  MCP  ');
    assert.equal(await page.locator('.income-opportunity').count(), 3);
    await page.getByRole('searchbox').fill('');
    await page.getByLabel('Decision lane').selectOption('Recurring foundation');
    assert.equal(await page.locator('.income-opportunity').count(), 3);
    await page.getByRole('searchbox').fill('no such product');
    await page.getByRole('button', { name: 'Reset filters' }).click();
    assert.equal(await page.locator('.income-opportunity').count(), 16);
    const summary = page.locator('#income-services summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await page.locator('#income-services details[open]').waitFor();
    assert.match(await page.locator('#income-services details').innerText(), /Payment: unknown/);
    await page.locator('#income-services .income-source-link').first().click();
    assert.match(await page.evaluate(() => location.hash), /^#income-source-/);
    await summary.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page must not overflow');
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await page.screenshot({ path: path.join(output, `evidence-${viewport.width}.png`) });
    await page.locator('#income-website-intelligence').screenshot({ path: path.join(output, `assessment-${viewport.width}.png`) });

    const axeResults = [];
    if (process.env.INCOME_AXE_PATH) {
      await page.addScriptTag({ content: await readFile(process.env.INCOME_AXE_PATH, 'utf8') });
      for (const view of ['snapshot', 'expanded']) {
        if (view === 'expanded') await summary.click();
        const audit = await page.evaluate(() => window.axe.run(document));
        axeResults.push({ view, violations: audit.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })) });
      }
    }

    await page.getByRole('button', { name: 'Original illustrative examples' }).click();
    assert.equal(await page.locator('.registry-table tbody tr').count(), 5);
    assert.deepEqual(await page.locator('.registry-score').allTextContents(), ['44', '44', '44', '37', '45']);
    const region = page.getByRole('region', { name: /Portfolio map/ });
    await region.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await region.evaluate(element => element === document.activeElement), true);
    assert.notEqual(await region.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
    const start = await region.evaluate(element => element.scrollLeft);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => !document.querySelector('.registry-table-wrap') ||
      document.querySelector('.registry-table-wrap').scrollWidth <= document.querySelector('.registry-table-wrap').clientWidth ||
      document.querySelector('.registry-table-wrap').scrollLeft > 0);
    const scroll = await region.evaluate(element => ({ left: element.scrollLeft, width: element.clientWidth, content: element.scrollWidth }));
    if (scroll.content > scroll.width) assert.ok(scroll.left > start, 'Arrow key must scroll the example table');
    if (process.env.INCOME_AXE_PATH) {
      const audit = await page.evaluate(() => window.axe.run(document));
      axeResults.push({ view: 'examples', violations: audit.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })) });
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
      JSON.stringify(await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
        wide: [...document.querySelectorAll('*')].filter(node => node.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(node => ({ tag: node.tagName, className: node.className, width: node.getBoundingClientRect().width })) }))));
    await page.getByRole('button', { name: 'Evidence snapshot', exact: true }).click();
    await page.getByRole('searchbox').focus();
    assert.notEqual(await page.getByRole('searchbox').evaluate(element => getComputedStyle(element).outlineStyle), 'none');
    await page.locator('.income-registry').evaluate(element => {
      const nodes = [...element.querySelectorAll('*')];
      const sizes = nodes.map(node => Number.parseFloat(getComputedStyle(node).fontSize));
      nodes.forEach((node, index) => { node.style.fontSize = `${sizes[index] * 2}px`; });
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
      JSON.stringify(await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
        wide: [...document.querySelectorAll('*')].filter(node => node.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(node => ({ tag: node.tagName, className: node.className, width: node.getBoundingClientRect().width, text: node.textContent.slice(0, 50) })) }))));
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    results.push({ viewport, errors, externalRequests: external, exampleScroll: scroll, axe: axeResults });
    await context.close();
    await browser.close();
  }
  await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ browser: browserVersion, results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  assert.equal(results.flatMap(result => result.axe.flatMap(audit => audit.violations)).length, 0, 'Review accessibility findings');
} finally {
  await browser?.close();
  server?.kill();
}
