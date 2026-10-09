import assert from "node:assert/strict";
import test from "node:test";
import {
  serve,
  launchBrowser,
  openExperience,
  goExplorerStep,
  goStoryScene,
} from "./support.mjs";
import { computedStyleSnapshot } from "./styleSnapshot.mjs";

const viewports = [
  { width: 1440, height: 1000 },
  { width: 1024, height: 768 },
  { width: 1280, height: 560 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 390, height: 600 },
];

async function captureStyles(page) {
  const states = [];
  const capture = async (label) => {
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      `overflow at ${label}`,
    );
    states.push({ label, rows: await computedStyleSnapshot(page) });
  };
  for (let scene = 0; scene < 5; scene++) {
    await goStoryScene(page, scene);
    await page.waitForTimeout(160);
    await capture(`story-${scene}`);
  }
  for (let step = 1; step <= 10; step++) {
    await goExplorerStep(page, step);
    await capture(`explorer-${step}`);
  }
  for (let scene = 0; scene < 4; scene++) {
    await page
      .locator(".method-landmarks li")
      .nth(scene)
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        scrollTo({
          top: scrollY + bounds.top + bounds.height * 0.3 - innerHeight * 0.3,
          behavior: "instant",
        });
      });
    await page.waitForTimeout(150);
    await capture(`method-${scene}`);
  }
  await page.locator("#conclusion").evaluate((element) =>
    scrollTo({
      top: scrollY + element.getBoundingClientRect().top,
      behavior: "instant",
    }),
  );
  await page.waitForTimeout(150);
  await capture("conclusion");
  await goExplorerStep(page, 8);
  await page.locator(".territory-lab .chart-help-button").first().click();
  await page.locator(".chart-help-dialog[open]").waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(180);
  await capture("dialog");
  // Opening with a mouse does not activate :focus-visible. Return by keyboard.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const focus = await page
    .locator(".chart-help-dialog[open] .chart-help-close")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        active: document.activeElement === element,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
      };
    });
  assert.ok(
    focus.active && focus.outlineStyle !== "none" && focus.outlineWidth > 0,
    "visible keyboard focus in the dialog",
  );
  await page.keyboard.press("Escape");
  await page.locator(".chart-help-dialog[open]").waitFor({ state: "detached" });
  await page.waitForFunction(() => document.body.style.overflow === "");
  return states;
}

function assertSameStyles(current, baseline) {
  assert.equal(current.length, baseline.length);
  for (let state = 0; state < current.length; state++) {
    const a = current[state],
      b = baseline[state];
    assert.equal(
      a.rows.length,
      b.rows.length,
      `visible element count at ${a.label}`,
    );
    for (let row = 0; row < a.rows.length; row++) {
      assert.deepEqual(
        a.rows[row],
        b.rows[row],
        `computed styles at ${a.label}, element ${row}: ${a.rows[row].tag}.${a.rows[row].class ?? ""}`,
      );
    }
  }
}

for (const viewport of viewports) {
  test(
    `styles responsive et dialogue · ${viewport.width}×${viewport.height}`,
    { timeout: 120000 },
    async () => {
      const current = await serve("dist");
      let baseline, browser;
      try {
        if (process.env.TEST_BASELINE_DIR)
          baseline = await serve(process.env.TEST_BASELINE_DIR);
        browser = await launchBrowser();
        const runs = [];
        for (const server of [baseline, current]) {
          if (!server) continue;
          const { page, assertNoErrors } = await openExperience(
            browser,
            server.url,
            viewport,
          );
          try {
            runs.push(await captureStyles(page));
            assertNoErrors();
          } finally {
            await page.close();
          }
        }
        if (baseline) assertSameStyles(runs[1], runs[0]);
      } finally {
        await browser?.close();
        await baseline?.close();
        await current.close();
      }
    },
  );
}
