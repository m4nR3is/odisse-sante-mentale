import { scrollRangeProgress } from "../animation/progress";
import ChartHelp, {
  socialExplanation,
  declaredMeasure,
  historyExplanation,
} from "../ChartHelp";
import {
  hasValidInterval,
  formatNumber,
  formatConfidenceInterval,
  formatSignedPercent,
} from "../charts/format";
import { createLinePath } from "../charts/paths";
import {
  type ExperienceData,
  type SocialPoint,
  type DeclaredHistoryPoint,
} from "../data/experienceTypes";
import { FINANCIAL_ORDER, FINANCIAL_SHORT } from "../data/indicatorDefinitions";
import { ExplorerAnnotation } from "../ReadingIllustrations";
import TerritoryMap from "../TerritoryMap";
import ViewportTooltip from "../ViewportTooltip";
import { EXPLORER_STEPS } from "./explorerSteps";
import { ScrollIndicator } from "./ScrollIndicator";
import { usePanelReveal } from "./usePanelReveal";
import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
  useId,
  type CSSProperties,
} from "react";

function SocialDeclaredView({
  data,
  indicator,
  onIndicator,
  position,
}: {
  data: ExperienceData;
  indicator: string;
  onIndicator: (indicator: string) => void;
  position: number;
}) {
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
  // Fixed scale within an indicator, so hovering never moves the reference points.
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
  const plotLeft = Math.min(160, chartSize.width * 0.34);
  const plotWidth = Math.max(1, chartSize.width - plotLeft - 90);
  const plotHeight = Math.min(520, chartSize.height - 12);
  const plotOffset = (chartSize.height - plotHeight) / 2;
  const plotTop = plotOffset + Math.min(20, plotHeight * 0.15);
  const plotBottom = plotOffset + plotHeight - 57;
  const rowY = (index: number) =>
    plotTop + (index * (plotBottom - plotTop)) / 3;
  const x = (value: number) => plotLeft + (value / max) * plotWidth;
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
  return (
    <div
      className="declared-explorer social-has-map"
      ref={reveal.ref}
      data-reveal={reveal.progress}
      data-social-region={activeCode}
    >
      <div className="declared-head">
        <p className="chapter">DÉCLARÉ · BAROMÈTRE 2024</p>
        <h3>
          Ce que l’enquête
          <br />
          rend visible
        </h3>
        <p>
          18–79 ans · situation financière perçue.
          <br />
          Survolez une région pour comparer son gradient à la France ; cliquez
          pour la conserver.
        </p>
        <div
          className="declared-indicators"
          role="group"
          aria-label="Indicateur déclaré"
        >
          {indicators.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={indicator === item}
              onClick={() => onIndicator(item)}
            >
              {item}
              <ScrollIndicator
                progress={scrollRangeProgress(
                  position,
                  indicators.indexOf(item),
                )}
              />
            </button>
          ))}
        </div>
        <TerritoryMap
          level="regions"
          signedValues={false}
          items={regions.map((point) => ({
            code: point.territoryCode,
            name: point.territory,
            value: point.estimate,
            available: true,
            detail: `${formatNumber(point.estimate)} % · ${formatConfidenceInterval(point)}`,
          }))}
          selected={selected}
          preview={preview}
          legend="Prévalence régionale · 2024 · %"
          context={`${declaredMeasure(indicator)} · tous profils`}
          onPreview={setPreview}
          onSelect={(code) => {
            setSelected(code);
            setPreview(null);
            setHovered(null);
          }}
        />
        <div className="declared-ratio">
          <strong>
            {ratio == null ? "—" : `× ${formatNumber(ratio * reveal.progress)}`}
          </strong>
          <span>
            {territory} ·{" "}
            {ratio == null
              ? "rapport non calculable : valeur non diffusée"
              : "en difficulté / à l’aise"}
          </span>
        </div>
      </div>
      <div className="declared-chart">
        <p>
          <b>{declaredMeasure(indicator)}</b>
          <span>12 derniers mois · estimation et IC à 95 %</span>
        </p>
        <div className="social-comparison-key">
          <span style={{ color: "var(--reference)" }}>● France</span>
          <span
            className="social-comparison-region"
            aria-hidden={!comparing}
            title={comparing ? territory : undefined}
            style={{ color: preview ? "var(--ink)" : "var(--accent)" }}
          >
            {comparing
              ? `● ${territory}${preview ? " · aperçu" : ""}`
              : "\u00a0"}
          </span>
        </div>
        <svg
          ref={chartSvg}
          viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
          role="img"
          aria-label={`${declaredMeasure(indicator)} selon la situation financière en 2024 · ${territory} et France`}
        >
          {ticks.map((tick) => (
            <g className="declared-grid" key={tick}>
              <line
                x1={x(tick)}
                x2={x(tick)}
                y1={plotTop - 18}
                y2={plotBottom + 36}
              />
              <text x={x(tick)} y={plotBottom + 54} textAnchor="middle">
                {tick} %
              </text>
            </g>
          ))}
          {FINANCIAL_ORDER.map((financial, index) => {
            const progress = Math.max(
              0,
              Math.min(1, (reveal.progress - index * 0.15) / 0.55),
            );
            const cy = rowY(index);
            const local = regional.find(
              (point) => point.financial === financial,
            );
            const annotationPoint =
              index === 0 || index === 3
                ? comparing
                  ? (local ?? national[index])
                  : national[index]
                : undefined;
            const annotationIsNational = !comparing || !local;

            return (
              <g key={financial} opacity={progress}>
                <text className="social-financial-label" x="0" y={cy + 5}>
                  {FINANCIAL_SHORT[financial]}
                </text>
                {[national[index], ...(comparing && local ? [local] : [])].map(
                  (point, series) => {
                    const name = series ? territory : "France";
                    const color = series
                      ? preview
                        ? "var(--ink)"
                        : "var(--accent)"
                      : "var(--reference)";
                    const y = cy + (series ? 22 : 0);
                    const travel = Math.min(1, progress / 0.75);
                    const arrival = Math.max(0, (progress - 0.75) / 0.25);
                    const cx = x(point.estimate * travel);
                    return (
                      <g
                        key={name}
                        className={`declared-row ${series ? "social-regional-point" : "social-national-point"}`}
                        style={{ color }}
                        role="img"
                        tabIndex={progress > 0 ? 0 : -1}
                        aria-label={`${name}, ${FINANCIAL_SHORT[financial]}, ${formatNumber(point.estimate)} %, ${formatConfidenceInterval(point)}`}
                        onPointerMove={(e) => showTooltip(point, name, e)}
                        onPointerLeave={(event) => {
                          if (document.activeElement !== event.currentTarget)
                            setHovered(null);
                        }}
                        onFocus={(e) => showTooltip(point, name, e)}
                        onBlur={() => setHovered(null)}
                      >
                        {hasValidInterval(point) && (
                          <line
                            style={{ stroke: color }}
                            x1={
                              cx +
                              ((point.low - point.estimate) / max) *
                                plotWidth *
                                arrival
                            }
                            x2={
                              cx +
                              ((point.high - point.estimate) / max) *
                                plotWidth *
                                arrival
                            }
                            y1={y}
                            y2={y}
                            opacity={arrival}
                          />
                        )}
                        <circle
                          className="declared-point-hit"
                          cx={cx}
                          cy={y}
                          r="14"
                        />
                        <circle
                          cx={cx}
                          cy={y}
                          r="6.5"
                          style={{ fill: color }}
                        />
                        <text
                          className="declared-value"
                          x={x(point.high) + 9}
                          y={y + 5}
                          style={{ fill: color }}
                        >
                          {formatNumber(point.estimate * travel)} %
                        </text>
                      </g>
                    );
                  },
                )}
                {progress === 1 && annotationPoint && (
                  <ExplorerAnnotation
                    x={x(annotationPoint.estimate)}
                    y={cy + (annotationIsNational ? 0 : 22)}
                  />
                )}
                {comparing && !local && (
                  <text
                    className="social-missing"
                    x={chartSize.width - 64}
                    y={cy + 10}
                  >
                    Non diffusé
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <dl className="evidence-mobile-values">
          {FINANCIAL_ORDER.map((financial, i) => {
            const local = regional.find((p) => p.financial === financial);
            return (
              <div
                key={financial}
                tabIndex={0}
                style={{
                  opacity: Math.max(
                    0,
                    Math.min(1, (reveal.progress - i * 0.15) / 0.55),
                  ),
                }}
                onPointerMove={(e) =>
                  setHovered({
                    x: e.clientX,
                    y: e.clientY,
                    point: local ?? national[i],
                    territory: local ? territory : "France",
                  })
                }
                onPointerLeave={(event) => {
                  if (document.activeElement !== event.currentTarget)
                    setHovered(null);
                }}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setHovered({
                    x: r.left + r.width / 2,
                    y: r.top,
                    point: local ?? national[i],
                    territory: local ? territory : "France",
                  });
                }}
                onBlur={() => setHovered(null)}
              >
                <dt>{FINANCIAL_SHORT[financial]}</dt>
                <dd>
                  <span>France {formatNumber(national[i].estimate)} %</span>
                  {comparing && (
                    <span
                      className="social-mobile-region"
                      style={{
                        color: preview ? "var(--ink)" : "var(--accent)",
                      }}
                    >
                      {territory}{" "}
                      {local
                        ? `${formatNumber(local.estimate)} %`
                        : "non diffusé"}
                    </span>
                  )}
                  <small>
                    {local ? "" : "France · "}
                    {formatConfidenceInterval(local ?? national[i])}
                  </small>
                </dd>
              </div>
            );
          })}
        </dl>
        {hovered && (
          <ViewportTooltip
            x={hovered.x}
            y={hovered.y}
            className="declared-tooltip"
          >
            <span>{FINANCIAL_SHORT[hovered.point.financial]}</span>
            <small>
              {declaredMeasure(indicator)} · {hovered.territory} · 2024
            </small>
            <strong>{formatNumber(hovered.point.estimate)} %</strong>
            <small>{formatConfidenceInterval(hovered.point)}</small>
          </ViewportTooltip>
        )}
        <div className="declared-caution">
          <b>Une association observée</b>
          <span>
            Les écarts ne démontrent ni causalité ni différence statistiquement
            significative.
          </span>
          <span className="social-source-slot">
            {source ? (
              <a href={source} target="_blank" rel="noreferrer">
                Tableau régional · p. {regional[0].sourcePage} ↗
              </a>
            ) : (
              "\u00a0"
            )}
          </span>
        </div>
      </div>
      <p className="monthly-method">
        <b>Lecture.</b> La carte montre les niveaux régionaux ; le graphique
        compare les situations financières. France : hors Mayotte. Sources et
        limites : bouton « ? ».
      </p>
      <ChartHelp key={`${indicator}-${activeCode}`} explanation={explanation} />
    </div>
  );
}

function HistoricalDeclaredView({
  data,
  indicator,
  onIndicator,
  position,
}: {
  data: ExperienceData;
  indicator: string;
  onIndicator: (indicator: string) => void;
  position: number;
}) {
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
  const historyUnscale = historySize.labelSize / 10;
  const historyTickWidth =
    Math.max(
      ...[0, maxValue / 2, maxValue].map(
        (tick) => `${formatNumber(tick, 0)} %`.length,
      ),
    ) * 7.2;
  const historyLeft = (historyTickWidth + 12) * historyUnscale;
  const historyRight = historySize.width - 44 * historyUnscale;
  const x = (year: number) =>
    historyLeft + ((year - 2005) / 16) * (historyRight - historyLeft);
  const y = (value: number) => 218 - (value / maxValue) * 176;
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
  const distributionX = (value: number) =>
    20 +
    ((value - distributionMin) /
      Math.max(0.01, distributionMax - distributionMin)) *
      (distributionSize.width - 40);
  const distributionOrigin = Math.max(
    20,
    Math.min(distributionSize.width - 20, distributionX(0)),
  );
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
  return (
    <div
      className="declared-history"
      ref={reveal.ref}
      data-reveal={reveal.progress}
    >
      <div className="declared-history-controls declared-head">
        <p className="chapter">DÉCLARÉ · BAROMÈTRES 2005–2021</p>
        <h3>
          Ce que l’enquête
          <br />
          rend visible.
        </h3>
        <p>
          Prévalence déclarée chez les 18–75 ans en France hexagonale, selon la
          région et le sexe. Les vagues 2005–2021 restent séparées de 2024, dont
          le protocole diffère.
        </p>
        <div
          className="declared-indicators history-indicators"
          role="group"
          aria-label="Indicateur déclaré historique"
        >
          {indicators.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={indicator === item}
              onClick={() => onIndicator(item)}
            >
              {item}
              <ScrollIndicator
                progress={scrollRangeProgress(
                  position,
                  3 + indicators.indexOf(item),
                )}
              />
            </button>
          ))}
        </div>
        <div className="history-filters">
          <label>
            Territoire
            <select
              value={selectedCode}
              onChange={(event) => setTerritoryCode(event.target.value)}
            >
              <option value="FR">France hexagonale</option>
              {territories.map(([code, name]) => (
                <option value={code} key={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sexe
            <select
              value={sex}
              onChange={(event) => setSex(event.target.value)}
            >
              {sexes.map((item) => (
                <option key={item} value={item}>
                  {item === "Hommes et Femmes" ? "Tous les sexes" : item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TerritoryMap
          legend="Évolution · 2005 → 2021 · pt"
          context={`${indicator} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex}`}
          level="regions"
          selected={selectedCode}
          preview={previewCode}
          items={territories.map(([code, name]) => ({
            code,
            name,
            value: regionChanges.find((point) => point.code === code)?.change,
            detail: regionChanges.find((point) => point.code === code)
              ? `${formatSignedPercent(regionChanges.find((point) => point.code === code)!.change, 1).replace(" %", " pt")} · 2005 → 2021`
              : "Évolution indisponible",
          }))}
          onPreview={setPreviewCode}
          onSelect={setTerritoryCode}
        />
        <div className="declared-history-kpi">
          <strong>
            {change >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(change) * reveal.progress, 1)} pt
          </strong>
          <span>évolution déclarée · 2005 → 2021</span>
          {!isNational && (
            <p className={gap > 0 ? "is-positive" : ""}>
              {gap >= 0 ? "+" : "−"}
              {formatNumber(Math.abs(gap), 1)} pt par rapport à la France en
              2021
            </p>
          )}
        </div>
      </div>
      <div className="declared-history-chart" ref={previewReveal.ref}>
        <h3>{selectedName}</h3>
        <p>
          {declaredMeasure(indicator)} ·{" "}
          {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()} ·
          12 derniers mois · prévalence déclarée
          {selected.some((point) => !hasValidInterval(point)) &&
            " · IC incohérent non affiché"}
        </p>
        <svg
          ref={historySvg}
          style={
            {
              "--history-label-size": `${historySize.labelSize}px`,
            } as CSSProperties
          }
          viewBox={`0 0 ${historySize.width} 270`}
          role="img"
          aria-label={`${indicator}, ${selectedName}${isNational ? "" : " comparée à la France"}, de 2005 à 2021`}
        >
          {[0, maxValue / 2, maxValue].map((tick) => (
            <g className="declared-history-grid" key={tick}>
              <line
                x1={historyLeft}
                x2={historyRight}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text x="0" y={y(tick) + 4 * historyUnscale} textAnchor="start">
                {formatNumber(tick, 0)} %
              </text>
            </g>
          ))}
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={historySize.width}
              height="270"
            >
              <path
                d={createLinePath(
                  selected,
                  (point) => x(point.year),
                  (point) => y(point.estimate),
                )}
                fill="none"
                stroke="white"
                strokeWidth="30"
                pathLength="1"
                strokeDasharray="1 1"
                strokeDashoffset={1 - reveal.progress}
              />
            </mask>
            <mask
              id={`${maskId}-france`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={historySize.width}
              height="270"
            >
              <path
                d={createLinePath(
                  france,
                  (point) => x(point.year),
                  (point) => y(point.estimate),
                )}
                fill="none"
                stroke="white"
                strokeWidth="30"
                pathLength="1"
                strokeDasharray="1 1"
                strokeDashoffset={1 - distributionReveal.progress}
              />
            </mask>
            <mask
              id={`${maskId}-preview`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={historySize.width}
              height="270"
            >
              <path
                d={createLinePath(
                  preview,
                  (point) => x(point.year),
                  (point) => y(point.estimate),
                )}
                fill="none"
                stroke="white"
                strokeWidth="30"
                pathLength="1"
                strokeDasharray="1 1"
                strokeDashoffset={1 - previewReveal.progress}
              />
            </mask>
          </defs>
          <path
            className="declared-history-france"
            mask={`url(#${maskId}-france)`}
            d={createLinePath(
              france,
              (point) => x(point.year),
              (point) => y(point.estimate),
            )}
          />
          {!isNational && (
            <path
              className="declared-history-region"
              mask={`url(#${maskId})`}
              d={createLinePath(
                selected,
                (point) => x(point.year),
                (point) => y(point.estimate),
              )}
            />
          )}
          {preview.length > 0 && (
            <path
              className="declared-history-preview"
              mask={`url(#${maskId}-preview)`}
              data-region={previewName}
              data-reveal={previewReveal.progress}
              d={createLinePath(
                preview,
                (point) => x(point.year),
                (point) => y(point.estimate),
              )}
            />
          )}
          {selected.map((point) => (
            <g
              opacity={Math.max(
                0,
                Math.min(
                  1,
                  ((isNational
                    ? distributionReveal.progress
                    : reveal.progress) -
                    ((point.year - 2005) / 16) * 0.8) /
                    0.2,
                ),
              )}
              className={`declared-history-point${isNational ? " is-national" : ""}`}
              key={point.year}
              role="img"
              aria-label={`${selectedName}, ${point.year}, ${formatNumber(point.estimate)} %, ${formatConfidenceInterval(point)}`}
              tabIndex={0}
              onPointerMove={(event) => showTooltip(event, point, selectedName)}
              onPointerLeave={(event) => {
                if (document.activeElement !== event.currentTarget)
                  setHovered(null);
              }}
              onFocus={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                setHovered({
                  x: bounds.left + bounds.width / 2,
                  y: bounds.top,
                  label: selectedName,
                  year: point.year,
                  estimate: point.estimate,
                  low: point.low,
                  high: point.high,
                });
              }}
              onBlur={() => setHovered(null)}
            >
              {hasValidInterval(point) && (
                <line
                  x1={x(point.year)}
                  x2={x(point.year)}
                  y1={y(point.low)}
                  y2={y(point.high)}
                />
              )}
              <circle cx={x(point.year)} cy={y(point.estimate)} r="5" />
            </g>
          ))}
          {(isNational ? distributionReveal.progress : reveal.progress) === 1 &&
            (() => {
              const point = selected.at(-1);
              if (!point) return null;
              const other = !isNational
                ? france.find((p) => p.year === point.year)
                : undefined;
              return (
                <ExplorerAnnotation
                  x={x(point.year)}
                  y={y(point.estimate)}
                  comparisonY={
                    other && point.year === selected.at(-1)?.year
                      ? y(other.estimate)
                      : undefined
                  }
                  rightX={historyRight + historySize.labelSize * 1.4}
                  bracketSize={historySize.labelSize * 1.5}
                />
              );
            })()}
          {[2005, 2010, 2017, 2021].map((year) => (
            <text
              className="declared-history-year"
              key={year}
              x={x(year)}
              y="258"
              textAnchor="middle"
            >
              {year}
            </text>
          ))}
        </svg>
        <dl className="history-mobile-values">
          {selected.map((point) => (
            <div key={point.year}>
              <dt>{point.year}</dt>
              <dd>
                {formatNumber(point.estimate)} %{" "}
                <small>{formatConfidenceInterval(point)}</small>
              </dd>
            </div>
          ))}
        </dl>
        <div className="legend">
          <span className="france">France</span>
          {!isNational && (
            <span className="department selected-legend">{selectedName}</span>
          )}
          {preview.length > 0 && (
            <span className="department declared-preview-legend">
              {previewName} · aperçu
            </span>
          )}
        </div>
        {hovered && (
          <ViewportTooltip x={hovered.x} y={hovered.y}>
            <span>{hovered.label}</span>
            <small>
              {hovered.year} · {formatConfidenceInterval(hovered)}
            </small>
            <strong>{formatNumber(hovered.estimate)} %</strong>
          </ViewportTooltip>
        )}
      </div>
      <div
        className="declared-history-distribution"
        ref={distributionReveal.ref}
        data-reveal={distributionReveal.progress}
      >
        <small>
          DISTRIBUTION DES ÉVOLUTIONS RÉGIONALES · 2005 → 2021 · EN POINTS
        </small>
        <svg
          ref={distributionRef}
          viewBox={`0 0 ${distributionSize.width} ${distributionSize.height}`}
          role="img"
          aria-label="Choisir une région dans la distribution de son évolution"
        >
          <line
            className="distribution-axis"
            x1="0"
            x2={distributionSize.width}
            y1={distributionSize.height * 0.54}
            y2={distributionSize.height * 0.54}
          />
          {distributionMin <= 0 && distributionMax >= 0 && (
            <>
              <line
                className="zero-marker"
                x1={distributionX(0)}
                x2={distributionX(0)}
                y1="16"
                y2={distributionSize.height - 4}
              />
              <text x={distributionX(0)} y="12" textAnchor="middle">
                0 pt
              </text>
            </>
          )}
          {regionChanges.map((point, index) => (
            <g
              key={point.code}
              className={point.code === selectedCode ? "is-selected" : ""}
              aria-label={`${point.name}, évolution ${formatNumber(point.change)} points. Sélectionner.`}
              role="button"
              tabIndex={0}
              onPointerEnter={(event) => {
                setPreviewCode(point.code);
                setDistributionTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  name: point.name,
                  change: point.change,
                });
              }}
              onPointerMove={(event) => {
                setPreviewCode(point.code);
                setDistributionTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  name: point.name,
                  change: point.change,
                });
              }}
              onPointerLeave={() => {
                setPreviewCode(null);
                setDistributionTooltip(null);
              }}
              onFocus={(event) => {
                setPreviewCode(point.code);
                const bounds = event.currentTarget.getBoundingClientRect();
                setDistributionTooltip({
                  x: bounds.left + bounds.width / 2,
                  y: bounds.top,
                  name: point.name,
                  change: point.change,
                });
              }}
              onBlur={() => {
                setPreviewCode(null);
                setDistributionTooltip(null);
              }}
              onClick={() => setTerritoryCode(point.code)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTerritoryCode(point.code);
                }
              }}
            >
              <circle
                className="history-region-hit"
                cx={
                  distributionOrigin +
                  (distributionX(point.change) - distributionOrigin) *
                    distributionReveal.progress
                }
                cy={
                  distributionSize.height * 0.54 +
                  ((index % 3) - 1) * Math.min(8, distributionSize.height / 6)
                }
                r="12"
              />
              <circle
                className="history-region-dot"
                cx={
                  distributionOrigin +
                  (distributionX(point.change) - distributionOrigin) *
                    distributionReveal.progress
                }
                cy={
                  distributionSize.height * 0.54 +
                  ((index % 3) - 1) * Math.min(8, distributionSize.height / 6)
                }
                r={
                  2 +
                  ((point.code === selectedCode ? 8 : 5) - 2) *
                    distributionReveal.progress
                }
                opacity={distributionReveal.progress}
              />
            </g>
          ))}
        </svg>
        <span>
          {distributionMin >= 0 ? "+" : "−"}
          {formatNumber(Math.abs(distributionMin), 1)} pt
        </span>
        <span>
          {distributionMax >= 0 ? "+" : "−"}
          {formatNumber(Math.abs(distributionMax), 1)} pt
        </span>
      </div>
      {distributionTooltip && (
        <ViewportTooltip
          x={distributionTooltip.x}
          y={distributionTooltip.y}
          className="declared-tooltip"
        >
          <span>{distributionTooltip.name}</span>
          <small>
            {indicator} ·{" "}
            {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()}{" "}
            · 2005 → 2021
          </small>
          <strong>
            {distributionTooltip.change >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(distributionTooltip.change), 1)} pt
          </strong>
          <small>
            Évolution de la prévalence déclarée · sélectionner cette région
          </small>
        </ViewportTooltip>
      )}
      <p className="monthly-method">
        <b>Comparabilité.</b> Les vagues historiques concernent les 18–75 ans.
        Les écarts entre estimations restent à lire avec leurs intervalles de
        confiance. Le Baromètre 2024 repose sur un protocole différent : ses
        valeurs ne sont pas raccordées à ces courbes. Sources : Baromètres de
        Santé publique France 2005, 2010, 2017 et 2021, Odissé.
      </p>
      <ChartHelp
        key={`${indicator}-${selectedCode}-${sex}`}
        explanation={historyExplanation(indicator, selectedName, sex)}
      />
    </div>
  );
}

export function DeclaredExplorer({
  data,
  step,
  onNavigate,
  position,
}: {
  data: ExperienceData;
  step: (typeof EXPLORER_STEPS)[number];
  onNavigate: (index: number) => void;
  position: number;
}) {
  const view = step.view;
  return (
    <div className="declared-shell">
      <div
        className="measure-subnav declared-subnav"
        role="group"
        aria-label="Lecture des données déclarées"
      >
        <button
          type="button"
          aria-pressed={view === "social"}
          onClick={() => onNavigate(0)}
        >
          Inégalités sociales · 2024
          <ScrollIndicator progress={scrollRangeProgress(position, 0, 3)} />
        </button>
        <button
          type="button"
          aria-pressed={view === "history"}
          onClick={() => onNavigate(3)}
        >
          Évolution déclarée · 2005–2021
          <ScrollIndicator progress={scrollRangeProgress(position, 3, 3)} />
        </button>
      </div>
      {view === "social" ? (
        <SocialDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(
              EXPLORER_STEPS.findIndex(
                (candidate) =>
                  candidate.view === "social" &&
                  candidate.indicator === indicator,
              ),
            )
          }
        />
      ) : (
        <HistoricalDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(
              EXPLORER_STEPS.findIndex(
                (candidate) =>
                  candidate.view === "history" &&
                  candidate.indicator === indicator,
              ),
            )
          }
        />
      )}
    </div>
  );
}
