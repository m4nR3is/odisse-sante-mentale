import { indexSeries } from "./series";
import type { SelectionMetric } from "./territoryMetrics";
import type { ExperienceData, ReferencePoint } from "./experienceTypes";
import {
  compareRates,
  comparisonValue,
  calculateRateDifference,
} from "./comparisons";
import type { TerritoryConfiguration } from "./territoryMetrics";

export function selectReferenceSeries({
  data,
  mode,
  configuration,
  age,
  sex,
  profileAge,
  profileSex,
}: {
  data: Pick<ExperienceData, "odissePatients">;
  mode: "territories" | "profiles" | "declared";
  configuration: TerritoryConfiguration;
  age: string;
  sex: string;
  profileAge: string;
  profileSex: string;
}) {
  return mode === "territories"
    ? configuration.national.filter(
        (point) => point.age === age && point.sex === sex,
      )
    : data.odissePatients
        .filter(
          (point) =>
            point.age === profileAge &&
            point.sex === (profileSex === "Femmes" ? "Hommes" : "Femmes"),
        )
        .sort((a, b) => a.year - b.year);
}

/** Reference availability also gates the level gap, as in the published UI. */
export function calculateReferenceMetrics(
  reference: ReferencePoint[],
  selected: { series: ReferencePoint[] },
  startYear: number,
  endYear: number,
  usesAbsoluteChange: boolean,
  changingCoverage: boolean,
) {
  const referenceFirst = reference.find((point) => point.year === startYear);
  const referenceLast = reference.find((point) => point.year === endYear);
  const selectedFirst = selected.series.find(
    (point) => point.year === startYear,
  );
  const selectedLast = selected.series.find((point) => point.year === endYear);
  const hasNationalReference = Boolean(
    referenceFirst &&
      referenceLast &&
      (usesAbsoluteChange || referenceFirst.rate > 0),
  );
  const nationalComparison = compareRates(referenceFirst, referenceLast, {
    unit: usesAbsoluteChange ? "rate-points" : "percent",
    changingCoverage,
  });
  const hasComparableNationalChange =
    hasNationalReference && nationalComparison.status === "available";
  const nationalChange = comparisonValue(nationalComparison);
  const levelGap =
    hasNationalReference && selectedLast
      ? calculateRateDifference(
          referenceLast!.rate,
          selectedLast.rate,
          usesAbsoluteChange ? "rate-points" : "percent",
        )
      : null;

  return {
    referenceLast,
    selectedFirst,
    selectedLast,
    hasNationalReference,
    hasComparableNationalChange,
    nationalChange,
    levelGap,
    nationalComparison,
  };
}

export function findSelectionMetric(
  metrics: SelectionMetric[],
  code: string,
): SelectionMetric {
  return (
    metrics.find((row) => row.department.code === code) ?? {
      department: {
        code,
        name: "Données indisponibles",
        region: "",
        series: [],
      },
      series: [],
      comparison: {
        status: "unavailable",
        reason: "missing-year",
        unit: "percent",
      },
      change: null,
      comparable: false,
    }
  );
}

export function seriesForChart(
  series: ReferencePoint[],
  startYear: number,
  view: "level" | "change",
  allowIndexed = true,
): ReferencePoint[] {
  return view === "level"
    ? series
    : allowIndexed
      ? indexSeries(series, startYear)
      : [];
}
