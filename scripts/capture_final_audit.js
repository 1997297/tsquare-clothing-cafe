const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\Young Duke\\.gemini\\antigravity\\brain\\50604378-fb3c-47c3-94e8-e306c69a4b73\\audit';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
  { name: 'home', url: 'http://localhost:3000' },
  { name: 'collections', url: 'http://localhost:3000/collections' },
  { name: 'style_detail', url: 'http://localhost:3000/styles/tsq-agbada-024-imperial-grand-agbada' },
  { name: 'bespoke_configurator', url: 'http://localhost:3000/bespoke/create/tsq-agbada-024-imperial-grand-agbada' },
  { name: 'book_fitting', url: 'http://localhost:3000/book-a-fitting' },
  { name: 'dashboard', url: 'http://localhost:3000/account' },
  { name: 'concierge', url: 'http://localhost:3000/account/concierge' },
  { name: 'payments', url: 'http://localhost:3000/account/payments' },
];

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Pre-seed localStorage with authenticated demo user so account views render logged-in
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const demoProfile = {
      id: "client-default",
      firstName: "Adeyemi",
      lastName: "Alabi",
      email: "client@tsquare.com",
      phone: "+2348012345678",
      preferredContact: "whatsapp",
      createdAt: "2026-09-01T10:00:00Z"
    };
    localStorage.setItem("tcc_explicit_demo_client_v1", JSON.stringify(demoProfile));
    localStorage.setItem("tcc_account_user", JSON.stringify(demoProfile));
    localStorage.setItem("tcc_auth_session", JSON.stringify({ user: demoProfile }));
  });

  for (const p of PAGES) {
    console.log(`Navigating to ${p.name} at ${p.url}...`);
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise(r => setTimeout(r, 2000));

      // Capture Light Theme
      await page.evaluate(() => {
        const demoProfile = {
          id: "client-default",
          firstName: "Adeyemi",
          lastName: "Alabi",
          email: "client@tsquare.com",
          phone: "+2348012345678",
          preferredContact: "whatsapp",
          createdAt: "2026-09-01T10:00:00Z"
        };
        localStorage.setItem("tcc_explicit_demo_client_v1", JSON.stringify(demoProfile));
        localStorage.setItem("tcc_account_user", JSON.stringify(demoProfile));
        localStorage.setItem("tcc_auth_session", JSON.stringify({ user: demoProfile }));
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      });
      await new Promise(r => setTimeout(r, 600));
      const lightPath = path.join(OUT_DIR, `${p.name}_light_repaired.png`);
      await page.screenshot({ path: lightPath, fullPage: false });
      console.log(`Saved ${lightPath}`);

      // Capture Dark Theme for comparison
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await new Promise(r => setTimeout(r, 600));
      const darkPath = path.join(OUT_DIR, `${p.name}_dark_repaired.png`);
      await page.screenshot({ path: darkPath, fullPage: false });
      console.log(`Saved ${darkPath}`);
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  // Also capture mobile view for home and dashboard in light mode
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  for (const name of ['home', 'dashboard']) {
    const p = PAGES.find(item => item.name === name);
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 1500));
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      await new Promise(r => setTimeout(r, 600));
      const mobilePath = path.join(OUT_DIR, `${name}_mobile_light_repaired.png`);
      await page.screenshot({ path: mobilePath, fullPage: false });
      console.log(`Saved ${mobilePath}`);
    } catch (err) {
      console.error(`Error capturing mobile ${name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Capture completed successfully.');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
