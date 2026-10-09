import { formatNumber } from "./format";

/** Territory charts use a 260-unit viewBox; typography stays constant on screen. */
export function territoryChartGeometry({
  width,
  labelSize,
  targetMaxRate,
  previousMax,
  maxRate,
  startYear,
  endYear,
}: {
  width: number;
  labelSize: number;
  targetMaxRate: number;
  previousMax: number;
  maxRate: number;
  startYear: number;
  endYear: number;
}) {
  const chartUnscale = labelSize / 10;
  const tickWidth =
    Math.max(
      ...[0, targetMaxRate / 2, targetMaxRate, previousMax].map(
        (tick) => formatNumber(tick, 0).length,
      ),
    ) * 7.2;
  const plotLeft = (tickWidth + 12) * chartUnscale;
  const plotRight = width - 44 * chartUnscale;
  const x = (point: { year: number }) =>
    plotLeft +
    ((point.year - startYear) / Math.max(1, endYear - startYear)) *
      (plotRight - plotLeft);
  const y = (point: { rate: number }) => 218 - (point.rate / maxRate) * 180;
  return { chartUnscale, plotLeft, plotRight, x, y };
}

/** Historical prevalence has its own 270-unit viewBox and percent tick labels. */
export function historicalChartGeometry(
  width: number,
  labelSize: number,
  maxValue: number,
) {
  const historyUnscale = labelSize / 10;
  const historyTickWidth =
    Math.max(
      ...[0, maxValue / 2, maxValue].map(
        (tick) => `${formatNumber(tick, 0)} %`.length,
      ),
    ) * 7.2;
  const historyLeft = (historyTickWidth + 12) * historyUnscale;
  const historyRight = width - 44 * historyUnscale;
  const x = (year: number) =>
    historyLeft + ((year - 2005) / 16) * (historyRight - historyLeft);
  const y = (value: number) => 218 - (value / maxValue) * 176;
  return { historyUnscale, historyLeft, historyRight, x, y };
}

/** This gradient uses screen pixels, unlike the two time-series charts. */
export function socialChartGeometry(
  width: number,
  height: number,
  max: number,
) {
  const plotLeft = Math.min(160, width * 0.34);
  const plotWidth = Math.max(1, width - plotLeft - 90);
  const plotHeight = Math.min(520, height - 12);
  const plotOffset = (height - plotHeight) / 2;
  const plotTop = plotOffset + Math.min(20, plotHeight * 0.15);
  const plotBottom = plotOffset + plotHeight - 57;
  const rowY = (index: number) =>
    plotTop + (index * (plotBottom - plotTop)) / 3;
  const x = (value: number) => plotLeft + (value / max) * plotWidth;
  return { plotLeft, plotWidth, plotTop, plotBottom, rowY, x };
}

export function distributionGeometry(
  width: number,
  min: number,
  max: number,
  minimumSpan: number,
) {
  const x = (value: number) =>
    20 + ((value - min) / Math.max(minimumSpan, max - min)) * (width - 40);
  const markerX = (value: number) =>
    Math.max(20, Math.min(width - 20, x(value)));
  return { x, markerX };
}

export function storyChartGeometry(
  width: number,
  height: number,
  scene: number,
) {
  const chartUnscale = 320 / height;
  const plotLeft = 36 * chartUnscale;
  const plotRight = width - 46;
  const socialWidth = width - 136 - 62;
  const x = (year: number) =>
    plotLeft + ((year - 2019) / 5) * (plotRight - plotLeft);
  // Changing population changes the scale; scenes 2 and 3 share the girls' curve.
  const ceiling = scene <= 1 ? 150 : 500;
  const y = (rate: number) => 260 - (rate / ceiling) * 206;
  return { chartUnscale, plotLeft, plotRight, socialWidth, x, y };
}
