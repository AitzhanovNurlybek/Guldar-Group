import { access } from "node:fs/promises";
import puppeteer from "puppeteer-core";

export async function launchBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const executablePath of candidates) {
    try { await access(executablePath); } catch { continue; }
    return puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-first-run", "--no-default-browser-check", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
  }
  throw new Error("Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.");
}
