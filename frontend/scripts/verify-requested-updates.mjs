import fs from "node:fs/promises";
import puppeteer from "puppeteer-core";

const base = process.env.AUDIT_URL || "http://localhost:3100";
const out = "reports/pastel-update";
await fs.mkdir(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const report = { checks: [], errors: [] };
function check(name, pass, details) {
  report.checks.push({ name, pass, details });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`, details || "");
}
try {
  const page = await browser.newPage();
  const requests = [];
  page.on("pageerror", (error) => report.errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") console.log("BROWSER", message.text()); });
  page.on("request", (request) => requests.push(request.url()));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base, { waitUntil: "networkidle0" });
  check("commercial objects headline", await page.$eval("h1", (el) => el.textContent.includes("Ремонт коммерческих объектов")));
  check("pastel light theme", await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme === "light"));
  check("large viewer model is not loaded before consent", !requests.some((url) => url.endsWith("/room-complete.glb")));
  await page.screenshot({ path: `${out}/desktop-home.png` });
  check("all ten client logos are present", await page.$$eval(".client-logos li", (items) => items.length === 10));
  await page.evaluate(() => document.querySelector(".clients-section").scrollIntoView());
  await page.waitForFunction(() => [...document.querySelectorAll(".client-logos img")].every((image) => image.complete && image.naturalWidth > 0));
  await (await page.$(".clients-section")).screenshot({ path: `${out}/clients-desktop.png` });
  check("three original company letters", await page.$$eval(".testimonial", (items) => items.length === 3));
  const documents = await page.evaluate(async () => Promise.all(["dana", "sulpak", "mastershina"].map(async (id) => {
    const response = await fetch(`/reviews/${id}.pdf`);
    return { id, status: response.status, type: response.headers.get("content-type") };
  })));
  check("PDF letters are accessible", documents.every((item) => item.status === 200 && item.type.includes("pdf")), documents);
  check("technical specialist number", await page.$$eval('a[href="tel:+77056117474"]', (items) => items.length >= 2));
  for (const route of ["proektirovanie", "dizayn-proekt"]) {
    check(`home links to ${route}`, !!(await page.$(`.services-grid a[href="/uslugi/${route}"]`)));
  }
  await page.evaluate(() => document.querySelector(".reviews-section").scrollIntoView());
  await (await page.$(".reviews-section")).screenshot({ path: `${out}/reviews-desktop.png` });

  await page.locator(".room-enable").click();
  await page.waitForSelector(".room-orbit-canvas canvas");
  await page.waitForFunction(() => !document.querySelector(".room-loading"), { timeout: 30000 });
  const canvas = await page.$(".room-orbit-canvas canvas");
  if (!canvas) { await page.screenshot({ path: `${out}/viewer-error.png` }); throw new Error("Viewer closed while loading; inspect browser console."); }
  await canvas.scrollIntoView();
  await page.locator(".room-reset").click();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await canvas.screenshot();
  const before = Buffer.from(await canvas.screenshot());
  const initialView = await canvas.evaluate((el) => el.dataset.view);
  await fs.writeFile(`${out}/room-initial.png`, before);
  await page.locator('button[aria-label="Повернуть макет вправо"]').click();
  const after = Buffer.from(await canvas.screenshot());
  check("rotation button changes the rendered model", !before.equals(after));
  await canvas.scrollIntoView();
  const rect = await canvas.boundingBox();
  const beforeDrag = Buffer.from(await canvas.screenshot());
  await page.mouse.move(rect.x + rect.width * 0.4, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.55, { steps: 12 });
  await page.mouse.up();
  check("mouse drag rotates the model", !beforeDrag.equals(Buffer.from(await canvas.screenshot())));
  await (await page.$(".room-explorer")).screenshot({ path: `${out}/room-rotated.png` });
  await page.locator(".room-reset").click();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  check("reset restores the initial camera pose", await canvas.evaluate((el, initial) => el.dataset.view === initial, initialView));
  await (await page.$(".room-explorer")).screenshot({ path: `${out}/room-default.png` });
  await page.locator(".room-controls .text-link").click();
  check("closing the viewer releases its canvas", !(await page.$(".room-orbit-canvas canvas")));
  await new Promise((resolve) => setTimeout(resolve, 700));
  check("normal close does not display an error", await page.$eval(".room-controls p", (el) => !el.textContent.includes("Не удалось")));

  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(base, { waitUntil: "networkidle0" });
  check("mobile starts without WebGL", await page.$$eval("canvas", (items) => items.length === 0));
  await page.screenshot({ path: `${out}/mobile-home.png` });
  await page.evaluate(() => document.querySelector(".clients-section").scrollIntoView());
  await (await page.$(".clients-section")).screenshot({ path: `${out}/clients-mobile.png` });
  await page.evaluate(() => document.querySelector(".room-explorer").scrollIntoView({ block: "center" }));
  const session = await page.createCDPSession();
  const start = await page.evaluate(() => scrollY);
  const inactive = await page.$eval(".room-explorer .finale-image", (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: Math.min(innerHeight - 120, Math.max(150, r.top + r.height / 2)) }; });
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: inactive.x, y: inactive.y, id: 0 }] });
  for (let i = 1; i <= 10; i++) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: inactive.x, y: inactive.y - i * 20, id: 0 }] });
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForFunction((initial) => scrollY > initial + 100, { timeout: 2000 }, start);
  const end = await page.evaluate(() => scrollY);
  check("touch scroll works over the inactive model", end > start + 100, { start, end });
  await page.locator(".room-enable").click();
  await page.waitForSelector(".room-orbit-canvas canvas");
  await page.waitForFunction(() => !document.querySelector(".room-loading"), { timeout: 30000 });
  const touchCanvas = await page.$(".room-orbit-canvas canvas");
  await touchCanvas.scrollIntoView();
  const touchRect = await touchCanvas.boundingBox();
  const touchBefore = Buffer.from(await touchCanvas.screenshot());
  const x = touchRect.x + touchRect.width * 0.3, y = touchRect.y + touchRect.height * 0.5;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 0 }] });
  for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + i * 12, y, id: 0 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  check("touch drag rotates the model", !touchBefore.equals(Buffer.from(await touchCanvas.screenshot())));
  await (await page.$(".room-explorer")).screenshot({ path: `${out}/room-mobile.png` });
  await page.locator(".room-controls .text-link").click();
  check("mobile viewer can be closed", !(await page.$(".room-orbit-canvas canvas")));
  const unavailable = await browser.newPage();
  await unavailable.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await unavailable.evaluateOnNewDocument(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind === "webgl" || kind === "webgl2" || kind === "experimental-webgl") return null;
      return original.call(this, kind, ...args);
    };
  });
  await unavailable.goto(base, { waitUntil: "networkidle0" });
  await unavailable.locator(".room-enable").click();
  await unavailable.waitForFunction(() => document.querySelector(".room-controls p")?.textContent.includes("Не удалось"));
  check("unavailable WebGL preserves the image and retry button", await unavailable.evaluate(() => !!document.querySelector(".room-enable") && Number(getComputedStyle(document.querySelector(".finale-image > img")).opacity) === 1));
  await unavailable.close();
  check("no browser runtime errors", report.errors.length === 0, report.errors);
} finally {
  await fs.writeFile(`${out}/checks.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.checks.some((item) => !item.pass)) process.exitCode = 1;
