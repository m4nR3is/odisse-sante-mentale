import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  Department,
  ExperienceData,
  ReferencePoint,
} from "../app/data/experienceTypes";
import {
  calculateNationalSelection,
  calculateProfileMetrics,
  calculateTerritoryMetrics,
  getTerritoryConfiguration,
  type TerritoryDataset,
} from "../app/data/territoryMetrics";

const data: ExperienceData = JSON.parse(
  readFileSync("public/data/experience-data.json", "utf8"),
);
const age = "Tous";
const sex = "Hommes et Femmes";

function point(year: number, rate: number, count = 10): ReferencePoint {
  return { year, rate, count, age, sex };
}

function compare(
  dataset: TerritoryDataset,
  series: ReferencePoint[],
  code = "75",
) {
  const department: Department = {
    code,
    name: "Territoire test",
    region: "Région test",
    series,
  };
  const configuration = {
    ...getTerritoryConfiguration(data, dataset),
    departments: [department],
  };
  return calculateTerritoryMetrics(configuration, dataset, age, sex)[0];
}

test("hospitalisations : évolution relative, base nulle et année manquante", () => {
  assert.ok(
    Math.abs(
      compare("hospitalisations", [point(2019, 100), point(2024, 120)])
        .change! - 20,
    ) < 1e-10,
  );
  for (const series of [
    [point(2019, 0), point(2024, 20)],
    [point(2024, 120)],
  ]) {
    const result = compare("hospitalisations", series);
    assert.equal(result.change, null);
    assert.equal(result.comparable, false);
  }
});

test("décès : évolution en points, seuil de dix aux deux dates, courbe conservée", () => {
  const series = [point(2019, 12), point(2023, 15)];
  assert.equal(compare("suicides", series).change, 3);
  assert.equal(compare("suicides", series).comparable, true);
  assert.equal(
    compare("suicides", [point(2019, 0), point(2023, 15)]).change,
    15,
  );
  for (const lowCountYear of [2019, 2023]) {
    const limited = series.map((value) => ({
      ...value,
      count: value.year === lowCountYear ? 9 : 10,
    }));
    const result = compare("suicides", limited);
    assert.equal(result.change, 3);
    assert.equal(result.comparable, false);
    assert.deepEqual(result.series, limited);
  }
  const unknownCounts = series.map(({ count: _count, ...value }) => value);
  assert.equal(compare("suicides", unknownCounts).comparable, false);
});

test("urgences : départements avec rupture de codage exclus après 2021", () => {
  const series = [
    point(2020, 100),
    point(2021, 110),
    point(2022, 130),
    point(2024, 150),
  ];
  for (const code of ["04", "05", "06", "13", "83", "84", "2A", "2B"]) {
    const result = compare("emergency", series, code);
    assert.deepEqual(
      result.series.map((value) => value.year),
      [2020, 2021],
    );
    assert.equal(result.change, null);
    assert.equal(result.comparable, false);
  }
  assert.equal(compare("emergency", series, "75").change, 50);
});

test("urgences nationales : niveau disponible sans évolution du périmètre variable", () => {
  const reference = [point(2020, 100), point(2024, 150)];
  const result = calculateNationalSelection(reference, 2020, 2024, "emergency");
  assert.equal(result.change, null);
  assert.equal(result.comparable, false);
  assert.deepEqual(result.series, reference);
  assert.equal(
    calculateNationalSelection(reference, 2020, 2024, "hospitalisations")
      .change,
    50,
  );
  assert.equal(
    calculateNationalSelection(reference, 2020, 2024, "suicides").change,
    50,
  );
});

test("filtres : tri chronologique, sélection âge/sexe et absence de mutation", () => {
  const series = [
    point(2024, 120),
    { ...point(2019, 500), sex: "Femmes" },
    point(2019, 100),
  ];
  const before = structuredClone(series);
  assert.deepEqual(
    compare("hospitalisations", series).series.map((value) => value.year),
    [2019, 2024],
  );
  assert.deepEqual(series, before);
});

test("données publiées : seize profils, chiffres du récit et sources immuables", () => {
  const before = structuredClone(data);
  const profiles = calculateProfileMetrics(data);
  assert.equal(profiles.length, 16);
  assert.equal(new Set(profiles.map((row) => row.department.code)).size, 16);
  const girls = profiles.find(
    (row) => row.department.code === "11–14 ans|Femmes",
  )!;
  assert.equal(Math.round(girls.change!), 93);
  for (const dataset of [
    "hospitalisations",
    "emergency",
    "suicides",
  ] as const) {
    const configuration = getTerritoryConfiguration(data, dataset);
    const metrics = calculateTerritoryMetrics(configuration, dataset, age, sex);
    assert.equal(metrics.length, configuration.departments.length);
  }
  assert.deepEqual(data, before);
});
