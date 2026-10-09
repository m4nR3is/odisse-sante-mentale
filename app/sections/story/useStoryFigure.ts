import { storyChartGeometry } from "../../charts/geometry";
import {
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from "react";
import { useStoryDrawing } from "./useStoryDrawing";
import { type StoryScene, type StoryPointInfo } from "./storyTypes";
import { type SeriesPoint } from "../../data/experienceTypes";
import { formatNumber } from "../../charts/format";
import type { StoryData } from "./buildStoryScenes";
export function useStoryFigure(story: StoryData, requestedScene: StoryScene) {
  const maskId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartSize, setChartSize] = useState({ width: 580, height: 320 });
  useLayoutEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const resize = () => {
      const width = container.getBoundingClientRect().width;
      if (!width) return;
      const height = matchMedia("(max-width: 980px)").matches
        ? (Math.min(width, 720) * 320) / 580
        : Math.min((width * 320) / 580, innerHeight * 0.46);
      const viewWidth = (width / height) * 320;
      setChartSize((current) =>
        Math.abs(current.width - viewWidth) < 0.1 &&
        Math.abs(current.height - height) < 0.1
          ? current
          : { width: viewWidth, height },
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const drawing = useStoryDrawing(requestedScene, entered);
  const scene = drawing.scene;
  const [tooltip, setTooltip] = useState<
    (StoryPointInfo & { x: number; y: number }) | null
  >(null);
  useEffect(() => {
    const dismiss = () => setTooltip(null);
    dismiss();
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [requestedScene]);
  const pointEvents = (info: StoryPointInfo, enabled: boolean) => ({
    className: "story-point",
    role: "img" as const,
    tabIndex: enabled ? 0 : -1,
    "aria-label": `${info.label}. ${info.context}. ${info.value}. ${info.detail}`,
    "data-interactive": enabled,
    onPointerMove: (event: ReactPointerEvent<SVGGElement>) => {
      if (enabled) setTooltip({ ...info, x: event.clientX, y: event.clientY });
    },
    onPointerLeave: (event: ReactPointerEvent<SVGGElement>) => {
      if (document.activeElement !== event.currentTarget) setTooltip(null);
    },
    onFocus: (event: ReactFocusEvent<SVGGElement>) => {
      if (!enabled) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      setTooltip({ ...info, x: bounds.left + bounds.width / 2, y: bounds.top });
    },
    onBlur: () => setTooltip(null),
    onKeyDown: (event: { key: string }) => {
      if (event.key === "Escape") setTooltip(null);
    },
  });
  const hospitalInfo = (point: SeriesPoint, label: string): StoryPointInfo => ({
    label,
    context: `${point.year} · Patients hospitalisés en MCO`,
    value: `${formatNumber(point.rate)} pour 100 000`,
    detail: `${formatNumber(point.patients, 0)} patients · ${scene <= 1 ? "Taux standardisé" : "Taux brut par âge et sexe"}`,
  });
  const { national, girls, women, social } = story;
  const boys = scene === 1 ? story.men : story.boys;
  const values = scene === 0 ? national : scene === 1 ? women : girls;
  const { chartUnscale, plotLeft, plotRight, socialWidth, x, y } =
    storyChartGeometry(chartSize.width, chartSize.height, scene);
  return {
    scene,
    svgRef,
    chartSize,
    social,
    values,
    boys,
    drawing,
    maskId,
    x,
    y,
    chartUnscale,
    socialWidth,
    pointEvents,
    plotLeft,
    plotRight,
    hospitalInfo,
    tooltip,
  };
}
export type StoryFigureModel = ReturnType<typeof useStoryFigure>;
