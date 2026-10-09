import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { goExplorerStep, snapshot, focus } from "./support.mjs";

export async function captureExperience(page, label, artifactDir) {
  const states = [];
  const capture = async (name) => {
    await page.waitForTimeout(120);
    states.push({
      scenario: name,
      ...(await snapshot(page.locator(".territory-lab"))),
    });
  };
  const goStep = (step) => goExplorerStep(page, step);
  for (let step = 1; step <= 10; step++) {
    await goStep(step);
    states.push({
      scenario: `step-${step}`,
      ...(await snapshot(page.locator(".territory-lab"))),
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      "horizontal overflow",
    );
    if (artifactDir && [1, 4, 7, 8, 9, 10].includes(step)) {
      await mkdir(artifactDir, { recursive: true });
      await page.screenshot({
        path: join(
          artifactDir,
          `${page.viewportSize().width}-${label}-${step}.png`,
        ),
      });
    }
  }
  for (let step = 10; step >= 1; step--) {
    await goStep(step);
    assert.equal(
      await page.locator(".territory-lab").innerText(),
      states[step - 1].text,
      `reverse step ${step}`,
    );
  }
  const markers = [
    page.locator("#top"),
    ...Array.from({ length: 5 }, (_, scene) =>
      page.locator(`[data-story-step="${scene}"]`),
    ),
    ...Array.from({ length: 4 }, (_, scene) =>
      page.locator(".method-landmarks li").nth(scene),
    ),
    page.locator("#conclusion"),
  ];
  for (const [index, marker] of markers.entries()) {
    await marker.evaluate((element) =>
      scrollTo({
        top:
          scrollY +
          element.getBoundingClientRect().top +
          element.getBoundingClientRect().height * 0.3 -
          innerHeight * 0.3,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(100);
    states.push({
      scenario: `editorial-${index}`,
      ...(await snapshot(page.locator(".experience"))),
    });
  }
  await goStep(8);
  await page.locator("#department").selectOption("75");
  await page.locator("#territory-age").selectOption("18–24 ans");
  await page.locator("#territory-sex").selectOption("Femmes");
  await capture("department-age-sex");
  await page
    .getByRole("button", { name: "Évolution · base 100", exact: true })
    .click();
  await capture("index-100");
  const departmentPath = page.locator(
    '.territory-selector path[data-code="91"]',
  );
  await focus(departmentPath);
  await capture("map-preview");
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#department").inputValue(), "91");
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  await capture("map-keyboard-selection");
  const valuePoint = page
    .locator('.territory-chart g[data-chart-point="value"]')
    .first();
  await focus(valuePoint);
  await page.locator(".chart-tooltip").waitFor();
  await capture("chart-focus-tooltip");
  await page.keyboard.press("Escape");
  await page.locator(".chart-tooltip").waitFor({ state: "detached" });
  await capture("chart-escape");
  const distributionPoint = page.locator(".distribution-point").first();
  await focus(distributionPoint);
  await capture("distribution-preview");
  await page.keyboard.press("Enter");
  await page.evaluate(() => document.activeElement?.blur());
  await capture("distribution-keyboard-selection");
  const saved = await page.locator("#department").inputValue();
  await goStep(10);
  await goStep(8);
  assert.equal(await page.locator("#department").inputValue(), saved);
  assert.equal(await page.locator("#territory-age").inputValue(), "18–24 ans");
  assert.equal(await page.locator("#territory-sex").inputValue(), "Femmes");
  await capture("filter-persistence");
  await goStep(4);
  await page
    .locator(".history-filters select")
    .first()
    .selectOption({ index: 1 });
  await page.locator(".history-filters select").last().selectOption("Femmes");
  await capture("history-region-sex");
  const historicalPoint = page
    .locator('.declared-history-chart g[data-chart-point="value"]')
    .first();
  await focus(historicalPoint);
  await page.locator(".distribution-tooltip").waitFor();
  await capture("history-focus-tooltip");
  await page.keyboard.press("Escape");
  await page.locator(".distribution-tooltip").waitFor({ state: "detached" });
  await goStep(1);
  const regionPath = page
    .locator('.declared-head path.map-territory[role="button"]')
    .first();
  const regionCode = await regionPath.getAttribute("data-code");
  await focus(regionPath);
  await capture("social-region-preview");
  await page.keyboard.press("Enter");
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  assert.equal(
    await page.locator(".declared-explorer").getAttribute("data-social-region"),
    regionCode,
  );
  await capture("social-region-keyboard-selection");
  await goStep(2);
  assert.equal(
    await page.locator(".declared-explorer").getAttribute("data-social-region"),
    regionCode,
  );
  await capture("social-region-persistence");

  return states;
}
