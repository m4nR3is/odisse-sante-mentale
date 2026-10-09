import assert from "node:assert/strict";
import test from "node:test";
import {
  serve,
  launchBrowser,
  openExperience,
  goExplorerStep,
  focus,
} from "./support.mjs";

test(
  "commandes de navigation, carte au clavier et chargement partagé des contours",
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
      );
      await goExplorerStep(page, 1);
      const lab = page.locator(".territory-lab");
      const commands = [
        ["Urgences", 6],
        ["Hôpital", 7],
        ["Patients · âge × sexe", 8],
        ["Séjours · départements", 7],
        ["Décès", 9],
        ["Déclaré", 0],
        ["Évolution déclarée", 3],
        ["Inégalités sociales", 0],
      ];
      for (const [name, step] of commands) {
        await lab.getByRole("button", { name: new RegExp(name) }).click();
        await page.waitForFunction(
          (step) =>
            document
              .querySelector(".territory-lab")
              ?.getAttribute("data-step") === String(step),
          step,
        );
      }
      await goExplorerStep(page, 8);
      const department = page.locator(
        '.territory-selector path[data-code="91"]',
      );
      await focus(department);
      await page.keyboard.press(" ");
      assert.equal(await page.locator("#department").inputValue(), "91");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#department").inputValue(), "FR");
      await page.locator("#department").selectOption("91");
      // Dispatch on the background explicitly, away from a data-code territory.
      await page
        .locator(".territory-selector svg")
        .evaluate((svg) =>
          svg.dispatchEvent(new MouseEvent("click", { bubbles: true })),
        );
      assert.equal(await page.locator("#department").inputValue(), "FR");
      assert.equal(
        await page.evaluate(
          () =>
            performance
              .getEntriesByType("resource")
              .filter((entry) => entry.name.endsWith("/data/geography.json"))
              .length,
        ),
        1,
      );
      assertNoErrors();
    } finally {
      await browser?.close();
      await server.close();
    }
  },
);

test(
  "échec des contours : les menus restent utilisables sans nouvelle requête",
  { timeout: 30000 },
  async () => {
    const server = await serve("dist");
    let browser;
    try {
      browser = await launchBrowser();
      const page = await browser.newPage({ reducedMotion: "reduce" });
      const errors = [];
      let requests = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/data/geography.json", (route) => {
        requests++;
        return route.fulfill({ status: 503, body: "" });
      });
      await page.goto(server.url, { waitUntil: "networkidle" });
      await page.locator(".map-loading").waitFor();
      assert.match(
        await page.locator(".map-loading").innerText(),
        /Carte indisponible/,
      );
      await goExplorerStep(page, 8);
      await page.locator("#department").selectOption("91");
      assert.equal(await page.locator("#department").inputValue(), "91");
      await goExplorerStep(page, 4);
      await page.locator(".map-loading").waitFor();
      assert.equal(requests, 1);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
      await server.close();
    }
  },
);
