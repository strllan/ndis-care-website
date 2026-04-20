const { test, devices } = require('@playwright/test');
const fs = require('fs');

const iPhone = devices['iPhone 13'];
const base = 'http://127.0.0.1:4173';

test.use({ ...iPhone });

const routes = [
  ['home', '/'],
  ['about', '/about-us/'],
  ['services', '/services/'],
  ['service-detail', '/services/assist-travel-transport/'],
  ['referral', '/referral/'],
  ['careers', '/careers/'],
];

test('capture mobile routes', async ({ page }) => {
  const report = [];
  for (const [name, path] of routes) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    await page.screenshot({ path: `.tmp-playwright/${name}-mobile.png`, fullPage: false });
    report.push({ name, path, ...metrics });
  }

  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.click('#nav-toggle');
  await page.screenshot({ path: '.tmp-playwright/home-mobile-menu.png', fullPage: false });
  const menuMetrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    navOpen: document.getElementById('site-nav')?.classList.contains('is-open')
  }));

  fs.writeFileSync('.tmp-playwright/mobile-report.json', JSON.stringify({ report, menuMetrics }, null, 2));
});
