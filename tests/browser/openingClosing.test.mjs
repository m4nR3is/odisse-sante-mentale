import assert from "node:assert/strict";
import test from "node:test";
import { serve, launchBrowser, openExperience } from "./support.mjs";

async function moveToProgress(page, selector, progress) {
  await page.locator(selector).evaluate((root, progress) => {
    const stage = root.querySelector(".intro-stage,.conclusion-stage");
    const opening = root.id === "top";
    const inset = opening ? parseFloat(getComputedStyle(root).paddingTop) : 0;
    const top = opening ? 0 : parseFloat(getComputedStyle(stage).top);
    scrollTo({
      top: scrollY + root.getBoundingClientRect().top - top +
        progress * (root.offsetHeight - stage.offsetHeight - inset),
      behavior: "instant",
    });
  }, progress);
  await page.waitForTimeout(550);
}

async function capture(page, selector) {
  return page.locator(selector).evaluate(root =>
    [...root.querySelectorAll(".intro-flight,.intro-lead-line")].map(element => {
      const surface = element.querySelector(".intro-flight-surface");
      const rendered = surface && getComputedStyle(surface).visibility === "visible" &&
        getComputedStyle(surface).display !== "none" ? surface : element;
      const bounds = rendered.getBoundingClientRect();
      return { text: (surface ?? element).textContent, x: bounds.x, y: bounds.y,
        width: bounds.width, height: bounds.height,
        opacity: getComputedStyle(element).opacity };
    }),
  );
}

test("intro · le tracé et le plein partagent la même ligne de base", async () => {
  const server = await serve("dist");
  const browser = await launchBrowser();
  try {
    const { page, assertNoErrors } = await openExperience(browser, server.url,
      { width: 390, height: 844 }, "no-preference");
    await page.addInitScript(() => {
      window.openingPositions = [];
      const sample = () => {
        const stage = document.querySelector('.intro-stage[data-intro-ready="true"]');
        const surface = stage?.querySelector(".intro-flight-surface");
        if (surface) window.openingPositions.push(surface.getBoundingClientRect().y);
        if (performance.now() < 1000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.evaluate(() => dispatchEvent(new Event("touchstart")));
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport);
      await page.reload({ waitUntil: "networkidle" });
      await page.evaluate(() => dispatchEvent(new Event("touchstart")));
      await page.waitForTimeout(500);
      const positions = await page.evaluate(() => window.openingPositions);
      assert.ok(positions.length > 2, "startup was sampled after the text became visible");
      assert.ok(Math.max(...positions) - Math.min(...positions) < 1,
        "the first visible frames must not jump vertically");
      const alignment = await page.locator(".intro-flight-surface").first().evaluate(surface => {
        const text = surface.querySelector(".intro-ink text");
        const marker = surface.querySelector(".intro-word-fill .intro-baseline");
        const baseline = new DOMPoint(0, Number(text.getAttribute("y")))
          .matrixTransform(text.getScreenCTM());
        return { delta: Math.abs(baseline.y - marker.getBoundingClientRect().top),
          outlineFont: getComputedStyle(text).fontSize,
          fillFont: getComputedStyle(surface).fontSize };
      });
      assert.ok(alignment.delta < 1, `outline/fill baseline differs by ${alignment.delta}px`);
      assert.equal(alignment.outlineFont, alignment.fillFont);
    }
    assertNoErrors();
  } finally { await browser.close(); await server.close(); }
});

test("intro · textes et trait suivent le scroll sans callbacks JavaScript", async () => {
  const server = await serve("dist");
  const browser = await launchBrowser();
  try {
    const { page, assertNoErrors } = await openExperience(browser, server.url,
      { width: 390, height: 844 }, "no-preference");
    await page.evaluate(() => dispatchEvent(new Event("touchstart")));
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      // Reproduce missing/coalesced scroll notifications without blocking the
      // browser's scroll timeline. The existing JS progress must stay frozen.
      addEventListener("scroll", event => event.stopImmediatePropagation(), { capture: true });
    });
    const before = await page.locator(".intro-stage").getAttribute("data-intro-progress");
    const samples = [];
    for (const progress of [.17, .2, .25, .36]) {
      await moveToProgress(page, ".intro-scroll-track", progress);
      samples.push(await page.locator(".intro-stage").evaluate(stage => ({
        bar: new DOMMatrixReadOnly(getComputedStyle(stage.querySelector(".intro-progress")).transform).a,
        label: stage.querySelectorAll(".intro-flight-surface")[1].getBoundingClientRect().width,
        diagnostic: stage.dataset.introProgress,
      })));
    }
    samples.forEach((sample, index) => {
      assert.equal(sample.diagnostic, before, "scroll callbacks really stayed blocked");
      assert.ok(Math.abs(sample.bar - [.17, .2, .25, .36][index]) < .002,
        "the red line still follows the actual scroll position");
    });
    assert.ok(samples[0].label > samples[1].label && samples[1].label > samples[2].label,
      "text continues to dezoom without JS scroll callbacks");
    const conclusionBefore = await page.locator(".conclusion-stage").getAttribute("data-conclusion-progress");
    const conclusion = [];
    for (const progress of [.05, .12, .2]) {
      await moveToProgress(page, ".reading-conclusion", progress);
      conclusion.push(await page.locator(".conclusion-stage").evaluate(stage => ({
        bar: new DOMMatrixReadOnly(getComputedStyle(stage.querySelector(".intro-progress")).transform).a,
        width: stage.querySelector(".intro-flight-surface").getBoundingClientRect().width,
        diagnostic: stage.dataset.conclusionProgress,
      })));
    }
    conclusion.forEach((sample, index) => {
      assert.equal(sample.diagnostic, conclusionBefore);
      assert.ok(Math.abs(sample.bar - [.05, .12, .2][index]) < .002);
    });
    assert.ok(conclusion[0].width > conclusion[1].width && conclusion[1].width > conclusion[2].width);
    await moveToProgress(page, ".reading-conclusion", .68);
    const drawing = await page.locator(".conclusion-portrait").evaluate(element =>
      Number(getComputedStyle(element).getPropertyValue("--conclusion-portrait-progress")));
    assert.ok(Math.abs(drawing - .5) < .003, "portrait drawing also follows the native timeline");
    assertNoErrors();
    await page.close();
  } finally { await browser.close(); await server.close(); }
});

