import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the data experience and its essential safeguards", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /Ce que la moyenne ne dit pas/);
  assert.match(html, /Une rupture, six trajectoires/);
  assert.match(html, /Le poids invisible du quotidien/);
  assert.match(html, /Un pays, cent trajectoires locales/);
  assert.match(html, /Numéro national de prévention du suicide/);
  assert.match(html, /31 14/);
  assert.match(html, /Méthode &amp; limites/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("exposes social sharing metadata", async () => {
  const html = await (await render()).text();
  assert.match(html, /property="og:image" content="\/og-trajectoires\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});
