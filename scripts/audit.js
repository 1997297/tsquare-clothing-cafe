const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('C:\\Users\\Young Duke\\.gemini\\antigravity\\brain\\50604378-fb3c-47c3-94e8-e306c69a4b73\\audit');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const routes = [
  { name: 'home', path: '/' },
  { name: 'collections', path: '/collections' },
  { name: 'style_detail', path: '/styles/tsq-agbada-024-imperial-grand-agbada' },
  { name: 'bespoke_configurator', path: '/bespoke/create/tsq-agbada-024-imperial-grand-agbada' },
  { name: 'signin', path: '/auth/sign-in' },
  { name: 'account_dashboard', path: '/account' },
  { name: 'account_payments', path: '/account/payments' },
  { name: 'account_wardrobe', path: '/account/wardrobe' },
  { name: 'account_appointments', path: '/account/appointments' },
  { name: 'account_concierge', path: '/account/concierge' },
  { name: 'account_measurements', path: '/account/measurements' },
];

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const route of routes) {
    for (const theme of ['dark', 'light']) {
      try {
        await page.goto(`http://localhost:3001${route.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.evaluate((t) => {
          localStorage.setItem('tcc-theme', t);
          document.documentElement.dataset.theme = t;
          document.documentElement.style.colorScheme = t;
        }, theme);
        await new Promise((r) => setTimeout(r, 600)); // wait for transitions
        const filename = path.join(outDir, `${route.name}_${theme}.png`);
        await page.screenshot({ path: filename, fullPage: false });
        console.log(`Saved: ${filename}`);
      } catch (err) {
        console.error(`Error on ${route.name} (${theme}):`, err.message);
      }
    }
  }

  // Also capture mobile viewport for homepage and dashboard
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  for (const route of [routes[0], routes[5]]) {
    for (const theme of ['dark', 'light']) {
      try {
        await page.goto(`http://localhost:3001${route.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.evaluate((t) => {
          localStorage.setItem('tcc-theme', t);
          document.documentElement.dataset.theme = t;
          document.documentElement.style.colorScheme = t;
        }, theme);
        await new Promise((r) => setTimeout(r, 600));
        const filename = path.join(outDir, `${route.name}_mobile_${theme}.png`);
        await page.screenshot({ path: filename, fullPage: false });
        console.log(`Saved mobile: ${filename}`);
      } catch (err) {
        console.error(`Error on mobile ${route.name} (${theme}):`, err.message);
      }
    }
  }

  await browser.close();
  console.log('Capture complete!');
}

capture().catch((e) => {
  console.error('Fatal capture error:', e);
  process.exit(1);
});
