export const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatSignedPercent = (value: number, digits = 0) =>
  `${value >= 0 ? "+" : "−"}${formatNumber(Math.abs(value), digits)} %`;

export const hasValidInterval = (point: {
  estimate: number;
  low: number;
  high: number;
}) =>
  Number.isFinite(point.low) &&
  Number.isFinite(point.high) &&
  0 <= point.low &&
  point.low <= point.estimate &&
  point.estimate <= point.high &&
  point.high <= 100;

export const formatConfidenceInterval = (point: {
  estimate: number;
  low: number;
  high: number;
}) =>
  hasValidInterval(point)
    ? `IC 95 % : ${formatNumber(point.low)}–${formatNumber(point.high)} %`
    : "IC 95 % indisponible : intervalle incohérent dans la source";
