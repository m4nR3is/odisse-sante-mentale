import assert from "node:assert/strict";
import test from "node:test";
import {
  serve,
  launchBrowser,
  openExperience,
  goStoryScene,
  focus,
} from "./support.mjs";

async function waitForDrawing(page, scene) {
  await page.waitForFunction((scene) => {
    const figure = document.querySelector(".story-sticky .story-figure");
    if (figure?.getAttribute("data-scene") !== String(scene)) return false;
    if (scene === 4)
      return [...figure.querySelectorAll(".story-social-row")].every(
        (row) => row.getAttribute("data-progress") === "1",
      );
    const main = figure.querySelector(".story-main-reveal"),
      boys = figure.querySelector(".story-boys-reveal");
    return (
      main?.getAttribute("data-progress") === "1" &&
      (!(scene === 1 || scene === 3) ||
        boys?.getAttribute("data-progress") === "1")
    );
  }, scene);
}

async function compareGirlsTransition(page, to) {
  const before = await page
    .locator(".story-sticky .story-main-reveal path")
    .getAttribute("d");
  // Sample every animation frame, including the erase phase and scene switch.
  await page.evaluate(() => {
    window.__storySamples = [];
    const read = () => {
      const main = document.querySelector(".story-sticky .story-main-reveal");
      window.__storySamples.push({
        progress: main?.getAttribute("data-progress"),
        path: main?.querySelector("path")?.getAttribute("d"),
      });
      window.__storySampleFrame = requestAnimationFrame(read);
    };
    read();
  });
  try {
    await goStoryScene(page, to);
    await waitForDrawing(page, to);
    const samples = await page.evaluate(() => window.__storySamples);
    assert.ok(samples.length > 5, "transition observed over multiple frames");
    assert.ok(
      samples.every(
        (sample) => sample.progress === "1" && sample.path === before,
      ),
      "girls' curve stays drawn in both directions",
    );
  } finally {
    await page.evaluate(() => cancelAnimationFrame(window.__storySampleFrame));
  }
}

test(
  "récit animé : cinq scènes, retour arrière, courbe conservée, clavier et réduction des mouvements",
  { timeout: 60000 },
  async () => {
    const server = await serve("dist");
    let browser;
    try {
      browser = await launchBrowser();
      const { page, assertNoErrors } = await openExperience(
        browser,
        server.url,
        { width: 1440, height: 1000 },
        "no-preference",
      );
      for (const scene of [0, 1, 2]) {
        await goStoryScene(page, scene);
        await waitForDrawing(page, scene);
      }
      await compareGirlsTransition(page, 3);
      await compareGirlsTransition(page, 2);
      const point = page
        .locator(".story-sticky .story-point[data-interactive=true]")
        .first();
      await focus(point);
      await page.locator(".story-tooltip").waitFor();
      assert.match(await page.locator(".story-tooltip").innerText(), /Filles/);
      await page.keyboard.press("Escape");
      await page.locator(".story-tooltip").waitFor({ state: "detached" });
      await goStoryScene(page, 4);
      await waitForDrawing(page, 4);
      assert.equal(
        await page
          .locator(".story-sticky .story-social-row[data-progress='1']")
          .count(),
        4,
      );
      await goStoryScene(page, 0);
      await page.waitForTimeout(100);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await waitForDrawing(page, 0);
      await page
        .getByRole("button", { name: "Explorer les seize profils" })
        .click();
      await page.waitForFunction(
        () => document.querySelector("#territory-age")?.value === "11–14 ans",
      );
      await page
        .getByRole("button", { name: "Explorer les indicateurs déclarés" })
        .click();
      await page.locator(".declared-explorer").waitFor();
      assertNoErrors();
    } finally {
      await browser?.close();
      await server.close();
    }
  },
);
