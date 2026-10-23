import fs from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const base = process.env.AUDIT_URL || 'http://localhost:3100';
await fs.mkdir('reports/after', { recursive: true });
const report = { checks: [], errors: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass, details }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, details || ''); };
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => report.errors.push(String(error)));
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(base, { waitUntil: 'networkidle0' });
  check('mobile document has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth && document.documentElement.clientWidth === 375));
  const geometry = await page.evaluate(() => [...document.querySelectorAll('header, header > div, header button, header a')].map((el) => ({ label: el.getAttribute('aria-label') || el.textContent.slice(0, 40), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width, display: getComputedStyle(el).display })).filter((x) => x.width > 0));
  check('mobile navigation fits', geometry.every((x) => x.left >= 0 && x.right <= 375), geometry);
  await page.locator('header button[aria-label="Открыть меню"]').click();
  check('mobile menu opens', await page.$eval('dialog', (el) => el.open));
  await page.keyboard.press('Escape');
  check('Escape closes menu', !(await page.$eval('dialog', (el) => el.open)));
  check('menu restores page scrolling', await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'));
  await page.locator('.scene-stage-button:last-child').click();
  await page.waitForFunction(() => document.querySelector('.scene-stage-button:last-child')?.getAttribute('aria-pressed') === 'true');
  await page.waitForFunction(() => {
    const image = document.querySelector('.scene-poster img');
    return image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith('/m/144.avif');
  });
  check('mobile stage selection displays the matching image', true);
  check('range description matches the selected stage', await page.$eval('#scene-progress', (el) => el.getAttribute('aria-valuetext').includes('Готовое пространство')));
  await page.evaluate(() => scrollTo(0, 1200));
  await page.waitForFunction(() => scrollY >= 1200);
  check('mobile manual stage survives scrolling', await page.$eval('.scene-stage-button:last-child', (el) => el.getAttribute('aria-pressed') === 'true'));
  check('mobile scrolling stays native', await page.evaluate(() => !document.documentElement.classList.contains('lenis') && !document.querySelector('canvas')));
  await page.evaluate(() => document.querySelector('.scene-finale-window').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => { const image = document.querySelector('.finale-image img'); return image.complete && image.naturalWidth > 0; });
  check('final result contains an independently loaded image', await page.$eval('.finale-image', (el) => el.getBoundingClientRect().height > 200));
  await page.screenshot({ path: 'reports/after/mobile-result.png' });
  check('fill images have positioned parents', await page.evaluate(() => [...document.querySelectorAll('img[data-nimg="fill"]')].every((el) => ['relative', 'absolute', 'fixed'].includes(getComputedStyle(el.parentElement).position))));
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((el) => el.getAttribute('href')).filter((href) => href.length > 1).every((href) => !!document.querySelector(href)));
  check('all section anchors exist', hrefs);
  await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('.scene-asset')?.dataset.rendered === 'true', { timeout: 15000 });
  check('GLB renderer starts', true);
  await page.locator('.scene-stage-button:last-child').click();
  await page.waitForFunction(() => document.querySelector('.scene-stage-button:last-child')?.getAttribute('aria-pressed') === 'true', { timeout: 7000 });
  check('manual final stage', true);
  await page.waitForFunction(() => Number(document.querySelector('.scene-poster') && getComputedStyle(document.querySelector('.scene-poster')).opacity) < 0.05);
  await page.screenshot({ path: 'reports/after/room-complete.png' });
  const calls = await page.evaluate(() => window.__guldarDiagnostics);
  check('draw calls below 100', calls.drawCalls < 100, calls);
  check('renderer stops after the stage settles', await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const frames = window.__guldarDiagnostics.renderedFrames;
    await new Promise((resolve) => setTimeout(resolve, 350));
    return frames === window.__guldarDiagnostics.renderedFrames;
  }));
  await page.evaluate(() => scrollTo(0, 700));
  await page.waitForFunction(() => document.querySelector('header')?.getAttribute('data-hidden') === 'true');
  check('header hides on down scroll', true);
  await page.evaluate(() => scrollTo(0, 350));
  await page.waitForFunction(() => document.querySelector('header')?.getAttribute('data-hidden') === 'false');
  check('header returns on up scroll', true);
  await page.evaluate(() => document.getElementById('kalkulyator').scrollIntoView());
  await page.waitForSelector('#calc-area', { timeout: 15000 });
  const input = await page.$('input[aria-label="Площадь, м²"]');
  await input.focus(); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await input.type('120'); await input.press('Tab');
  const value = await input.evaluate((el) => el.value);
  check('calculator accepts area', value === '120', value);
  await page.screenshot({ path: 'reports/after/calculator.png' });
  await page.evaluate(() => document.getElementById('obsudit').scrollIntoView());
  await page.waitForFunction(() => document.querySelector('.deferred-whatsapp')?.getAttribute('aria-busy') === 'false');
  await page.waitForSelector('.deferred-whatsapp a[href*="wa.me"]');
  check('WhatsApp builder loads with correct destination', await page.$eval('.deferred-whatsapp a[href*="wa.me"]', (el) => el.href.startsWith('https://wa.me/77786812931')));
  await page.screenshot({ path: 'reports/after/contacts.png' });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base, { waitUntil: 'networkidle0' });
  check('reduced motion uses poster', await page.evaluate(() => !document.querySelector('canvas') && !!document.querySelector('.scene-poster img')));
  await page.keyboard.press('Tab');
  check('keyboard skip link focused', await page.evaluate(() => document.activeElement?.classList.contains('skip-link')));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const routes = ['/', '/uslugi', '/produkciya', '/o-kompanii', '/kontakty', '/uslugi/proektirovanie', '/uslugi/dizayn-proekt', '/uslugi/pod-klyuch', '/uslugi/metallokonstrukcii', '/uslugi/kto'];
  for (const width of process.argv.includes('--quick') ? [] : [320, 375, 640, 768, 1024, 1440]) {
    await page.setViewport({ width, height: 900, isMobile: width < 640, hasTouch: width < 1024 });
    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
      const geometry = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        width: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll('main *')].filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1 || rect.width > document.documentElement.clientWidth) && !el.closest('[aria-hidden="true"]');
        }).slice(0, 3).map((el) => el.className),
      }));
      check(`${width}px ${route}: loads without overflow`, response.status() < 400 && geometry.width <= geometry.viewport, { status: response.status(), ...geometry });
      if (route === '/' && [375, 1440].includes(width)) await page.screenshot({ path: `reports/after/home-${width}.png` });
      if (width === 320 && route === '/uslugi/metallokonstrukcii') await page.screenshot({ path: 'reports/after/service-320.png' });
    }
  }
  check('no runtime errors', report.errors.length === 0, report.errors);
} finally {
  await fs.mkdir('reports/after', { recursive: true });
  await fs.writeFile(`reports/after/interface${process.argv.includes('--quick') ? '-quick' : ''}.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.checks.some((item) => !item.pass)) process.exitCode = 1;
