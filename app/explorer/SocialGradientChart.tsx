import { declaredMeasure } from "../charts/help/chartExplanations";
import { FINANCIAL_ORDER, FINANCIAL_SHORT } from "../data/indicatorDefinitions";
import {
  formatNumber,
  formatConfidenceInterval,
  hasValidInterval,
} from "../charts/format";
import { ExplorerAnnotation } from "../charts/ReadingAnnotations";
import ViewportTooltip from "../components/ViewportTooltip";
import type { SocialDeclaredViewModel } from "./useSocialDeclaredView";

type Props = SocialDeclaredViewModel["chart"];

export function SocialGradientChart({
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
}: Props) {
  return (
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
          {comparing ? `● ${territory}${preview ? " · aperçu" : ""}` : "\u00a0"}
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
          const local = regional.find((point) => point.financial === financial);
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
                      <circle cx={cx} cy={y} r="6.5" style={{ fill: color }} />
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
  );
}
