import type { ReferencePoint } from "./experienceTypes";

export type ComparisonUnit = "percent" | "rate-points";
export type ComparisonResult =
  | { status: "available"; value: number; unit: ComparisonUnit }
  | { status: "insufficient-count"; value: number; unit: ComparisonUnit }
  | {
      status: "unavailable";
      reason:
        | "missing-year"
        | "nonpositive-base"
        | "changing-coverage"
        | "nonfinite-value";
      unit: ComparisonUnit;
    };

/** A low death count excludes a comparison, but keeps the observed difference and curve. */
export function compareRates(
  first: ReferencePoint | undefined,
  last: ReferencePoint | undefined,
  {
    unit,
    requireDeathCounts = false,
    changingCoverage = false,
  }: {
    unit: ComparisonUnit;
    requireDeathCounts?: boolean;
    changingCoverage?: boolean;
  },
): ComparisonResult {
  if (changingCoverage)
    return { status: "unavailable", reason: "changing-coverage", unit };
  if (!first || !last)
    return { status: "unavailable", reason: "missing-year", unit };
  if (unit === "percent" && first.rate <= 0) {
    return { status: "unavailable", reason: "nonpositive-base", unit };
  }
  const value = calculateRateDifference(first.rate, last.rate, unit);
  if (!Number.isFinite(value))
    return { status: "unavailable", reason: "nonfinite-value", unit };
  if (
    requireDeathCounts &&
    ((first.count ?? 0) < 10 || (last.count ?? 0) < 10)
  ) {
    return { status: "insufficient-count", value, unit };
  }
  return { status: "available", value, unit };
}

export function comparisonValue(result: ComparisonResult): number | null {
  return result.status === "unavailable" ? null : result.value;
}

/** Callers establish availability and denominator validity before displaying a difference. */
export function calculateRateDifference(
  first: number,
  last: number,
  unit: ComparisonUnit,
): number {
  return unit === "rate-points" ? last - first : 100 * (last / first - 1);
}
