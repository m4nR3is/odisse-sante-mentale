import { useRef, useState, useLayoutEffect } from "react";

/** Re-measure after switching views, when the SVG refs attach to new panels. */
export function useTerritoryChartSize(mode: string) {
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const [chartWidth, setChartWidth] = useState(500);
  const [chartLabelSize, setChartLabelSize] = useState(10);
  const distributionSvgRef = useRef<SVGSVGElement>(null);
  const [distributionWidth, setDistributionWidth] = useState(720);
  const [distributionHeight, setDistributionHeight] = useState(160);
  useLayoutEffect(() => {
    const element = chartSvgRef.current;
    if (!element) return;
    const updateWidth = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        setChartWidth((260 * bounds.width) / bounds.height);
        setChartLabelSize((260 * 10) / bounds.height);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);
  useLayoutEffect(() => {
    const element = distributionSvgRef.current;
    if (!element) return;
    const updateWidth = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        setDistributionWidth((160 * bounds.width) / bounds.height);
        setDistributionHeight(bounds.height);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);

  return {
    chartSvgRef,
    chartWidth,
    chartLabelSize,
    distributionSvgRef,
    distributionWidth,
    distributionHeight,
  };
}
