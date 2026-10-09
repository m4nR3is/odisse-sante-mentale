import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EXPLORER_STEPS,
  entryStepForMode,
  entryStepForDataset,
  entryStepForFamily,
  declaredStepIndex,
  declaredScrollRange,
  familyScrollRange,
  measureFamilyFor,
} from "../app/explorer/explorerSteps";
import {
  mapColorScale,
  formatMapValue,
  preferBottomInsets,
  mapFeatureTransform,
  type Geography,
} from "../app/maps/mapModel";

test("les commandes gardent leurs destinations dans les dix étapes de scroll", () => {
  assert.equal(new Set(EXPLORER_STEPS.map((step) => step.id)).size, 10);
  assert.deepEqual(
    (["declared", "territories", "profiles"] as const).map(entryStepForMode),
    [0, 7, 8],
  );
  assert.deepEqual(
    (["hospitalisations", "emergency", "suicides"] as const).map(
      entryStepForDataset,
    ),
    [7, 6, 9],
  );
  assert.deepEqual(
    (["declared", "emergency", "hospital", "deaths"] as const).map(
      entryStepForFamily,
    ),
    [0, 6, 7, 9],
  );
});

test("les indicateurs déclarés et leurs plages de progression restent alignés", () => {
  assert.deepEqual(declaredScrollRange("social"), { start: 0, count: 3 });
  assert.deepEqual(declaredScrollRange("history"), { start: 3, count: 3 });
  for (const [index, step] of EXPLORER_STEPS.slice(0, 6).entries())
    assert.equal(declaredStepIndex(step.view, step.indicator), index);
  assert.equal(declaredStepIndex("social", "Tentatives de suicide"), -1);
  assert.deepEqual(
    (["declared", "emergency", "hospital", "deaths"] as const).map(
      familyScrollRange,
    ),
    [
      { start: 0, count: 6 },
      { start: 6, count: 1 },
      { start: 7, count: 2 },
      { start: 9, count: 1 },
    ],
  );
  assert.equal(measureFamilyFor("profiles", "emergency"), "hospital");
});

test("les gris excluent les valeurs manquantes et gardent le cas constant", () => {
  const items = [-10, 0, 10, undefined, NaN, Infinity].map((value, index) => ({
    code: String(index),
    name: String(index),
    value,
  }));
  const scale = mapColorScale(items, "missing");
  assert.deepEqual([scale.low, scale.high, scale.hasValues], [-10, 10, true]);
  assert.deepEqual(items.map(scale.color), [
    "rgb(220, 220, 220)",
    "rgb(135, 135, 135)",
    "rgb(50, 50, 50)",
    "url(#missing)",
    "url(#missing)",
    "url(#missing)",
  ]);
  const constant = mapColorScale([items[1]], "missing");
  assert.equal(constant.color(items[1]), "rgb(135, 135, 135)");
  const empty = mapColorScale(items.slice(3), "missing");
  assert.deepEqual([empty.low, empty.high, empty.hasValues], [0, 0, false]);
  assert.equal(empty.color(), "url(#missing)");
  assert.deepEqual(
    [-1.24, 0, 1.24].map((value) => formatMapValue(value, true)),
    ["−1,2", "+0", "+1,2"],
  );
  assert.equal(formatMapValue(1.24, false), "1,2");
});

test("les deux dispositions géographiques sont identiques à la version publiée", () => {
  const raw = readFileSync("public/data/geography.json");
  const geography: Geography = JSON.parse(raw.toString());
  const baseline = JSON.parse(
    readFileSync("tests/fixtures/refactor-pass5-map.json", "utf8"),
  );
  const hash = (value: Buffer | string) =>
    createHash("sha256").update(value).digest("hex");
  assert.equal(hash(raw), baseline.geographySHA256);
  const records = [];
  for (const level of ["departments", "regions"] as const)
    for (const bottom of [false, true])
      for (const feature of geography[level].features)
        records.push([
          level,
          bottom,
          feature.code,
          mapFeatureTransform(feature, geography[level], bottom),
        ]);
  assert.equal(hash(JSON.stringify(records)), baseline.transformsSHA256);
  for (const { width, height, bottom } of baseline.dimensions)
    assert.equal(
      preferBottomInsets(width, height),
      bottom,
      `${width} × ${height}`,
    );
});
