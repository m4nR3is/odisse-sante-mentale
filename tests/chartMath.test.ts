import assert from "node:assert/strict";
import test from "node:test";
import { buildDistributionLayout } from "../app/charts/distributionLayout";
import {
  formatConfidenceInterval,
  formatNumber,
  formatSignedPercent,
  hasValidInterval,
} from "../app/charts/format";
import { createYearLinePath } from "../app/charts/paths";
import { indexSeries } from "../app/data/series";

test("une courbe ne raccorde ni une année manquante ni une rupture déclarée", () => {
  const values = [2019, 2020, 2022, 2023].map((year) => ({ year, rate: 10 }));
  assert.equal(
    createYearLinePath(
      values,
      (p) => p.year,
      (p) => p.rate,
    ),
    "M2019.0,10.0 L2020.0,10.0 M2022.0,10.0 L2023.0,10.0",
  );
  assert.equal(
    createYearLinePath(
      values,
      (p) => p.year,
      (p) => p.rate,
      [2020],
    ),
    "M2019.0,10.0 M2020.0,10.0 M2022.0,10.0 L2023.0,10.0",
  );
});

test("intervalles : ordre des bornes, limites et valeurs non finies", () => {
  const valid = { estimate: 12, low: 10, high: 14 };
  assert.equal(hasValidInterval(valid), true);
  assert.equal(formatConfidenceInterval(valid), "IC 95 % : 10,0–14,0 %");
  for (const point of [
    { estimate: 12, low: 13, high: 14 },
    { estimate: 12, low: -1, high: 14 },
    { estimate: 12, low: 10, high: 101 },
    { estimate: 12, low: NaN, high: 14 },
    { estimate: 12, low: 10, high: Infinity },
  ]) {
    assert.equal(hasValidInterval(point), false);
    assert.match(formatConfidenceInterval(point), /indisponible/);
  }
});

test("formats français : décimales et signe moins typographique", () => {
  assert.equal(formatNumber(12.34), "12,3");
  assert.equal(formatSignedPercent(-12.34, 1), "−12,3 %");
  assert.equal(formatSignedPercent(0), "+0 %");
});

test("indexation : base explicite, repli historique et absence de mutation", () => {
  const series = [
    { year: 2019, rate: 10 },
    { year: 2024, rate: 20 },
  ];
  const before = structuredClone(series);
  assert.deepEqual(
    indexSeries(series, 2019).map((p) => p.rate),
    [100, 200],
  );
  assert.deepEqual(
    indexSeries(series, 2024).map((p) => p.rate),
    [50, 100],
  );
  assert.deepEqual(
    indexSeries(series, 2000).map((p) => p.rate),
    [100, 200],
  );
  // Caractérisation du repli existant ; sa modification serait une correction fonctionnelle.
  assert.deepEqual(indexSeries([{ year: 2019, rate: 0 }], 2019), [
    { year: 2019, rate: 0 },
  ]);
  assert.deepEqual(indexSeries([], 2019), []);
  assert.deepEqual(series, before);
});

test("distribution : collision des points, sélection, cas vide et stabilité", () => {
  const rows = ["01", "02", "03"].map((code) => ({
    department: { code, name: code, region: "", series: [] },
    change: 20,
  }));
  const before = structuredClone(rows);
  const layout = buildDistributionLayout(rows, "02");
  assert.equal(layout.increaseShare, 100);
  assert.deepEqual(
    layout.rows.map((row) => row.department.code),
    ["01", "02", "03"],
  );
  assert.equal(layout.rows[1].radius, 9);
  assert.equal(layout.rows[0].radius, 4.1);
  for (const [index, left] of layout.rows.entries()) {
    for (const right of layout.rows.slice(index + 1)) {
      assert.ok(Math.abs(left.y - right.y) >= left.radius + right.radius);
    }
  }
  assert.deepEqual(buildDistributionLayout(rows, "02"), layout);
  assert.deepEqual(rows, before);
  assert.deepEqual(buildDistributionLayout([], "FR"), {
    rows: [],
    min: 0,
    max: 0,
    increaseShare: 0,
  });
});
