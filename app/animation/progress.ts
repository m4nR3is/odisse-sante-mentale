export const scrollRangeProgress = (
  position: number,
  start: number,
  length = 1,
) => Math.max(0, Math.min(1, (position - start) / length));