test("intro · repli interpolé avec des notifications espacées", async () => {
  const server = await serve("dist");
  const browser = await launchBrowser();
  try {
    const { page, assertNoErrors } = await openExperience(browser, server.url,
      { width: 390, height: 844 }, "no-preference");
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = (...args) => args[0] === "animation-timeline" ? false : supports(...args);
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => dispatchEvent(new Event("touchstart")));
    await page.waitForTimeout(1800);
    assert.equal(await page.locator(".intro-scroll-track").getAttribute("data-intro-motion"), "fallback");
    const samples = await page.evaluate(async () => {
      const root = document.querySelector(".intro-scroll-track");
      const stage = root.querySelector(".intro-stage");
      const distance = root.offsetHeight - stage.offsetHeight - parseFloat(getComputedStyle(root).paddingTop);
      const bar = stage.querySelector(".intro-progress");
      const samples = [];
      // One scroll notification, followed by animation frames without further
      // notifications. An event-only driver would jump straight to .2 and stop.
      scrollTo({ top: distance * .2, behavior: "instant" });
      for (let frame = 0; frame < 12; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        samples.push(new DOMMatrixReadOnly(getComputedStyle(bar).transform).a);
      }
      return samples;
    });
    assert.ok(new Set(samples.map(value => value.toFixed(4))).size >= 5,
      "several intermediate frames fill the gap between scroll samples");
    assert.ok(samples.at(-1) > .18 && samples.at(-1) < .202);
    await moveToProgress(page, ".intro-scroll-track", 1);
    assert.ok((await capture(page, ".intro-scroll-track")).every(row => row.opacity === "1"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await moveToProgress(page, ".intro-scroll-track", 0);
    assert.ok((await capture(page, ".intro-scroll-track")).every(row => row.opacity === "1"));
    assertNoErrors();
    await page.close();
  } finally { await browser.close(); await server.close(); }
});

test("intro/outro · trajectoires réversibles, resize et portraits bornés", { timeout: 90000 }, async () => {
  const current = await serve("dist");
  const baseline = process.env.TEST_BASELINE_DIR ? await serve(process.env.TEST_BASELINE_DIR) : null;
  const browser = await launchBrowser();
  try {
    const runs = [];
    for (const server of [baseline, current].filter(Boolean)) {
      const { page, assertNoErrors } = await openExperience(browser, server.url, { width: 390, height: 844 }, "no-preference");
      try {
        await page.evaluate(() => dispatchEvent(new Event("touchstart")));
        await page.waitForTimeout(1800);
        const snapshots = [];
        for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(120);
          for (const selector of [".intro-scroll-track", ".reading-conclusion"]) {
            for (const progress of [0, .12, .36, .64, 1, .64, .36, .12, 0]) {
              await moveToProgress(page, selector, progress);
              snapshots.push(await capture(page, selector));
            }
          }
        }
        if (server === current) {
          await moveToProgress(page, ".intro-scroll-track", .2);
          const compositing = await page.locator(".intro-topics .intro-flight").nth(1).evaluate(element => {
            const surface = element.querySelector(".intro-flight-surface");
            return {
              active: getComputedStyle(surface).visibility === "visible",
              scaleReady: parseFloat(surface.style.fontSize) > parseFloat(getComputedStyle(element).fontSize),
              animated: getComputedStyle(surface).animationTimeline.startsWith("scroll("),
            };
          });
          assert.deepEqual(compositing, { active: true, scaleReady: true, animated: true });
          await moveToProgress(page, ".intro-scroll-track", 1);
          const settled = await page.locator(".intro-topics .intro-flight-surface").evaluateAll(elements => elements.every(element =>
            getComputedStyle(element).visibility === "hidden" && getComputedStyle(element).willChange === "auto"));
          assert.ok(settled, "composited label layers are released after arrival");
          await page.waitForTimeout(600);
          assert.ok(await page.locator(".portrait-face").count() <= 8, "at most incoming/outgoing faces per quarter");
          const missing = await page.locator(".intro-portrait use,.conclusion-portrait-cell use").evaluateAll(elements =>
            elements.filter(element => !document.getElementById(element.getAttribute("href").slice(1))).length);
          assert.equal(missing, 0, "every mounted face has its SVG definition");
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.waitForTimeout(100);
          assert.ok((await capture(page, ".reading-conclusion")).every(row => row.opacity === "1"));
          await page.emulateMedia({ reducedMotion: "no-preference" });
          await moveToProgress(page, ".reading-conclusion", 1.02);
          // Settled sections should not keep rewriting styles elsewhere in the page.
          const mutations = await page.evaluate(async () => {
            const changes = [];
            const observer = new MutationObserver(records => changes.push(...records.map(record => `${record.target.getAttribute('class')}:${record.attributeName}`)));
            for (const selector of [".intro-scroll-track", ".reading-conclusion"])
              observer.observe(document.querySelector(selector), { attributes: true, subtree: true });
            scrollBy(0, 50);
            await new Promise(resolve => setTimeout(resolve, 120));
            observer.disconnect();
            return changes;
          });
          assert.deepEqual(mutations, [], "no writes after both sequences settle");
        }
        runs.push(snapshots);
        assertNoErrors();
      } finally { await page.close(); }
    }
    if (baseline) {
      assert.equal(runs[0].length, runs[1].length);
      runs[0].forEach((snapshot, index) => {
        assert.equal(snapshot.length, runs[1][index].length);
        snapshot.forEach((before, row) => {
          const after = runs[1][index][row];
          assert.equal(after.text, before.text);
          assert.ok(Math.abs(Number(after.opacity) - Number(before.opacity)) < .0001);
          if (before.opacity === "0") return;
          for (const key of ["x", "y", "width", "height"])
            assert.ok(Math.abs(after[key] - before[key]) < 1, `frame ${index}, text ${row}, ${key}: ${before[key]} → ${after[key]}`);
        });
      });
    }
  } finally {
    await browser.close();
    await baseline?.close();
    await current.close();
  }
});
