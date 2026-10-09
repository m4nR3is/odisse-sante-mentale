export function indexSeries<T extends { year: number; rate: number }>(
  series: T[],
  baselineYear: number,
) {
  // Repli historique conservé : première valeur, puis zéro si aucune base positive.
  const baseline =
    series.find((point) => point.year === baselineYear)?.rate ??
    series[0]?.rate ??
    0;
  return series.map((point) => ({
    ...point,
    rate: baseline > 0 ? (point.rate / baseline) * 100 : 0,
  }));
}
