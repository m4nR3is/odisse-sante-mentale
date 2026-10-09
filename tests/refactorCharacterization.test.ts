import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  ExperienceData,
  ReferencePoint,
} from "../app/data/experienceTypes";
import {
  calculateNationalSelection,
  calculateProfileMetrics,
  calculateTerritoryMetrics,
  getTerritoryConfiguration,
} from "../app/data/territoryMetrics";
import { compareRates, comparisonValue } from "../app/data/comparisons";
import {
  calculateReferenceMetrics,
  selectReferenceSeries,
  seriesForChart,
  findSelectionMetric,
} from "../app/data/territorySelection";
import { buildStoryScenes } from "../app/sections/story/buildStoryScenes";
import {
  territoryChartGeometry,
  historicalChartGeometry,
  socialChartGeometry,
  distributionGeometry,
  storyChartGeometry,
} from "../app/charts/geometry";

const raw = readFileSync("public/data/experience-data.json");
const data: ExperienceData = JSON.parse(raw.toString());
const baseline = JSON.parse(
  readFileSync("tests/fixtures/refactor-pass3.json", "utf8"),
);
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const point = (year: number, rate: number, count = 10): ReferencePoint => ({
  year,
  rate,
  count,
  age: "Tous",
  sex: "Hommes et Femmes",
});

test("caractérisation avant/après : tous les filtres publiés, références et profils", () => {
  assert.equal(
    hash(raw),
    baseline.dataSHA256,
    "Si les données changent, revalider la référence statistique.",
  );
  const records: unknown[] = [];
  for (const dataset of [
    "hospitalisations",
    "emergency",
    "suicides",
  ] as const) {
    const config = getTerritoryConfiguration(data, dataset);
    const filters = [
      ...new Map(
        config.departments.flatMap((department) =>
          department.series.map(
            (p) => [[p.age, p.sex].join("|"), [p.age, p.sex]] as const,
          ),
        ),
      ).values(),
    ].sort((a, b) => a.join("|").localeCompare(b.join("|"), "fr"));
    for (const [age, sex] of filters) {
      const metrics = calculateTerritoryMetrics(config, dataset, age, sex);
      const national = calculateNationalSelection(
        config.national.filter((p) => p.age === age && p.sex === sex),
        config.startYear,
        config.endYear,
        dataset,
      );
      records.push({
        dataset,
        age,
        sex,
        metrics: metrics.map(({ department, series, change, comparable }) => ({
          code: department.code,
          series,
          change,
          comparable,
        })),
        national: {
          series: national.series,
          change: national.change,
          comparable: national.comparable,
        },
      });
    }
  }
  assert.equal(records.length, baseline.filterCombinations);
  records.push(
    calculateProfileMetrics(data).map(
      ({ department, series, change, comparable }) => ({
        code: department.code,
        series,
        change,
        comparable,
      }),
    ),
  );
  assert.equal(hash(JSON.stringify(records)), baseline.metricsSHA256);
});

test("comparaisons : zéro observé, impossibilité et effectif insuffisant restent distincts", () => {
  assert.deepEqual(
    compareRates(point(2019, 12), point(2023, 12), {
      unit: "rate-points",
      requireDeathCounts: true,
    }),
    { status: "available", value: 0, unit: "rate-points" },
  );
  const limited = compareRates(point(2019, 12, 9), point(2023, 15), {
    unit: "rate-points",
    requireDeathCounts: true,
  });
  assert.deepEqual(limited, {
    status: "insufficient-count",
    value: 3,
    unit: "rate-points",
  });
  assert.equal(comparisonValue(limited), 3);
  for (const [first, last, options, reason] of [
    [undefined, point(2024, 10), {}, "missing-year"],
    [point(2019, 0), point(2024, 10), {}, "nonpositive-base"],
    [
      point(2020, 100),
      point(2024, 150),
      { changingCoverage: true },
      "changing-coverage",
    ],
    [point(2019, 1), point(2024, Infinity), {}, "nonfinite-value"],
  ] as const) {
    const result = compareRates(first, last, { unit: "percent", ...options });
    assert.equal(result.status, "unavailable");
    if (result.status === "unavailable") assert.equal(result.reason, reason);
    assert.equal(comparisonValue(result), null);
  }
});

