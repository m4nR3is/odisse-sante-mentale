import {
  historicalChartGeometry,
  distributionGeometry,
} from "../charts/geometry";
import type { DeclaredViewProps } from "./explorerTypes";
import { type DeclaredHistoryPoint } from "../data/experienceTypes";
import {
  useState,
  useRef,
  useLayoutEffect,
  type PointerEvent as ReactPointerEvent,
  useId,
  useEffect,
} from "react";
import { hasValidInterval } from "../charts/format";
import { usePanelReveal } from "./usePanelReveal";

export function useHistoricalDeclaredView({
  data,
  indicator,
  onIndicator,
  position,
}: DeclaredViewProps) {
  const indicators = [
    "Dépression",
    "Pensées suicidaires",
    "Tentatives de suicide",
  ];
  const sexes = ["Hommes et Femmes", "Femmes", "Hommes"];
  const [sex, setSex] = useState(sexes[0]);
  const [territoryCode, setTerritoryCode] = useState("FR");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [distributionTooltip, setDistributionTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    change: number;
  } | null>(null);
  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    label: string;
    year: number;
    estimate: number;
    low: number;
    high: number;
  } | null>(null);
  const available = data.declaredHistory.filter(
    (point) => point.indicator === indicator && point.sex === sex,
  );
  const territories = [
    ...new Map(
      available
        .filter((point) => point.territoryCode !== "FR")
        .map((point) => [point.territoryCode, point.territory]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const selectedCode =
    territoryCode === "FR" ||
    territories.some(([code]) => code === territoryCode)
      ? territoryCode
      : "FR";
  const isNational = selectedCode === "FR";
  const selectedName = isNational
    ? "France hexagonale"
    : (territories.find(([code]) => code === selectedCode)?.[1] ?? "Région");
  const selected = available
    .filter((point) => point.territoryCode === selectedCode)
    .sort((a, b) => a.year - b.year);
  const france = available
    .filter((point) => point.territoryCode === "FR")
    .sort((a, b) => a.year - b.year);
  const preview =
    previewCode && previewCode !== selectedCode
      ? available
          .filter((point) => point.territoryCode === previewCode)
          .sort((a, b) => a.year - b.year)
      : [];
  const previewName = territories.find(([code]) => code === previewCode)?.[1];
  const regionChanges = territories
    .map(([code, name]) => {
      const series = available
        .filter((point) => point.territoryCode === code)
        .sort((a, b) => a.year - b.year);
      const first = series.find((point) => point.year === 2005);
      const last = series.find((point) => point.year === 2021);
      return first && last
        ? { code, name, change: last.estimate - first.estimate }
        : null;
    })
    .filter((point): point is { code: string; name: string; change: number } =>
      Boolean(point),
    )
    .sort((a, b) => a.change - b.change);
  const first = selected[0];
  const last = selected.at(-1);
  const franceLast = france.at(-1);
  const change = first && last ? last.estimate - first.estimate : 0;
  const gap = last && franceLast ? last.estimate - franceLast.estimate : 0;
  const maxValue =
    Math.max(
      1,
      ...available.map((point) =>
        hasValidInterval(point) ? point.high : point.estimate,
      ),
    ) * 1.18;
  const historySvg = useRef<SVGSVGElement>(null);
  const [historySize, setHistorySize] = useState({ width: 720, labelSize: 10 });
  useLayoutEffect(() => {
    const svg = historySvg.current;
    if (!svg) return;
    const resize = () => {
      const bounds = svg.getBoundingClientRect();
      if (bounds.height > 0 && bounds.width > 0)
        setHistorySize({
          width: (270 * bounds.width) / bounds.height,
          labelSize: (270 * 10) / bounds.height,
        });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(svg);
    resize();
    return () => observer.disconnect();
  }, []);
  const { historyUnscale, historyLeft, historyRight, x, y } =
    historicalChartGeometry(historySize.width, historySize.labelSize, maxValue);
  const distributionMin = regionChanges.length
    ? Math.min(...regionChanges.map((point) => point.change))
    : 0;
  const distributionMax = regionChanges.length
    ? Math.max(...regionChanges.map((point) => point.change))
    : 0;
  const distributionRef = useRef<SVGSVGElement>(null);
  const [distributionSize, setDistributionSize] = useState({
    width: 720,
    height: 100,
  });
  useLayoutEffect(() => {
    const svg = distributionRef.current;
    if (!svg) return;
    const update = () => {
      const bounds = svg.getBoundingClientRect();
      setDistributionSize({
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    update();
    return () => observer.disconnect();
  }, []);
  const { x: distributionX, markerX } = distributionGeometry(
    distributionSize.width,
    distributionMin,
    distributionMax,
    0.01,
  );
  const distributionOrigin = markerX(0);
  const showTooltip = (
    event: ReactPointerEvent<SVGGElement>,
    point: DeclaredHistoryPoint,
    label: string,
  ) =>
    setHovered({
      x: event.clientX,
      y: event.clientY,
      label,
      year: point.year,
      estimate: point.estimate,
      low: point.low,
      high: point.high,
    });
  const reveal = usePanelReveal(`${indicator}|${sex}|${selectedCode}`);
  const distributionReveal = usePanelReveal(`${indicator}|${sex}`);
  const previewReveal = usePanelReveal(
    `${indicator}|${sex}|${previewCode ?? ""}`,
  );
  const maskId = useId();
  useEffect(() => {
    setHovered(null);
    setDistributionTooltip(null);
    setPreviewCode(null);
  }, [indicator, sex, selectedCode]);

  // Les commandes et graphiques partagent ces états sans les dupliquer.
  return {
    controls: {
      indicators,
      indicator,
      onIndicator,
      position,
      selectedCode,
      setTerritoryCode,
      territories,
      sex,
      setSex,
      sexes,
      previewCode,
      regionChanges,
      setPreviewCode,
      change,
      reveal,
      isNational,
      gap,
    },
    chart: {
      previewReveal,
      selectedName,
      indicator,
      sex,
      selected,
      historySvg,
      historySize,
      isNational,
      maxValue,
      historyLeft,
      historyRight,
      y,
      historyUnscale,
      maskId,
      x,
      reveal,
      france,
      distributionReveal,
      preview,
      previewName,
      showTooltip,
      setHovered,
      hovered,
    },
    distribution: {
      distributionReveal,
      distributionRef,
      distributionSize,
      distributionMin,
      distributionMax,
      distributionX,
      regionChanges,
      selectedCode,
      setPreviewCode,
      setDistributionTooltip,
      setTerritoryCode,
      distributionOrigin,
    },
    frame: {
      reveal,
      distributionTooltip,
      indicator,
      sex,
      selectedCode,
      selectedName,
    },
  };
}

export type HistoricalDeclaredViewModel = ReturnType<
  typeof useHistoricalDeclaredView
>;
