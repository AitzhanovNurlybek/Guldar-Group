import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { launchBrowser } from "./browser.mjs";

const base = process.env.AUDIT_URL || "http://localhost:3100";
const out = "reports/verification";
const quick = process.argv.includes("--quick");
const widths = quick ? [320, 390, 768, 1440] : [320, 360, 375, 390, 414, 430, 480, 640, 768, 820, 1024, 1280, 1440, 1920];
const source = await fs.readFile("src/lib/service-details.ts", "utf8");
const slugs = [...source.matchAll(/slug: "([a-z-]+)"/g)].map((match) => match[1]);
const routes = ["/", "/uslugi", "/produkciya", "/o-kompanii", "/kontakty", ...slugs.map((slug) => `/uslugi/${slug}`)];
const report = { url: base, measuredAt: new Date().toISOString(), checks: [], errors: [] };
await fs.mkdir(out, { recursive: true });
const browser = await launchBrowser();
const check = (name, pass, details) => {
  report.checks.push({ name, pass: Boolean(pass), details });
  if (!pass) console.error("FAIL", name, details || "");
};
const test = async (name, fn) => {
  try { await fn(); check(name, true); console.log("PASS", name); }
  catch (error) { check(name, false, String(error)); }
};

async function loadImages(page) {
  await page.evaluate(() => document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; }));
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  return page.evaluate(() => [...document.images].filter((image) => !image.naturalWidth).map((image) => image.currentSrc || image.src));
}
async function ready(page, route = "/") {
  const navigation = await page.goto(`${base}${route}`, { waitUntil: "networkidle0" });
  const response = navigation ?? await page.reload({ waitUntil: "networkidle0" });
  assert.ok([200, 304].includes(response.status()), `Unexpected HTTP ${response.status()} for ${route}`);
  await page.evaluate(() => document.fonts.ready);
}
async function clickText(page, selector, text) {
  const clicked = await page.$$eval(selector, (items, text) => {
    const item = items.find((item) => item.textContent.trim() === text);
    item?.click();
    return Boolean(item);
  }, text);
  assert.ok(clicked, `Control not found: ${text}`);
}
async function typeInto(page, selector, value) {
  await page.focus(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  if (value) await page.keyboard.type(value);
}

async function openMobilePanel(page, id) {
  const selector = `#${id} > .mobile-disclosure-trigger`;
  const closed = await page.$eval(selector, (button) => getComputedStyle(button).display !== "none" && button.getAttribute("aria-expanded") === "false");
  if (closed) await page.locator(selector).click();
}

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => report.errors.push(String(error)));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

  await test("all routes fit mobile, tablet and desktop widths", async () => {
    for (const width of widths) {
      await page.setViewport({ width, height: 900, isMobile: width < 640, hasTouch: width < 1024 });
      for (const route of routes) {
        const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        const geometry = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
          offenders: [...document.querySelectorAll("main *, header > div")].filter((element) => {
            const r = element.getBoundingClientRect();
            return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1) && !element.closest('[aria-hidden="true"]');
          }).slice(0, 5).map((element) => ({ tag: element.tagName, class: element.className })),
        }));
        check(`${width}px ${route}: loads without overflow`, [200, 304].includes(response.status()) && geometry.document <= geometry.viewport && geometry.offenders.length === 0, { status: response.status(), ...geometry });
      }
      console.log(`Checked ${routes.length} routes at ${width}px`);
    }
    assert.ok(report.checks.every((item) => item.pass));
  });

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await ready(page);
  await test("mobile keeps readable light colours in dark OS and Chromium Auto Dark", async () => {
    const themedPage = await browser.newPage();
    const cdp = await themedPage.createCDPSession();
    try {
      await themedPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "dark" }]);
      for (const width of [360, 384, 412, 430]) {
        await themedPage.setViewport({ width, height: 900, isMobile: true, hasTouch: true });
        await cdp.send("Emulation.setAutoDarkModeOverride", { enabled: false });
        await ready(themedPage);
        const settings = await themedPage.evaluate(() => ({
          scheme: document.head.querySelector('meta[name="color-scheme"]')?.content,
          viewport: document.head.querySelector('meta[name="viewport"]')?.content,
          width: innerWidth,
          scale: visualViewport.scale,
          lead: parseFloat(getComputedStyle(document.querySelector(".editorial-hero-lead")).fontSize),
        }));
        assert.equal(settings.scheme, "only light");
        assert.equal(settings.width, width);
        assert.equal(settings.scale, 1);
        assert.ok(settings.lead >= 17);
        assert.doesNotMatch(settings.viewport, /user-scalable=no|maximum-scale=1(?:,|$)/);
        const sample = { x: 1, y: 200, width: 4, height: 4 };
        const light = Buffer.from(await themedPage.screenshot({ clip: sample }));
        await cdp.send("Emulation.setAutoDarkModeOverride", { enabled: true });
        await themedPage.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const autoDark = Buffer.from(await themedPage.screenshot({ clip: sample }));
        assert.ok(autoDark.equals(light), `Auto Dark recoloured the mobile background at ${width}px`);
      }
    } finally { await themedPage.close(); }
  });
  await test("floating contact actions stay visible and readable across sections", async () => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 900, isMobile: width < 640, hasTouch: width < 1024 });
      await ready(page);
      for (const selector of ["#home", "#uslugi", "#otzyvy", "#etapy"]) {
        await page.$eval(selector, (section) => section.scrollIntoView());
        const dock = await page.$eval(".contact-dock", (element) => {
          const rect = element.getBoundingClientRect();
          return {
            visible: getComputedStyle(element).visibility === "visible",
            fits: rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
            actions: [...element.querySelectorAll("a")].map((link) => {
              const label = link.querySelector("span");
              return { height: link.getBoundingClientRect().height, href: link.getAttribute("href"), labelFits: label.getBoundingClientRect().height <= parseFloat(getComputedStyle(label).lineHeight) + 1 };
            }),
          };
        });
        assert.ok(dock.visible && dock.fits, `${width}px ${selector}: contact dock is not visible`);
        assert.ok(dock.actions.every((action) => action.height >= 44 && action.labelFits));
        assert.equal(dock.actions[0].href, "tel:+77056117474");
        assert.equal(new URL(dock.actions[1].href).pathname, "/77786812931");
      }
    }
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await ready(page);
  });
  await test("floating mobile contacts leave the footer readable at normal and 200 percent text", async () => {
    try {
      for (const textSize of ["100%", "200%"]) {
        await ready(page);
        await page.evaluate(async (size) => {
          document.documentElement.style.fontSize = size;
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          scrollTo(0, document.documentElement.scrollHeight);
        }, textSize);
        const clear = await page.evaluate(() => {
          const dock = document.querySelector(".contact-dock").getBoundingClientRect();
          const bottom = Math.max(...[...document.querySelectorAll(".site-footer p")].map((text) => text.getBoundingClientRect().bottom));
          return bottom < dock.top && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
        });
        assert.ok(clear, `Footer overlaps the contact dock at ${textSize} text`);
      }
    } finally { await ready(page); }
  });
  await test("mobile forms open on request, keep values and follow calculator links", async () => {
    for (const id of ["calculator-options", "brief-options"]) {
      assert.equal(await page.$eval(`#${id}-content`, (content) => getComputedStyle(content).display), "none");
    }
    await page.locator(".editorial-hero-actions a[href=\"#kalkulyator\"]").click();
    await page.waitForSelector("#calc-area-input", { visible: true });
    await typeInto(page, "#calc-area-input", "120");
    await page.locator("#calculator-options-trigger").click();
    assert.equal(await page.$eval("#calculator-options-content", (content) => getComputedStyle(content).display), "none");
    await page.locator(".editorial-hero-actions a[href=\"#kalkulyator\"]").click();
    await page.waitForSelector("#calc-area-input", { visible: true });
    assert.equal(await page.$eval("#calc-area-input", (input) => input.value), "120");
    await page.focus("#calculator-options-trigger");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#calculator-options-trigger", (button) => button.getAttribute("aria-expanded")), "false");
    await page.setViewport({ width: 1440, height: 900 });
    assert.notEqual(await page.$eval("#calculator-options-content", (content) => getComputedStyle(content).display), "none");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await ready(page, "/#kalkulyator");
    await page.waitForSelector("#calc-area-input", { visible: true });
    await ready(page);
  });
  await test("renovation concept is labelled and real evidence stays accessible", async () => {
    assert.ok(await page.$eval(".renovation-comparison figcaption", (caption) => caption.textContent.includes("AI-визуализация")));
    assert.ok(await page.$$eval(".renovation-comparison img", (images) => images.length === 2 && images.every((image) => image.alt.includes("Визуализация"))));
    assert.equal(await page.$$eval(".agreement-list > div", (items) => items.length), 3);
    assert.equal(await page.$$eval(".testimonial", (items) => items.length), 3);
    assert.ok(await page.$('a[href="/o-kompanii#rekvizity"]'));
  });
  await test("compact comparison sits beside hero copy with rounded corners and supports mouse and keyboard", async () => {
    await page.setViewport({ width: 1440, height: 1000, isMobile: false, hasTouch: false });
    await ready(page);
    await page.waitForFunction(() => [...document.querySelectorAll(".renovation-comparison img")].every((image) => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: `${out}/home-comparison-1440.png` });
    await page.$eval(".renovation-comparison-frame", (element) => element.scrollIntoView({ block: "center" }));
    const bounds = await page.$eval(".renovation-comparison-frame", (element) => {
      const r = element.getBoundingClientRect();
      const copy = document.querySelector(".editorial-hero-copy").getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, viewport: document.body.getBoundingClientRect().width, copyRight: copy.right, radius: parseFloat(getComputedStyle(element).borderRadius) };
    });
    assert.ok(bounds.x >= bounds.copyRight);
    assert.ok(bounds.width < bounds.viewport * .6);
    assert.ok(bounds.height <= 720);
    assert.ok(bounds.radius >= 12);
    assert.equal(await page.$eval(".renovation-comparison-range", (input) => input.value), "50");
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .2, bounds.y + bounds.height / 2, { steps: 10 });
    await page.mouse.up();
    assert.equal(await page.$eval(".renovation-comparison-range", (input) => input.value), "20");
    await page.focus(".renovation-comparison-range");
    for (const [key, value] of [["Home", "0"], ["ArrowRight", "1"], ["End", "100"], ["ArrowLeft", "99"]]) {
      await page.keyboard.press(key);
      await page.waitForFunction((value) => document.querySelector(".renovation-comparison-range").value === value, {}, value);
    }
    const images = await page.$$eval(".renovation-comparison img", (images) => images.map((image) => {
      const r = image.getBoundingClientRect();
      return { width: r.width, height: r.height, x: r.x, y: r.y };
    }));
    assert.deepEqual(images[0], images[1]);
    await page.keyboard.press("Home");
    for (let i = 0; i < 50; i++) await page.keyboard.press("ArrowRight");
    await (await page.$(".renovation-comparison")).screenshot({ path: `${out}/comparison-1440.png` });
  });
  await test("comparison supports horizontal touch dragging and vertical page scrolling", async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await ready(page);
    await page.$eval(".renovation-comparison-frame", (element) => element.scrollIntoView({ block: "center" }));
    const bounds = await page.$eval(".renovation-comparison-frame", (element) => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const touch = await page.createCDPSession();
    const swipe = async (startX, startY, endX, endY) => {
      await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY }] });
      for (let i = 1; i <= 10; i++) await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: startX + (endX - startX) * i / 10, y: startY + (endY - startY) * i / 10 }] });
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    try {
      await swipe(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, bounds.x + bounds.width * .8, bounds.y + bounds.height / 2);
      assert.equal(await page.$eval(".renovation-comparison-range", (input) => input.value), "80");
      await (await page.$(".renovation-comparison")).screenshot({ path: `${out}/comparison-390.png` });
      const scroll = await page.evaluate(() => scrollY);
      await swipe(bounds.x + bounds.width / 2, bounds.y + bounds.height * .7, bounds.x + bounds.width / 2, bounds.y + bounds.height * .2);
      await page.waitForFunction((scroll) => scrollY > scroll + 20, {}, scroll);
    } finally { await touch.detach(); }
    await ready(page);
  });
  await test("comparison image failure offers a working retry", async () => {
    const offline = await browser.newPage();
    let block = true;
    try {
      await offline.setRequestInterception(true);
      offline.on("request", (request) => block && request.url().includes("/images/retail-before-") ? request.abort() : request.continue());
      await ready(offline);
      await offline.waitForSelector(".renovation-comparison-error");
      assert.ok(await offline.$eval(".renovation-comparison-range", (input) => input.disabled));
      block = false;
      await offline.locator(".renovation-comparison-error button").click();
      await offline.waitForFunction(() => !document.querySelector(".renovation-comparison-error") && [...document.querySelectorAll(".renovation-comparison img")].every((image) => image.complete && image.naturalWidth > 0));
      assert.ok(await offline.$eval(".renovation-comparison-range", (input) => !input.disabled));
    } finally { await offline.close(); }
  });
  await test("all client logos and review images load directly", async () => {
    assert.deepEqual(await loadImages(page), []);
    assert.equal(await page.$$eval(".client-logos img", (images) => images.length), 10);
    assert.ok(await page.$$eval("img", (images) => images.every((image) => !image.currentSrc.includes("/_next/image"))));
    await (await page.$(".clients-section")).screenshot({ path: `${out}/clients-390.png` });
  });
  await test("original review PDFs are accessible", async () => {
    const results = await page.$$eval('a[href$=".pdf"]', async (links) => Promise.all([...new Set(links.map((link) => link.href))].map(async (url) => {
      const response = await fetch(url);
      return response.ok && response.headers.get("content-type")?.includes("pdf");
    })));
    assert.equal(results.length, 3);
    assert.ok(results.every(Boolean));
  });
  await test("additional recommendation text expands and closes", async () => {
    assert.equal(await page.$$(".testimonial-details").then((items) => items.length), 2);
    await page.locator(".testimonial-details summary").click();
    assert.ok(await page.$eval(".testimonial-details", (details) => details.open));
    assert.ok(await page.$eval(".testimonial-details blockquote", (quote) => quote.innerText.length > 50));
    await page.locator(".testimonial-details summary").click();
    assert.ok(await page.$eval(".testimonial-details", (details) => !details.open));
  });
  await test("home section anchors and service links have destinations", async () => {
    assert.ok(await page.$$eval('a[href^="#"]', (links) => links.every((link) => link.hash.length < 2 || document.getElementById(decodeURIComponent(link.hash.slice(1))))));
    assert.equal(await page.$$eval(".services-grid a", (links) => links.length), 8);
    assert.equal(await page.$$eval(".services-grid a[href^='/uslugi/']", (links) => links.length), slugs.length);
  });

  await ready(page);
  await test("mobile menu traps focus, closes with Escape and restores scrolling", async () => {
    await page.locator('header button[aria-controls="mobile-navigation"]').click();
    assert.ok(await page.$eval("dialog", (dialog) => dialog.open));
    assert.equal(await page.$eval(".contact-dock", (dock) => getComputedStyle(dock).visibility), "hidden");
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      assert.ok(await page.evaluate(() => document.activeElement === document.body || document.querySelector("dialog").contains(document.activeElement)));
    }
    await page.keyboard.press("Escape");
    assert.ok(await page.$eval("dialog", (dialog) => !dialog.open));
    assert.ok(await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== "hidden"));
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-controls")), "mobile-navigation");
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".contact-dock")).visibility === "visible");
  });
  await test("changing to desktop closes the mobile dialog", async () => {
    await page.locator('header button[aria-controls="mobile-navigation"]').click();
    await page.setViewport({ width: 1280, height: 900 });
    await page.waitForFunction(() => !document.querySelector("dialog").open);
    assert.ok(await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== "hidden"));
  });
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await ready(page);
  await test("mobile scene changes stages without WebGL or scroll interception", async () => {
    await page.locator(".scene-stage-button:last-child").click();
    await page.waitForFunction(() => {
      const image = document.querySelector(".scene-poster img");
      return image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith("/m/144.avif");
    });
    await page.evaluate(() => scrollTo(0, 1500));
    assert.equal(await page.$eval(".scene-stage-button:last-child", (button) => button.getAttribute("aria-pressed")), "true");
    assert.equal(await page.$$eval("canvas", (items) => items.length), 0);
    assert.ok(await page.$eval("#scene-progress", (input) => input.getAttribute("aria-valuetext").includes("Готовое пространство")));
  });

  await test("calculator handles empty, minimum, maximum and normal area", async () => {
    await page.$eval("#kalkulyator", (section) => section.scrollIntoView());
    await openMobilePanel(page, "calculator-options");
    await page.waitForSelector("#calc-area-input");
    await typeInto(page, "#calc-area-input", "");
    await page.keyboard.press("Tab");
    await page.waitForFunction(() => document.querySelector("#calc-area-input").value === "10");
    assert.equal(await page.$eval("#calc-area-input", (input) => input.value), "10");
    await typeInto(page, "#calc-area-input", "99999");
    await page.keyboard.press("Tab");
    await page.waitForFunction(() => document.querySelector("#calc-area-input").value === "5000");
    assert.equal(await page.$eval("#calc-area-input", (input) => input.value), "5000");
    await typeInto(page, "#calc-area-input", "120");
    await page.keyboard.press("Tab");
    await page.waitForFunction(() => document.querySelector("#calc-area-input").value === "120");
    const text = await page.$eval(".deferred-calculator a[href*='wa.me']", (link) => new URL(link.href).searchParams.get("text"));
    assert.ok(text.includes("120 м²"));
    assert.ok(text.replace(/\s/g, "").includes("7200000"));
    assert.ok(!text.includes("NaN"));
    await clickText(page, ".deferred-calculator button[aria-pressed]", "Мелкий ремонт");
    assert.equal(await page.$$("#calc-area-input").then((items) => items.length), 0);
    await clickText(page, ".deferred-calculator button[aria-pressed]", "Ремонт под ключ");
    assert.equal(await page.$eval("#calc-area-input", (input) => input.value), "120");
  });
  await test("mobile primary controls have at least 44px tap targets", async () => {
    const controls = await page.$$eval(".mobile-menu-trigger, .scene-stage-button, #calc-area-input", (items) => items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    assert.ok(controls.every((rect) => rect.width >= 44 && rect.height >= 44));
  });
  await test("WhatsApp builder preserves choices and encodes comments", async () => {
    await page.$eval("#obsudit", (section) => section.scrollIntoView());
    await openMobilePanel(page, "brief-options");
    await page.waitForSelector(".deferred-whatsapp textarea");
    assert.ok(await page.$eval(".builder-reset", (button) => button.disabled));
    await clickText(page, ".deferred-whatsapp button", "Проектирование");
    await clickText(page, ".deferred-whatsapp button", "Офис");
    await typeInto(page, ".deferred-whatsapp input", "120");
    const note = "Ночью: свет & розетки <офис>";
    await typeInto(page, ".deferred-whatsapp textarea", note);
    const href = await page.$eval(".deferred-whatsapp a[href*='wa.me']", (link) => link.href);
    const url = new URL(href);
    assert.equal(url.pathname, "/77786812931");
    assert.ok(url.searchParams.get("text").includes(note));
    assert.ok(url.searchParams.get("text").includes("Задача: проектирование"));
    assert.ok(url.searchParams.get("text").includes("Объект: офис"));
    assert.ok(await page.$eval(".contact-dock", (dock) => getComputedStyle(dock).visibility === "hidden"));
  });
  await test("WhatsApp builder resets details and keeps a usable empty message", async () => {
    assert.ok(await page.$eval(".builder-reset", (button) => !button.disabled));
    await page.locator(".builder-reset").click();
    await page.waitForFunction(() => document.querySelector(".builder-reset").disabled);
    assert.ok(await page.$$eval(".deferred-whatsapp [aria-pressed]", (buttons) => buttons.every((button) => button.getAttribute("aria-pressed") === "false")));
    assert.ok(await page.$$eval(".deferred-whatsapp input, .deferred-whatsapp textarea", (fields) => fields.every((field) => field.value === "")));
    const message = await page.$eval(".deferred-whatsapp a[href*='wa.me']", (link) => new URL(link.href).searchParams.get("text"));
    assert.equal(message, "Здравствуйте! Пишу с сайта GulDar Group.");
  });

  await page.setViewport({ width: 1440, height: 1000, isMobile: false, hasTouch: false });
  await ready(page);
  await test("explicit 3D viewer loads, rotates, closes and restores focus", async () => {
    assert.equal(await page.$$eval("canvas", (items) => items.length), 0);
    await page.locator(".room-enable").click();
    await page.waitForSelector(".room-orbit-canvas canvas", { timeout: 45000 });
    await page.waitForFunction(() => !document.querySelector(".room-loading"), { timeout: 45000 });
    const before = await page.$eval(".room-orbit-canvas canvas", (canvas) => canvas.dataset.view);
    await page.locator('button[aria-label="Повернуть макет вправо"]').click();
    await page.waitForFunction((before) => document.querySelector(".room-orbit-canvas canvas")?.dataset.view !== before, {}, before);
    await (await page.$(".room-explorer")).screenshot({ path: `${out}/viewer-1440.png` });
    await page.locator(".room-controls .text-link").click();
    assert.equal(await page.$$eval(".room-orbit-canvas canvas", (items) => items.length), 0);
    await page.waitForFunction(() => document.activeElement?.classList.contains("room-enable"));
  });

  await test("header recovers when desktop scroll is followed by phone resize", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => scrollY === 0 && document.querySelector("header").dataset.hidden === "false" && document.querySelector("header").dataset.scrolled === "false");
    await page.evaluate(() => scrollTo(0, 600));
    await page.waitForFunction(() => document.querySelector("header").dataset.hidden === "true");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.waitForFunction(() => document.querySelector("header").dataset.hidden === "false");
  });
  await test("landscape phone menu fits the viewport and remains scrollable", async () => {
    await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
    await ready(page);
    await page.locator('header button[aria-controls="mobile-navigation"]').click();
    const geometry = await page.$eval("dialog", (dialog) => ({ height: dialog.clientHeight, width: dialog.clientWidth, scroll: dialog.scrollHeight, overflow: getComputedStyle(dialog).overflowY }));
    assert.ok(geometry.height <= 390 && geometry.width <= 844);
    assert.ok(geometry.scroll > geometry.height && geometry.overflow === "auto");
    await page.keyboard.press("Escape");
  });
  await test("home and contacts reflow with 200 percent text on a phone", async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    for (const route of ["/", "/kontakty"]) {
      await ready(page, route);
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `Text overflows ${route} at 200%`);
      assert.ok(await page.$eval(".mobile-menu-trigger", (button) => button.getBoundingClientRect().right <= document.documentElement.clientWidth));
      await page.locator(".mobile-menu-trigger").click();
      assert.ok(await page.$eval("dialog", (dialog) => dialog.open));
      await page.keyboard.press("Escape");
    }
  });

  for (const width of [320, 390, 430, 768, 1440]) {
    await page.setViewport({ width, height: 900, isMobile: width < 640, hasTouch: width < 1024 });
    await ready(page);
    await page.screenshot({ path: `${out}/home-${width}.png` });
  }
  await test("404 route returns HTTP 404", async () => {
    const response = await page.goto(`${base}/uslugi/not-a-real-service`, { waitUntil: "networkidle0" });
    assert.equal(response.status(), 404);
  });
  check("no uncaught browser errors", report.errors.length === 0, report.errors);

  await test("deferred widget reports a network error and recovers on retry", async () => {
    const offlinePage = await browser.newPage();
    let offline = true;
    try {
      await offlinePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await ready(offlinePage);
      await offlinePage.setRequestInterception(true);
      offlinePage.on("request", (request) => offline && request.url().includes(".js") ? request.abort() : request.continue());
      await offlinePage.$eval("#kalkulyator", (section) => section.scrollIntoView());
      await openMobilePanel(offlinePage, "calculator-options");
      await offlinePage.waitForSelector(".deferred-calculator [role='alert']");
      assert.equal(await offlinePage.$eval(".deferred-calculator", (element) => element.getAttribute("aria-busy")), "false");
      offline = false;
      await offlinePage.locator(".deferred-calculator button").click();
      await offlinePage.waitForSelector("#calc-area-input");
      assert.equal(await offlinePage.$eval(".deferred-calculator", (element) => element.getAttribute("aria-busy")), "false");
    } finally { await offlinePage.close(); }
  });
} finally {
  await fs.writeFile(`${out}/interface.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
const failed = report.checks.filter((check) => !check.pass);
console.log(`${report.checks.length - failed.length}/${report.checks.length} checks passed; report: ${out}/interface.json`);
if (failed.length) process.exitCode = 1;
