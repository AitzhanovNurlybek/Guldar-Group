import fs from 'node:fs/promises';
import path from 'node:path';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';

const label = process.argv[2] || 'after';
const base = process.env.AUDIT_URL || 'http://localhost:3100';
const out = path.resolve('reports', label);
await fs.mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-first-run', '--no-default-browser-check'],
});
const result = { label, url: base, measuredAt: new Date().toISOString(), note: 'Local headless Chrome; scroll trace CPU 4x. FPS describes this machine, not a physical phone.' };
try {
  const port = Number(new URL(browser.wsEndpoint()).port);
  console.log(`Lighthouse mobile: ${label}`);
  const audit = await lighthouse(base, { port, onlyCategories: ['performance'], output: ['html', 'json'], logLevel: 'error' });
  await fs.writeFile(path.join(out, 'lighthouse.html'), audit.report[0]);
  await fs.writeFile(path.join(out, 'lighthouse.json'), audit.report[1]);
  const a = audit.lhr.audits;
  result.lighthouse = {
    score: Math.round(audit.lhr.categories.performance.score * 100),
    lcpMs: a['largest-contentful-paint'].numericValue,
    tbtMs: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    jsTransferBytes: a['resource-summary'].details.items.find((x) => x.resourceType === 'script')?.transferSize,
    totalTransferBytes: a['total-byte-weight'].numericValue,
  };
  console.log(JSON.stringify(result.lighthouse));
  if (process.argv.includes('--lighthouse-only')) {
    await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  }
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.evaluateOnNewDocument(() => {
    // Exercise the desktop renderer even on a low-memory audit host.
    if (innerWidth >= 768) {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
    }
    window.__auditLongTasks = [];
    window.__auditShifts = [];
    new PerformanceObserver((list) => window.__auditLongTasks.push(...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((list) => window.__auditShifts.push(...list.getEntries().filter((e) => !e.hadRecentInput).map((e) => e.value))).observe({ type: 'layout-shift', buffered: true });
  });
  result.viewports = [];
  for (const [width, height] of [[375, 812], [768, 1024], [1440, 900], [1920, 1080], [1440, 650]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width === 375, hasTouch: width === 375 });
    await page.goto(base, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    if (width >= 768) {
      try { await page.waitForFunction(() => document.querySelector('.scene-asset')?.getAttribute('data-rendered') === 'true' && Number(getComputedStyle(document.querySelector('.scene-poster')).opacity) < 0.05, { timeout: 12000 }); } catch {}
    }
    await page.screenshot({ path: path.join(out, `${width}x${height}.png`) });
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth, innerWidth, document: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      renderer: document.querySelector('.scene-asset')?.getAttribute('data-rendered'),
      forcedDesktopCapabilities: innerWidth >= 768,
      deviceMemory: navigator.deviceMemory, cores: navigator.hardwareConcurrency,
      h1: document.querySelector('h1')?.textContent,
      diagnostics: window.__guldarDiagnostics || null,
      overflowingElements: [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > document.documentElement.clientWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('[aria-hidden="true"]'); }).slice(0, 8).map((el) => el.className),
    }));
    console.log(`${width}x${height}: overflow=${geometry.overflow}, WebGL=${geometry.renderer}`);
    result.viewports.push({ width, height, ...geometry });
    if (!((width === 1440 && height === 900) || width === 375)) continue;
    const session = await page.createCDPSession();
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.tracing.start({ path: path.join(out, `performance-${width}-cpu4x.json`), categories: ['devtools.timeline', 'blink.user_timing', 'v8.execute'] });
    const scroll = await page.evaluate(async () => {
      const start = performance.now(), duration = 5500;
      const maximum = Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 4);
      const intervals = [];
      let previous = start;
      await new Promise((resolve) => {
        const frame = (now) => {
          intervals.push(now - previous); previous = now;
          const t = Math.min((now - start) / duration, 1);
          scrollTo(0, maximum * (t < 0.7 ? t / 0.7 : 1 - (t - 0.7) / 0.3));
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      const tasks = window.__auditLongTasks.filter((e) => e.start >= start);
      intervals.shift();
      const sorted = [...intervals].sort((a, b) => a - b);
      return {
        fps: Math.round(10000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)) / 10,
        p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
        longTasksOver50ms: tasks.length,
        longestTaskMs: Math.round(Math.max(0, ...tasks.map((x) => x.duration))),
        diagnostics: window.__guldarDiagnostics || null,
      };
    });
    await page.tracing.stop();
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    result.viewports.at(-1).scroll = scroll;
    console.log(`scroll ${width}: ${JSON.stringify(scroll)}`);
    await session.detach();
  }
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base, { waitUntil: 'networkidle0' });
  result.reducedMotion = await page.evaluate(() => ({ canvasCount: document.querySelectorAll('canvas').length, posterPresent: !!document.querySelector('.scene-poster img'), diagnostics: window.__guldarDiagnostics || null }));
  result.errors = errors;
} finally {
  await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(result, null, 2));
  console.log(`Saved ${out}`);
  await browser.close();
}
