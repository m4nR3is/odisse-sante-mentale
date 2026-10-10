import assert from "node:assert/strict";
import test from "node:test";
import { serve, launchBrowser, openExperience } from "./support.mjs";

async function move(page, scene, fraction) {
  await page.locator(`#method-step-${scene + 1}`).evaluate((marker, fraction) => {
    const line = document.querySelector(".topbar").getBoundingClientRect().bottom + 18;
    scrollTo({ top: Math.ceil(scrollY + marker.getBoundingClientRect().top - line +
      marker.offsetHeight * fraction), behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(300);
}

async function capture(page) {
  return page.locator(".method-stage").evaluate(stage => {
    const title = stage.querySelector(".method-title-flight");
    const surface = title.querySelector(".intro-flight-surface");
    const visible = surface && getComputedStyle(surface).visibility === "visible" &&
      getComputedStyle(surface).display !== "none" ? surface : title;
    const bounds = visible.getBoundingClientRect();
    const targetOpacity = Number(getComputedStyle(title.parentElement).opacity);
    return {
      word: (surface ?? title).textContent,
      scene: stage.dataset.methodScene,
      x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
      opacity: Number(getComputedStyle(title).opacity) * targetOpacity,
      content: [...stage.querySelectorAll(".method-reading > p,.method-reading h4,.method-rules article,.method-takeaway")]
        .map(element => ({ text: element.textContent, opacity: Number(getComputedStyle(element).opacity) })),
    };
  });
}

test("méthode · quatre étapes, sorties, retours et clics", { timeout: 120000 }, async () => {
  const current = await serve("dist");
  const baseline = process.env.TEST_BASELINE_DIR ? await serve(process.env.TEST_BASELINE_DIR) : null;
  const browser = await launchBrowser();
  const snapshots = [];
  try {
    for (const server of [baseline, current].filter(Boolean)) {
      const { page, assertNoErrors } = await openExperience(browser, server.url,
        { width: 390, height: 844 }, "no-preference");
      await page.evaluate(() => dispatchEvent(new Event("touchstart")));
      const frames = [];
      for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
        await page.setViewportSize(viewport);
        for (const scene of [0, 1, 2, 3, 2, 1, 0]) {
          for (const fraction of [0, .1, .28, .55, .85, .98]) {
            await move(page, scene, fraction);
            const frame = await capture(page);
            frames.push(frame);
            assert.equal(Number(frame.scene), scene);
            if (fraction === .98) assert.equal(frame.opacity, scene === 3 ? 1 : 0,
              "first three slides clear; Interpréter remains visible");
          }
        }
      }
      if (server === current) {
        for (const scene of [1, 2, 3, 0]) {
          await page.locator(`.method-steps [href="#method-step-${scene + 1}"]`).click();
          await page.waitForTimeout(1250);
          const frame = await capture(page);
          assert.equal(Number(frame.scene), scene);
          assert.equal(frame.opacity, 1);
          assert.ok(frame.content.every(item => item.opacity === 1));
          assert.equal(await page.locator(".method-stage").getAttribute("data-method-click"), null);
          const inactive = await page.locator('.method-steps a:not([aria-current="step"]) .control-scroll-progress')
            .evaluateAll(bars => bars.map(bar => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a));
          assert.ok(inactive.every(progress => progress === 0), "inactive navigation bars stay empty");
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await move(page, 2, 0);
        const reduced = await capture(page);
        assert.equal(reduced.opacity, 1);
        assert.ok(reduced.content.every(item => item.opacity === 1));
      }
      snapshots.push(frames);
      assertNoErrors();
      await page.close();
    }
    if (baseline) snapshots[0].forEach((before, index) => {
      const after = snapshots[1][index];
      assert.equal(after.word, before.word);
      assert.equal(after.scene, before.scene);
      assert.ok(Math.abs(after.opacity - before.opacity) < .01);
      before.content.forEach((item, row) => {
        assert.equal(after.content[row].text, item.text);
        assert.ok(Math.abs(after.content[row].opacity - item.opacity) < .01);
      });
      if (before.opacity === 0) return;
      for (const key of ["x", "y", "width", "height"])
        assert.ok(Math.abs(after[key] - before[key]) < 3,
          `frame ${index} ${before.word}, ${key}: ${before[key]} → ${after[key]}`);
    });
  } finally { await browser.close(); await baseline?.close(); await current.close(); }
});

test("méthode · titre et contenus indépendants des callbacks de scroll", async () => {
  const server = await serve("dist");
  const browser = await launchBrowser();
  try {
    const { page, assertNoErrors } = await openExperience(browser, server.url,
      { width: 390, height: 844 }, "no-preference");
    await page.evaluate(() => dispatchEvent(new Event("touchstart")));
    await move(page, 1, .08);
    await page.evaluate(() => addEventListener("scroll", event => event.stopImmediatePropagation(), { capture: true }));
    const before = await capture(page);
    const font = await page.locator(".method-title-flight .intro-flight-surface").evaluate(element => element.style.fontSize);
    await move(page, 1, .2);
    const during = await capture(page);
    assert.ok(during.width < before.width, "native title keeps dezooming");
    assert.equal(await page.locator(".method-title-flight .intro-flight-surface").evaluate(element => element.style.fontSize), font,
      "font size is prepared once, not recalculated per frame");
    await move(page, 1, .55);
    assert.ok((await capture(page)).content.every(item => item.opacity === 1));
    await move(page, 1, .98);
    const after = await capture(page);
    assert.equal(after.opacity, 0);
    assert.ok(after.content.every(item => item.opacity === 0));
    assertNoErrors();
    await page.close();
  } finally { await browser.close(); await server.close(); }
});

test("méthode et conclusion · repli sans timelines natives", async () => {
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
    for (const scene of [0, 1, 2, 3, 0]) {
      await move(page, scene, .55);
      await page.waitForTimeout(300);
      const frame = await capture(page);
      assert.equal(Number(frame.scene), scene);
      assert.equal(frame.opacity, 1);
      assert.ok(frame.content.every(item => item.opacity > .999));
    }
    await page.locator('.method-steps [href="#method-step-3"]').click();
    await page.waitForTimeout(1250);
    assert.equal((await capture(page)).scene, "2");
    await page.locator('.method-steps [href="#method-step-2"]').click();
    await page.waitForTimeout(150);
    assert.equal(await page.locator(".method-stage").getAttribute("data-method-click"), "true");
    await page.mouse.wheel(0, 45);
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".method-stage").getAttribute("data-method-click"), null,
      "manual scrolling interrupts click playback and restores scroll control");
    await page.locator(".reading-conclusion").evaluate(root => {
      const stage = root.querySelector(".conclusion-stage");
      const line = parseFloat(getComputedStyle(stage).top);
      scrollTo({ top: scrollY + root.getBoundingClientRect().top - line +
        root.offsetHeight - stage.offsetHeight, behavior: "instant" });
    });
    await page.waitForTimeout(600);
    assert.ok(await page.locator(".conclusion-stage .intro-flight").evaluateAll(elements =>
      elements.every(element => getComputedStyle(element).opacity === "1")));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await move(page, 3, .98);
    assert.equal((await capture(page)).opacity, 1);
    assertNoErrors();
    await page.close();
  } finally { await browser.close(); await server.close(); }
});
