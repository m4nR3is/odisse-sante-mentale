import { socialChartGeometry } from "../charts/geometry";
import type { DeclaredViewProps } from "./explorerTypes";
import { type SocialPoint } from "../data/experienceTypes";
import { usePanelReveal } from "./usePanelReveal";
import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from "react";
import { FINANCIAL_ORDER } from "../data/indicatorDefinitions";
import { hasValidInterval } from "../charts/format";
import { socialExplanation } from "../charts/help/chartExplanations";

export function useSocialDeclaredView({
  data,
  indicator,
  onIndicator,
  position,
}: DeclaredViewProps) {
  const indicators = ["Dépression", "Anxiété", "Pensées suicidaires"];
  const reveal = usePanelReveal(indicator);
  const chartSvg = useRef<SVGSVGElement>(null);
  const [chartSize, setChartSize] = useState({ width: 720, height: 260 });
  useLayoutEffect(() => {
    const element = chartSvg.current;
    if (!element) return;
    const update = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0)
        setChartSize((current) =>
          Math.abs(current.width - bounds.width) < 0.5 &&
          Math.abs(current.height - bounds.height) < 0.5
            ? current
            : { width: bounds.width, height: bounds.height },
        );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [selected, setSelected] = useState("FR");
  const [preview, setPreview] = useState<string | null>(null);
  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    point: SocialPoint;
    territory: string;
  } | null>(null);
  useEffect(() => {
    setHovered(null);
    setPreview(null);
  }, [indicator]);
  const regions = data.socialRegions.filter(
    (point) => point.indicator === indicator,
  );
  const activeCode = preview ?? selected;
  const regional = data.regionalSocial.filter(
    (point) =>
      point.indicator === indicator && point.territoryCode === activeCode,
  );
  const territory =
    regions.find((point) => point.territoryCode === activeCode)?.territory ??
    "France";
  const national = FINANCIAL_ORDER.map(
    (financial) =>
      data.social.find(
        (point) =>
          point.indicator === indicator && point.financial === financial,
      )!,
  );
  const comparing = activeCode !== "FR";
  const active = comparing ? regional : national;
  const first = active.find((p) => p.financial === FINANCIAL_ORDER[0]);
  const last = active.find((p) => p.financial === FINANCIAL_ORDER[3]);
  const ratio =
    first && last && first.estimate > 0 ? last.estimate / first.estimate : null;
  const scalePoints = [
    ...national,
    ...data.regionalSocial.filter((p) => p.indicator === indicator),
  ];
  const max = Math.max(
    5,
    Math.ceil(
      Math.max(
        ...scalePoints.map((p) => (hasValidInterval(p) ? p.high : p.estimate)),
      ),
    ),
  );
  const tickStep = max > 30 ? 10 : 5;
  const ticks = Array.from(
    { length: Math.floor(max / tickStep) + 1 },
    (_, index) => index * tickStep,
  );
  const { plotWidth, plotTop, plotBottom, rowY, x } = socialChartGeometry(
    chartSize.width,
    chartSize.height,
    max,
  );
  const source = regional[0]?.source;
  const explanation = socialExplanation(indicator);
  if (comparing) {
    explanation.population += ` Comparaison affichée : ${territory}.`;
    if (source)
      explanation.sources.push({
        label: `${territory} · tableau régional · page ${regional[0].sourcePage}`,
        url: source,
      });
  }
  explanation.reading +=
    " La carte colore la prévalence régionale tous profils confondus, pas celle d’une catégorie financière. Le survol compare le gradient régional à la France ; un clic conserve la région. Les niveaux de gris et les écarts visibles ne constituent pas un test statistique.";
  explanation.limits +=
    " Les tableaux régionaux publient des estimations pondérées et leurs IC à 95 %. Une cellule non diffusée reste absente ; ce n’est pas zéro. Les petits échantillons peuvent donner des intervalles larges.";
  const showTooltip = (
    point: SocialPoint,
    name: string,
    event: ReactPointerEvent<SVGGElement> | ReactFocusEvent<SVGGElement>,
  ) => {
    const b = event.currentTarget.getBoundingClientRect();
    setHovered({
      x: "clientX" in event ? event.clientX : b.left + b.width / 2,
      y: "clientY" in event ? event.clientY : b.top,
      point,
      territory: name,
    });
  };

  // Les commandes et graphiques partagent ces états sans les dupliquer.
  return {
    controls: {
      indicators,
      indicator,
      onIndicator,
      position,
      regions,
      selected,
      preview,
      setPreview,
      setSelected,
      setHovered,
      ratio,
      reveal,
      territory,
    },
    chart: {
      indicator,
      comparing,
      territory,
      preview,
      chartSvg,
      chartSize,
      ticks,
      x,
      plotTop,
      plotBottom,
      reveal,
      rowY,
      regional,
      national,
      showTooltip,
      setHovered,
      max,
      plotWidth,
      hovered,
      source,
    },
    frame: { reveal, activeCode, indicator, explanation },
  };
}

export type SocialDeclaredViewModel = ReturnType<typeof useSocialDeclaredView>;
