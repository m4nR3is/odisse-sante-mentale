import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
export async function serve(folder) {
  const root = resolve(folder);
  await stat(resolve(root, "index.html"));
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const file = resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(root + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      const content = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[extname(file)] ?? "application/octet-stream",
      });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((success, failure) => {
    server.once("error", failure);
    server.listen(0, "127.0.0.1", success);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((success, failure) =>
        server.close((error) => (error ? failure(error) : success())),
      ),
  };
}

export async function launchBrowser() {
  return chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE_PATH
      ? { executablePath: process.env.BROWSER_EXECUTABLE_PATH }
      : {}),
  });
}

export async function openExperience(
  browser,
  url,
  viewport,
  reducedMotion = "reduce",
) {
  const page = await browser.newPage({ viewport, reducedMotion });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Decorative positions must be repeatable when comparing two builds.
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let portraitSeed = 98;
    // The conclusion uses crypto to choose decorative portraits and frame lengths.
    crypto.getRandomValues = (values) => {
      for (let index = 0; index < values.length; index++) {
        portraitSeed = (portraitSeed * 16807) % 2147483647;
        values[index] = portraitSeed;
      }
      return values;
    };
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".experience").waitFor();
  return {
    page,
    assertNoErrors: () => assert.deepEqual(errors, [], "JavaScript errors"),
  };
}

export async function goExplorerStep(page, step) {
  await page.locator(`#explorer-step-${step}`).evaluate((element) => {
    const line =
      document.querySelector(".topbar").getBoundingClientRect().bottom + 17;
    scrollTo({
      top:
        scrollY +
        element.getBoundingClientRect().top -
        line +
        element.offsetHeight * 0.1,
      behavior: "instant",
    });
  });
  // Scroll state and ResizeObserver updates settle before reading SVG coordinates.
  await page.waitForTimeout(160);
}

export async function goStoryScene(page, scene) {
  await page.locator(`[data-story-step="${scene}"]`).evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    scrollTo({
      top: scrollY + bounds.top + bounds.height * 0.2 - innerHeight / 2,
      behavior: "instant",
    });
  });
}

export async function snapshot(locator) {
  return locator.evaluate((element) => ({
    text: element.innerText,
    paths: [...element.querySelectorAll("svg path")].map((path) =>
      path.getAttribute("d"),
    ),
    circles: [...element.querySelectorAll("circle")].map((circle) =>
      ["cx", "cy", "r"].map((attribute) => circle.getAttribute(attribute)),
    ),
    selection: [...element.querySelectorAll("select")].map(
      (select) => select.value,
    ),
    tooltips: [
      ...document.querySelectorAll(
        ".distribution-tooltip,.chart-tooltip,.story-tooltip",
      ),
    ].map((tooltip) => tooltip.innerText),
  }));
}

export async function focus(locator) {
  await locator.evaluate((element) => element.focus({ preventScroll: true }));
}

export async function blur(page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
}
