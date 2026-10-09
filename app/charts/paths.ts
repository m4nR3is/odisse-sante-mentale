export function createLinePath<T>(
  values: T[],
  x: (point: T, index: number) => number,
  y: (point: T) => number,
) {
  return values
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${x(point, index).toFixed(1)},${y(point).toFixed(1)}`,
    )
    .join(" ");
}

export function createYearLinePath<T extends { year: number }>(
  values: T[],
  x: (point: T) => number,
  y: (point: T) => number,
  breakYears: number[] = [],
) {
  return values
    .map(
      (point, index) =>
        `${index && point.year === values[index - 1].year + 1 && !breakYears.includes(point.year) ? "L" : "M"}${x(point).toFixed(1)},${y(point).toFixed(1)}`,
    )
    .join(" ");
}
