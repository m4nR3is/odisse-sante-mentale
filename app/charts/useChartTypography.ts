import { useLayoutEffect, type RefObject } from "react";

/** Keep type sizes in screen pixels even when an SVG has a scaled viewBox. */
export default function useChartTypography(
  root: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const selector =
      ".story-visual>svg,.declared-chart>svg,.declared-history-chart>svg,.territory-chart>svg,.distribution>svg,.declared-history-distribution>svg";
    const tracked = new Set<SVGSVGElement>();
    let frame = 0;
    const update = () => {
      frame = 0;
      tracked.forEach((svg) => {
        if (!svg.isConnected) {
          observer.unobserve(svg);
          tracked.delete(svg);
          return;
        }
        const matrix = svg.getScreenCTM();
        const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 0;
        if (!scale || !svg.getBoundingClientRect().width) return;
        const dense = svg.getBoundingClientRect().height < 90;
        const sizes = {
          axis: 12,
          label: 16,
          value: 16,
          note: dense ? 9 : 11,
          dot: 6.5,
          hover: 10.5,
          hit: 14,
          distributionDot: 4.5,
          distributionSelected: 7,
        };
        svg.dataset.chartDense = String(dense);
        for (const [name, size] of Object.entries(sizes)) {
          const value = `${(size / scale).toFixed(3)}px`;
          if (svg.style.getPropertyValue(`--chart-${name}`) !== value)
            svg.style.setProperty(`--chart-${name}`, value);
        }
        svg.style.setProperty("--chart-unscale", String(1 / scale));
        svg.dataset.chartType = svg.closest(
          ".distribution,.declared-history-distribution",
        )
          ? "distribution"
          : "main";
        svg.querySelectorAll<SVGGElement>("g[tabindex]").forEach((point) => {
          const circles = Array.from(
            point.querySelectorAll<SVGCircleElement>(":scope>circle"),
          );
          if (!circles.length) return;
          point.dataset.chartPoint =
            svg.dataset.chartType === "distribution" ? "selection" : "value";
          circles.forEach((circle) => {
            if (/hit/.test(circle.getAttribute("class") ?? ""))
              circle.dataset.pointHit = "true";
            else circle.dataset.pointDot = "true";
          });
        });
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    const collect = () => {
      container.querySelectorAll<SVGSVGElement>(selector).forEach((svg) => {
        if (!tracked.has(svg)) {
          tracked.add(svg);
          observer.observe(svg);
        }
      });
      schedule();
    };
    const mutations = new MutationObserver((records) => {
      if (
        records.some((record) =>
          [...record.addedNodes, ...record.removedNodes].some(
            (node) => node instanceof Element,
          ),
        )
      )
        collect();
    });
    mutations.observe(container, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    collect();
    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [root]);
}
