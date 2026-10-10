import assert from "node:assert/strict";
import test from "node:test";
import { serve, launchBrowser, openExperience } from "./support.mjs";

async function move(page, marker, progress, group) {
  await page.locator(marker).evaluate((element, { progress, group }) => {
    const line = group === "story" ? innerHeight / 2 :
      document.querySelector(".topbar").getBoundingClientRect().bottom + 17;
    scrollTo({ top: scrollY + element.getBoundingClientRect().top - line +
      element.offsetHeight * progress, behavior: "instant" });
  }, { progress, group });
  await page.waitForTimeout(200);
}

test("traits de progression · récit, Explorer et menu sans callbacks de scroll", async () => {
  const server = await serve("dist");
  const browser = await launchBrowser();
  try {
    for (const group of ["story", "explorer"]) {
      const { page, assertNoErrors } = await openExperience(browser, server.url,
        { width: 1440, height: 1000 }, "no-preference");
      await page.evaluate(() => dispatchEvent(new Event("touchstart")));
      const marker = group === "story" ? "#scene-1" : "#explorer-step-1";
      await move(page, marker, .2, group);
      await page.waitForTimeout(800);
      const selectors = group === "story"
        ? [".story-progress a[aria-current='step'] .control-scroll-progress"]
        : [".explorer-mode button[aria-pressed='true'] .control-scroll-progress",
          ".declared-subnav button[aria-pressed='true'] .control-scroll-progress",
          ".declared-indicators button[aria-pressed='true'] .control-scroll-progress"];
      const read = () => page.evaluate(selectors => selectors.map(selector =>
        new DOMMatrixReadOnly(getComputedStyle(document.querySelector(selector)).transform).a), selectors);
      const before = await read();
      const menuBefore = await page.locator(".topbar a[aria-current='location'] .nav-reading-progress")
        .evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
      await page.evaluate(() => addEventListener("scroll", event => event.stopImmediatePropagation(), { capture: true }));
      await move(page, marker, .4, group);
      const after = await read();
      before.forEach((value, index) => assert.ok(Math.abs(after[index] - value * 2) < .002));
      const menuAfter = await page.locator(".topbar a[aria-current='location'] .nav-reading-progress")
        .evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
      assert.ok(menuAfter > menuBefore, "the main menu also follows native scroll progression");
      assertNoErrors();
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
});