test("référence : périmètre des urgences et écart de niveau séparés", () => {
  const reference = [point(2020, 100), point(2024, 150)];
  const selected = { series: [point(2020, 100), point(2024, 180)] };
  const emergency = calculateReferenceMetrics(
    reference,
    selected,
    2020,
    2024,
    false,
    true,
  );
  assert.equal(emergency.hasNationalReference, true);
  assert.equal(emergency.hasComparableNationalChange, false);
  assert.equal(emergency.nationalChange, null);
  assert.ok(Math.abs(emergency.levelGap! - 20) < 1e-10);
  const deaths = calculateReferenceMetrics(
    [point(2019, 12), point(2023, 15)],
    { series: [point(2019, 13), point(2023, 18)] },
    2019,
    2023,
    true,
    false,
  );
  assert.equal(deaths.nationalChange, 3);
  assert.equal(deaths.levelGap, 3);
  const missing = calculateReferenceMetrics(
    [],
    selected,
    2020,
    2024,
    false,
    false,
  );
  assert.equal(missing.hasNationalReference, false);
  assert.equal(missing.levelGap, null);
  assert.equal(findSelectionMetric([], "75").change, null);
  assert.deepEqual(seriesForChart(reference, 2020, "change", false), []);
  assert.strictEqual(
    seriesForChart(reference, 2020, "level", false),
    reference,
  );
});

test("profils : la référence compare le sexe opposé au même âge", () => {
  const ref = selectReferenceSeries({
    data,
    mode: "profiles",
    configuration: getTerritoryConfiguration(data, "hospitalisations"),
    age: "Tous",
    sex: "Hommes et Femmes",
    profileAge: "11–14 ans",
    profileSex: "Femmes",
  });
  assert.equal(ref.length, 6);
  assert.ok(ref.every((p) => p.age === "11–14 ans" && p.sex === "Hommes"));
  assert.deepEqual(
    ref.map((p) => p.year),
    [2019, 2020, 2021, 2022, 2023, 2024],
  );
});

test("récit : cinq populations, ordre financier, chiffres et absence de mutation", () => {
  const before = structuredClone(data),
    story = buildStoryScenes(data);
  assert.equal(story.scenes.length, 5);
  assert.deepEqual(
    story.scenes.map((s) => s.metric),
    baseline.storyMetrics,
  );
  assert.equal(hash(JSON.stringify(story.scenes)), baseline.storyScenesSHA256);
  for (const series of [
    story.women,
    story.men,
    story.national,
    story.girls,
    story.boys,
  ])
    assert.deepEqual(
      series.map((p) => p.year),
      [2019, 2020, 2021, 2022, 2023, 2024],
    );
  assert.equal(story.social[0], story.comfortable);
  assert.equal(story.social[3], story.difficult);
  assert.ok(
    story.girls.every((p) => p.age === "11–14 ans" && p.sex === "Femmes"),
  );
  assert.deepEqual(data, before);
});

test("géométrie : dates aux extrémités, échelles distinctes et marges écran", () => {
  const territory = territoryChartGeometry({
    width: 720,
    labelSize: 20,
    targetMaxRate: 200,
    previousMax: 500,
    maxRate: 200,
    startYear: 2019,
    endYear: 2024,
  });
  assert.equal(territory.x({ year: 2019 }), territory.plotLeft);
  assert.equal(territory.x({ year: 2024 }), territory.plotRight);
  assert.equal(territory.y({ rate: 0 }), 218);
  assert.equal(territory.y({ rate: 200 }), 38);
  assert.equal(territory.plotRight, 632);
  const history = historicalChartGeometry(720, 20, 30);
  assert.equal(history.x(2005), history.historyLeft);
  assert.equal(history.x(2021), history.historyRight);
  assert.equal(history.y(30), 42);
  const social = socialChartGeometry(390, 260, 32);
  assert.equal(social.rowY(0), social.plotTop);
  assert.equal(social.rowY(3), social.plotBottom);
  assert.equal(social.x(0), social.plotLeft);
  assert.equal(social.x(32), 300);
  const distribution = distributionGeometry(720, -10, 20, 0.001);
  assert.equal(distribution.x(-10), 20);
  assert.equal(distribution.x(20), 700);
  assert.equal(distribution.markerX(999), 700);
  assert.equal(distributionGeometry(720, 0, 0, 0.01).markerX(-1), 20);
  const overview = storyChartGeometry(580, 320, 0),
    girls = storyChartGeometry(580, 320, 2),
    comparison = storyChartGeometry(580, 320, 3);
  assert.equal(overview.y(150), 54);
  assert.equal(girls.y(500), 54);
  assert.equal(girls.y(150), comparison.y(150));
  assert.equal(girls.x(2019), 36);
  assert.equal(girls.x(2024), 534);
});
