import assert from "node:assert/strict";
import test from "node:test";
import { serve, launchBrowser, openExperience } from "./support.mjs";
import { captureExperience } from "./experienceScenarios.mjs";

// A baseline build is optional: the same scenarios also assert behavior on a fresh checkout.
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(
    `parcours, clavier, filtres et récit · ${viewport.width}px`,
    { timeout: 120000 },
    async () => {
      const current = await serve("dist");
      let baseline, browser;
      try {
        if (process.env.TEST_BASELINE_DIR)
          baseline = await serve(process.env.TEST_BASELINE_DIR);
        browser = await launchBrowser();
        const states = [];
        for (const [label, server] of [
          ["reference", baseline],
          ["current", current],
        ]) {
          if (!server) continue;
          const { page, assertNoErrors } = await openExperience(
            browser,
            server.url,
            viewport,
          );
          try {
            states.push(
              await captureExperience(
                page,
                label,
                process.env.BROWSER_ARTIFACT_DIR,
              ),
            );
            assertNoErrors();
          } finally {
            await page.close();
          }
        }
        if (baseline)
          assert.deepEqual(
            states[1],
            states[0],
            "before/after text, SVG, selections and tooltips",
          );
      } finally {
        await browser?.close();
        await baseline?.close();
        await current.close();
      }
    },
  );
}

test("échec du chargement puis reprise", { timeout: 30000 }, async () => {
  const server = await serve("dist");
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/data/experience-data.json", (route) =>
      route.fulfill({ status: 503, body: "" }),
    );
    await page.goto(server.url);
    await page.getByRole("button", { name: "Réessayer" }).waitFor();
    await page.unroute("**/data/experience-data.json");
    await page.getByRole("button", { name: "Réessayer" }).click();
    await page.locator(".experience").waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});
