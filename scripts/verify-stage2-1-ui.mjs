// Real components; synthetic data only. No auth, environment or backend access.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { inspectThemeContrast } from './theme-contrast.mjs';
const require = createRequire(import.meta.url), pkg = require('next/dist/compiled/webpack/webpack');
pkg.init(); const { webpack } = pkg;
const temp = resolve('supabase/.temp'), out = join(temp, 'stage21-ui');
await mkdir(out, { recursive: true });
await new Promise((ok, no) => {
  const compiler = webpack({ mode: 'development', devtool: false, target: 'web', entry: resolve('scripts/stage2-1-ui/entry.jsx'), output: { path: out, filename: 'bundle.js' },
    resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'], alias: { 'next/link$': resolve('scripts/stage2-1-ui/mocks.jsx'), 'next/navigation$': resolve('scripts/stage2-1-ui/mocks.jsx'), '@/app/account/payments/actions$': resolve('scripts/stage2-1-ui/mocks.jsx'), '@': resolve('src') } },
    module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: resolve('scripts/stage2-ui/loader.cjs') }] },
    plugins: [new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') })] });
  compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors() ? no(new Error(error?.message || stats.toString({ all: false, errors: true }))) : ok()));
});
const css = (await Promise.all((await readdir('.next/static/css')).filter(f => f.endsWith('.css')).map(f => readFile(join('.next/static/css', f), 'utf8')))).join('\n');
const classes = [...css.matchAll(/\.([a-zA-Z0-9_]+)\{--font-(?:cinzel|sans):/g)].map(m => m[1]).join(' ');
const fonts = new Map(await Promise.all((await readdir('.next/static/media')).filter(f => f.endsWith('.woff2')).map(async f => [f, await readFile(join('.next/static/media', f))])));
const bundle = await readFile(join(out, 'bundle.js')), base = 'http://localhost:3001';
let server, browser, profile, passed = 0; const errors = [], writes = [];
try {
  server = createServer((req, res) => {
    if (req.method !== 'GET') { writes.push(req.method); res.writeHead(405).end(); return; }
    if (/^\/_next\/static\/media\/[\w.-]+\.woff2$/.test(req.url)) { res.setHeader('content-type', 'font/woff2'); res.end(fonts.get(req.url.split('/').at(-1))); }
    else if (req.url === '/styles.css') { res.setHeader('content-type', 'text/css'); res.end(css); }
    else if (req.url === '/bundle.js') { res.setHeader('content-type', 'application/javascript'); res.end(bundle); }
    else { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html lang="en" class="${classes}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`); }
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(3001, 'localhost', ok); });
  profile = await mkdtemp(join(temp, 'stage21-browser-'));
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: profile });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', req => new URL(req.url()).origin === base ? req.continue() : req.abort());
  const load = async (role, theme, width, suffix = '') => {
    await page.setViewport({ width, height: 900 });
    await page.goto(`${base}/?role=${role}${suffix}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.waitForSelector('.payment-panel');
    await page.evaluate(() => document.fonts.ready);
    // Theme surfaces use CSS transitions; inspect their settled, painted colours.
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
  };
  for (const theme of ['dark', 'light']) for (const width of [390, 768, 1440]) for (const role of ['admin', 'ceo']) {
    await load(role, theme, width);
    const result = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.payment-panel a[href*="/payments/"]')];
      const shortcuts = [...document.querySelectorAll('nav[aria-label="Quick actions"] a')];
      const badges = shortcuts.filter(n => n.querySelector('.staff-attention-badge'));
      return { ids: cards.map(n => n.getAttribute('href')), highlighted: cards.filter(n => n.classList.contains('payment-needs-verification')).length,
        labels: cards.filter(n => n.classList.contains('payment-needs-verification')).map(n => n.innerText),
        badgeTexts: badges.map(n => n.querySelector('.staff-attention-badge').textContent),
        noOverlap: badges.every(n => n.children[0].getBoundingClientRect().right <= n.children[1].getBoundingClientRect().left - 2),
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        unavailable: shortcuts.find(n => n.getAttribute('href').includes('concierge')).textContent.includes('Count unavailable'),
        requestRows: document.querySelectorAll('a[href^="/admin/requests/request-"]').length,
        orderRows: document.querySelectorAll('a[href^="/admin/orders/order-"]').length,
      };
    });
    assert.deepEqual(result.ids, ['/admin/payments/pending#review-first', '/admin/payments/multiple#review-second', '/admin/payments/unpaid', '/admin/payments/cancelled']);
    assert.equal(result.highlighted, 2); assert.ok(result.labels[1].includes('2 pending submissions'));
    assert.deepEqual(result.badgeTexts, ['2', '3', '99+']);
    assert.ok(result.noOverlap && result.noOverflow && result.unavailable);
    assert.equal(result.requestRows, 3); assert.equal(result.orderRows, 2);
    assert.deepEqual((await page.evaluate(inspectThemeContrast)).failures, [], 'Rendered staff attention contrast');
    // Browser computes actual theme colours; badge and non-colour label stay readable.
    const contrast = await page.evaluate(() => {
      const ratio = (a, b) => { const lum = s => { const c = s.match(/[\d.]+/g).slice(0,3).map(Number).map(v => v/255).map(v => v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; }; const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
      const badge = getComputedStyle(document.querySelector('.staff-attention-badge'));
      const label = getComputedStyle(document.querySelector('.payment-verification-label'));
      const card = getComputedStyle(document.querySelector('.payment-needs-verification'));
      return [ratio(badge.color,badge.backgroundColor),ratio(label.color,card.backgroundColor)];
    });
    assert.ok(contrast.every(n => n >= 4.5), `Settled contrast ratios: ${contrast.join(', ')}`);
    await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
    if (role === 'admin') await page.screenshot({ path: join(temp, `stage21-${theme}-${width}.png`), fullPage: true });
    await page.click('a[href="/admin/payments/pending#review-first"]');
    await page.waitForSelector('#review-first h3');
    assert.equal(await page.$eval('#review-first h3',n=>n.textContent),'Review pending evidence');
    assert.equal(new URL(page.url()).hash,'#review-first');
    await load(role, theme, width);
    // Simulated server snapshot after verify/reject; no financial actions executed.
    await page.evaluate(() => { window.stage21.workspace.submissions = window.stage21.workspace.submissions.map((s,i) => ({ ...s, status: i % 2 ? 'verified' : 'rejected' })); });
    await page.evaluate(() => [...document.querySelectorAll('button')].find(n => n.textContent === 'Refresh counts').click());
    await page.waitForFunction(() => !document.querySelector('.payment-needs-verification'));
    assert.equal(await page.$eval('a[href="/admin/payments?status=pending"]', n => n.getAttribute('aria-label')), 'Verify payments — 0 items need attention');
    assert.equal(await page.$('a[href="/admin/payments?status=pending"] .staff-attention-badge'), null);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(await page.evaluate(() => window.stage21.refreshes), 2);
    await load(role, theme, width, '&status=pending');
    assert.equal(await page.$$eval('.payment-panel a[href*="/payments/"]', n => n.length), 2);
    passed++; console.log(`PASS ${role} ${theme} ${width}: priority, counts, filters, refresh, accessibility, contrast`);
  }
  for (const theme of ['dark', 'light']) for (const width of [390,768,1440]) {
    await load('client', theme, width);
    assert.equal(await page.$('[aria-label="Quick actions"]'), null);
    assert.equal(await page.$('.payment-needs-verification'), null);
    assert.equal(await page.$eval('.payment-panel a', n => n.getAttribute('href')), '/account/payments/unpaid');
    passed++;
  }
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  console.log(JSON.stringify({ passed, browserErrors: errors.length, backendWrites: writes.length, backend: 'synthetic only' }));
} finally {
  await browser?.close();
  await new Promise(ok => server?.close(ok) ?? ok());
  if (profile && relative(temp, profile).startsWith('stage21-browser-') && !relative(temp, profile).includes('..')) await rm(profile, { recursive: true, force: true });
}
