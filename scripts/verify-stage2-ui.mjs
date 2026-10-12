// Isolated presentation regression using REAL components and explicit mocked actions.
// Never logs in, loads environment credentials, or connects to a production backend.
// Run after npm run build with port 3001 free. All generated output is ignored.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { inspectThemeContrast } from './theme-contrast.mjs';

const require = createRequire(import.meta.url);
const webpackPackage = require('next/dist/compiled/webpack/webpack');
webpackPackage.init();
const { webpack } = webpackPackage;
const temp = resolve('supabase/.temp'), out = join(temp, 'stage2-ui');
await mkdir(out, { recursive: true });
const aliases = Object.fromEntries(['next/link$', 'next/navigation$', '@/app/account/payments/actions$', '@/app/atelier-actions$'].map(name => [name, resolve('scripts/stage2-ui/mocks.jsx')]));
await new Promise((resolveBuild, reject) => {
  const compiler = webpack({ mode: 'development', devtool: false, target: 'web', entry: resolve('scripts/stage2-ui/entry.jsx'), output: { path: out, filename: 'bundle.js' },
    resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'], alias: { ...aliases, '@': resolve('src') } },
    module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: resolve('scripts/stage2-ui/loader.cjs') }] },
    plugins: [new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') })],
  });
  compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors() ? reject(new Error(error?.message || stats.toString({ all: false, errors: true }))) : resolveBuild()));
});
const cssDirectory = resolve('.next/static/css');
const css = (await Promise.all((await readdir(cssDirectory)).filter(file => file.endsWith('.css')).map(file => readFile(join(cssDirectory, file), 'utf8')))).join('\n');
const fontClasses = [...css.matchAll(/\.([a-zA-Z0-9_]+)\{--font-(?:cinzel|sans):/g)].map(match => match[1]).join(' ');
assert.ok(fontClasses, 'Next font variable classes missing');
const fontDirectory = resolve('.next/static/media');
const fonts = new Map(await Promise.all((await readdir(fontDirectory)).filter(name=>name.endsWith('.woff2')).map(async name=>[name,await readFile(join(fontDirectory,name))])));
const bundle = await readFile(join(out, 'bundle.js'));
let browser, profile, server; const checks = [], errors = [], prohibitedRequests = [];
const pass = label => { checks.push(label); console.log('PASS', label); };
const base = 'http://localhost:3001';
const screenshots = [];
try {
  server = createServer(async (req, res) => {
    if (req.method !== 'GET') { prohibitedRequests.push(req.url); res.writeHead(405); res.end(); return; }
    if (/^\/_next\/static\/media\/[a-zA-Z0-9._-]+\.woff2$/.test(req.url)) { const font=fonts.get(req.url.split('/').at(-1));res.writeHead(font?200:404,{'content-type':'font/woff2'});res.end(font); }
    else if (req.url === '/bundle.js') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.end(bundle); }
    else if (req.url === '/styles.css') { res.setHeader('content-type', 'text/css; charset=utf-8'); res.end(css); }
    else { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html lang="en" class="${fontClasses}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>TCC isolated Stage 2 UI test</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`); }
  });
  await new Promise((ok, no) => { server.once('error', no); server.listen(3001, 'localhost', ok); });
  profile = await mkdtemp(join(temp, 'stage2-browser-'));
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: profile, args: ['--no-first-run', '--no-default-browser-check'] });
  const context = await browser.createBrowserContext();
  await context.overridePermissions(base, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', req => new URL(req.url()).origin === base ? req.continue() : req.abort());
  const button = async text => {
    const found = await page.evaluateHandle(label => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === label), text);
    assert.ok(await found.asElement(), `button missing: ${text}`); await found.asElement().click(); await found.dispose();
  };
  const has = async text => page.evaluate(t => document.body.innerText.includes(t), text);
  const waitText = async text => page.waitForFunction(t => document.body.innerText.toLowerCase().includes(t.toLowerCase()), {}, text);
  const load = async (mode, role, theme, width, extra = '') => {
    await page.setViewport({ width, height: 850 });
    await page.goto(`${base}/?mode=${mode}&role=${role}${extra}`, { waitUntil: 'networkidle0' });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.waitForFunction(() => Boolean(window.stage2) && !document.querySelector('form[inert]'));
  };
  const fits = async () => {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('main,section,ol')].every(n => n.scrollWidth <= n.clientWidth + 1)), 'horizontal overflow');
    await page.waitForFunction(() => document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).every(a => a.playState !== 'running'));
    const contrast = await page.evaluate(inspectThemeContrast);
    assert.deepEqual(contrast.failures, [], 'Rendered fixture text contrast');
  };
  const capture = async name => { const file = join(temp, `stage2-${name}.png`); await page.screenshot({ path: file, fullPage: true }); screenshots.push(file); };

  for (const theme of ['dark', 'light']) for (const width of [390, 768, 1440]) {
    await load('theme', 'ceo', theme, width);
    await fits();
    for (const variant of ['primary','secondary','outline','champagne','ghost']) {
      await page.hover(`[data-variant="${variant}"]`);
      await fits();
    }
    await page.focus('input[type="date"]');
    assert.ok(await page.$eval('input[type="date"]', n => getComputedStyle(n).outlineStyle === 'solid' && parseFloat(getComputedStyle(n).outlineWidth) >= 2));
    assert.ok(await page.$('button:disabled'));
    await capture(`controls-${theme}-${width}`);
    await button('Open confirmation'); await page.waitForSelector('dialog[open]');
    await fits(); await page.keyboard.press('Escape');
    assert.equal(await page.$('dialog[open]'), null);
    pass(`Theme button hover, disabled state, input focus, status badges, timeline and confirmation ${theme}/${width}`);
  }

  for (const theme of (process.argv.includes('--edges-only') ? [] : ['dark', 'light'])) for (const width of [390, 768, 1440]) {
    const suffix = `${theme}/${width}`;
    await load('bank', 'ceo', theme, width);
    assert.equal(await page.$('input[name="bankName"]'), null);
    if (width === 390) await capture(`bank-${theme}`);
    await button('Edit');
    await page.waitForSelector('input[name="bankName"]');
    assert.equal(await page.$eval('input[name="bankName"]', el => el.value), 'Fixture Bank — no transfers');
    await page.waitForFunction(() => document.activeElement.name === 'bankName');
    await page.$eval('input[name="bankName"]', el => { el.value = 'Discarded edit'; });
    await button('Cancel');
    assert.equal(await page.evaluate(() => window.stage2.bankCalls.length), 0);
    assert.ok(await has('Fixture Bank — no transfers'));
    await page.waitForFunction(() => document.activeElement.textContent === 'Edit');
    await button('Edit');
    await page.$eval('input[name="bankName"]', el => { el.value = 'Persisted Fixture Bank'; });
    await page.evaluate(() => { window.stage2.failBank = true; });
    await button('Save Changes'); await page.waitForSelector('dialog[open]');
    // Native dialogs may cycle through browser chrome (document.body); never into the underlying form.
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement === document.body || document.querySelector('dialog').contains(document.activeElement))); }
    await button('Confirm'); await waitText('Test persistence failure');
    assert.ok(await page.$('input[name="bankName"]'));
    assert.equal(await page.evaluate(() => window.stage2.bank.bank_name), 'Fixture Bank — no transfers');
    await page.evaluate(() => { window.stage2.failBank = false; });
    await button('Save Changes'); await button('Confirm'); await waitText('Official bank details saved.');
    assert.equal(await page.$('input[name="bankName"]'), null);
    assert.ok(await has('Persisted Fixture Bank'));
    assert.ok(await page.evaluate(() => window.stage2.bankCalls.length === 2 && window.stage2.bankCalls[0].operationKey === window.stage2.bankCalls[1].operationKey));
    await fits(); pass(`CEO card, prefill, cancel/no-write, focus, persistence failure/retry/success ${suffix}`);

    await load('bank', 'admin', theme, width);
    assert.ok(await has('Only the CEO')); assert.equal(await page.$('input'), null);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Edit')), false);
    await fits(); pass(`Admin bank card read-only ${suffix}`);

    await load('payment', 'client', theme, width);
    assert.ok(await has('Historical Snapshot Bank')); assert.equal(await has('Fixture Bank — no transfers'), false);
    await button('Copy Account Number'); await waitText('Account number copied.');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '0012345678');
    assert.ok(await has('Order outstanding balance')); assert.ok(await has('Requested amount'));
    await fits(); if (width === 1440) await capture(`payment-${theme}`);
    pass(`Client transfer card, exact leading-zero copy and historical snapshot ${suffix}`);

    for (const role of ['client', 'admin', 'ceo']) {
      await load('chat', role, theme, width);
      const geometry = await page.evaluate(() => {
        const left = document.querySelector('[data-sender="customer"]').getBoundingClientRect();
        const right = document.querySelector('[data-sender="concierge"]').getBoundingClientRect();
        const region = document.querySelector('[aria-label="Conversation history"]');
        const composer = document.querySelector('form').getBoundingClientRect();
        const refresh = [...document.querySelectorAll('button')].find(b => b.textContent === 'Refresh messages').getBoundingClientRect();
        const surface = node => {
          const rgba = getComputedStyle(node).backgroundColor.match(/[\d.]+/g).map(Number);
          const alpha = rgba[3] ?? 1;
          const below = alpha < 1 && node.parentElement ? surface(node.parentElement) : [0,0,0];
          return rgba.slice(0,3).map((value,index)=>value*alpha+below[index]*(1-alpha));
        };
        const client = surface(document.querySelector('[data-sender="customer"]'));
        const concierge = surface(document.querySelector('[data-sender="concierge"]'));
        return { colourDifference: Math.hypot(...client.map((value,index)=>value-concierge[index])), left: left.left, right: right.right, end: region.getBoundingClientRect().right, start: region.getBoundingClientRect().left, nearBottom: region.scrollHeight - region.scrollTop - region.clientHeight < 5, composer: composer.bottom, refresh: refresh.top };
      });
      assert.ok(geometry.colourDifference >= 15, 'Sender bubbles must remain visually distinct in both themes');
      assert.ok(geometry.left < geometry.right && Math.abs(geometry.left - geometry.start) < 8 && Math.abs(geometry.right - geometry.end) < 12);
      assert.ok(geometry.nearBottom && geometry.refresh >= geometry.composer);
      assert.equal(await has('PRIVATE_STAFF_IDENTITY'), false);
      assert.equal(await page.evaluate(() => Boolean(window.unsafe)), false);
      await page.$eval('[aria-label="Conversation history"]', el => { el.scrollTop = 0; el.dispatchEvent(new Event('scroll', { bubbles: true })); });
      await page.evaluate(() => window.stage2.addMessage('concierge', 'Incoming test reply'));
      await button('Refresh messages'); await waitText('Incoming test reply'); await waitText('New messages below');
      assert.equal(await page.$eval('[aria-label="Conversation history"]', el => el.scrollTop), 0);
      await button('New messages below — view latest');
      await page.type('textarea[name="message"]', 'Sent test reply'); await button('Send reply'); await waitText('Sent test reply');
      await page.waitForFunction(() => document.querySelectorAll('[data-sender]').length === 42);
      assert.equal(await page.$eval('textarea[name="message"]', el => el.value), '');
      assert.ok(await page.$eval('[aria-label="Conversation history"]', el => el.scrollHeight - el.scrollTop - el.clientHeight < 5));
      await fits(); if (role === 'client' && width === 390) await capture(`chat-${theme}`);
      pass(`Concierge sides/privacy/escaped text/scroll preservation/send/composer-refresh ${role} ${suffix}`);
    }
    await load('appointments', 'client', theme, width);
    assert.ok(await has('Preferred Date & Time')); assert.ok(await has('Confirmed Date & Time'));
    assert.ok(await has('Reschedule Request submitted')); assert.ok(await has('WAT'));
    assert.equal(await has('PRIVATE_NOTE_MUST_NOT_RENDER'), false);
    await fits(); if (width === 768) await capture(`appointments-${theme}`);
    pass(`Appointment semantics, no raw JSON/private notes ${suffix}`);
  }
  await load('bank', 'ceo', 'light', 390, '&setup=1');
  assert.ok(await has('Setup incomplete')); await button('Set up bank account'); await button('Cancel');
  assert.equal(await page.evaluate(() => window.stage2.bankCalls.length), 0); pass('Unconfigured bank has explicit setup and no cancel write');
  await load('payment', 'client', 'light', 390);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } }); });
  await button('Copy Account Number'); await waitText('Copy is unavailable'); pass('Clipboard denial offers truthful manual-copy feedback');
  await load('chat', 'client', 'light', 390);
  await page.evaluate(() => { window.stage2.holdLoad = true; });
  await button('Refresh messages');
  await page.waitForFunction(() => Boolean(window.stage2.releaseLoad));
  await page.type('textarea[name="message"]', 'Reply during refresh'); await button('Send reply');
  await page.waitForFunction(() => window.stage2.messages.length === 41);
  await page.evaluate(() => { window.stage2.holdLoad = false; window.stage2.releaseLoad(); });
  await page.waitForFunction(() => document.querySelectorAll('[data-sender]').length === 41);
  assert.ok(await has('Reply during refresh')); pass('Send during an in-flight refresh queues a contiguous follow-up');
  await page.evaluate(() => { for (let i=0;i<80;i++) window.stage2.addMessage('concierge', `Next page ${i}`); });
  await button('Refresh messages'); await waitText('Load next messages');
  assert.equal(await page.$$eval('[data-sender]', nodes => nodes.length), 91);
  assert.ok(await page.evaluate(() => Math.max(...window.stage2.readCalls) <= 91));
  await button('Load next messages');
  await page.waitForFunction(() => document.querySelectorAll('[data-sender]').length === 121);
  pass('History pagination never skips a prefix or acknowledges an unloaded page');
  await page.evaluate(() => { window.stage2.failLoad = true; });
  await button('Refresh messages'); await waitText('Test message refresh failure');
  assert.equal(await page.$$eval('[data-sender]', nodes => nodes.length), 121);
  await page.evaluate(() => { window.stage2.failLoad = false; window.stage2.failRead = true; window.stage2.addMessage('concierge','Read-status retry fixture'); });
  await button('Refresh messages'); await waitText('Read status could not be saved');
  await page.evaluate(() => { window.stage2.failRead = false; }); await button('Retry read status');
  await page.waitForFunction(() => !document.body.innerText.includes('Read status could not be saved'));
  pass('Message refresh/read-status errors preserve history and offer working retry');
  assert.deepEqual(errors, []); assert.deepEqual(prohibitedRequests, []);
  pass('No uncaught browser errors or backend writes');
  await writeFile(join(temp, 'stage2-ui-proof.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks, screenshots, backend: 'mocked only', productionWrites: 0 }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, screenshots: screenshots.length, productionWrites: 0 }));
} catch (error) {
  // This harness contains only local synthetic data, never authentication or real bank values.
  const pages = browser ? await browser.pages() : [];
  const page = pages.at(-1);
  if (page) console.error('Fixture diagnostic', await page.evaluate(() => ({ loaded: document.querySelectorAll('[data-sender]').length, available: window.stage2?.messages.length, loads: window.stage2?.loadCalls, buttons: [...document.querySelectorAll('button')].map(b => ({ text:b.textContent, disabled:b.disabled })), alerts:[...document.querySelectorAll('[role="alert"]')].map(n=>n.textContent) })).catch(() => null));
  throw error;
} finally {
  await browser?.close();
  await new Promise(ok => server?.close(ok) ?? ok());
  if (profile && relative(temp, profile).startsWith('stage2-browser-') && !relative(temp, profile).includes('..')) await rm(profile, { recursive: true, force: true });
}
