import { type CSSProperties } from "react";
import { formatNumber } from "../charts/format";
import { createYearLinePath } from "../charts/paths";
import { ExplorerAnnotation } from "../ReadingIllustrations";
import ViewportTooltip from "../ViewportTooltip";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";

type Props = TerritoryExplorerModel["chart"];

export function TerritoryTimeSeriesChart({
  isNationalView,
  mode,
  selected,
  title,
  measureLabel,
  context,
  usesAbsoluteChange,
  territoryDataset,
  chartView,
  setChartView,
  chartSvgRef,
  chartLabelSize,
  chartWidth,
  referenceLabel,
  axisScale,
  plotLeft,
  plotRight,
  y,
  chartUnscale,
  targetMaxRate,
  animatedReference,
  x,
  reference,
  setChartTooltip,
  chartHoveredSeries,
  hoveredMetric,
  animatedSeries,
  chartSeries,
  territoryConfig,
  startYear,
  endYear,
  chartYears,
  chartReference,
  age,
  chartTooltip,
}: Props) {
  return (
    <div className="territory-chart" data-national={isNationalView}>
      <h3 className="data-change" key={`${mode}-${selected.department.code}`}>
        {title}
      </h3>
      <p className="territory-context">
        {measureLabel} · {context}
      </p>
      {!usesAbsoluteChange &&
        !(isNationalView && territoryDataset === "emergency") && (
          <div
            className="chart-view-toggle"
            role="group"
            aria-label="Mesure affichée"
          >
            <button
              type="button"
              aria-pressed={chartView === "level"}
              onClick={() => setChartView("level")}
            >
              Niveau
            </button>
            <button
              type="button"
              aria-pressed={chartView === "change"}
              onClick={() => setChartView("change")}
            >
              Évolution · base 100
            </button>
          </div>
        )}
      <svg
        ref={chartSvgRef}
        style={
          {
            "--chart-label-size": `${chartLabelSize}px`,
          } as CSSProperties
        }
        viewBox={`0 0 ${chartWidth} 260`}
        role="img"
        aria-label={`${title}, ${chartView === "level" ? "taux réel" : "évolution en base 100"}, ${isNationalView ? "référence nationale" : `comparé à ${referenceLabel}`}`}
      >
        <g
          className="chart-grid chart-grid-old"
          opacity={1 - axisScale.progress}
        >
          {[axisScale.previousMax / 2, axisScale.previousMax].map(
            (tick, index) => (
              <g key={`old-${index}`}>
                <line
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y({ rate: tick })}
                  y2={y({ rate: tick })}
                />
                <text x="0" y={y({ rate: tick }) + 4 * chartUnscale}>
                  {formatNumber(tick, 0)}
                </text>
              </g>
            ),
          )}
        </g>
        <g className="chart-grid chart-grid-new" opacity={axisScale.progress}>
          {[targetMaxRate / 2, targetMaxRate].map((tick, index) => (
            <g key={`new-${index}`}>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y({ rate: tick })}
                y2={y({ rate: tick })}
              />
              <text x="0" y={y({ rate: tick }) + 4 * chartUnscale}>
                {formatNumber(tick, 0)}
              </text>
            </g>
          ))}
        </g>
        <g className="chart-grid chart-grid-zero">
          <line
            x1={plotLeft}
            x2={plotRight}
            y1={y({ rate: 0 })}
            y2={y({ rate: 0 })}
          />
          <text x="0" y={y({ rate: 0 }) + 4 * chartUnscale}>
            0
          </text>
        </g>
        {chartView === "change" && (
          <line
            className="index-baseline"
            x1={plotLeft}
            x2={plotRight}
            y1={y({ rate: 100 })}
            y2={y({ rate: 100 })}
          />
        )}
        <path
          className="national-line"
          d={createYearLinePath(
            animatedReference,
            x,
            y,
            mode === "territories" && territoryDataset === "emergency"
              ? [2022, 2023]
              : [],
          )}
        />
        {mode === "territories" &&
          territoryDataset === "emergency" &&
          !isNationalView &&
          animatedReference.map((point) => {
            const info = {
              label: "France · référence couverte",
              year: point.year,
              rate:
                reference.find((candidate) => candidate.year === point.year)
                  ?.rate ?? point.rate,
            };
            return (
              <g
                className="chart-point"
                key={point.year}
                role="img"
                tabIndex={0}
                aria-label={`${info.label}, ${info.year}, ${formatNumber(info.rate)} pour 100 000 passages codés, périmètre variable`}
                onPointerMove={(event) =>
                  setChartTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    ...info,
                  })
                }
                onPointerLeave={(event) => {
                  if (document.activeElement !== event.currentTarget)
                    setChartTooltip(null);
                }}
                onFocus={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setChartTooltip({
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top,
                    ...info,
                  });
                }}
                onBlur={() => setChartTooltip(null)}
              >
                <circle
                  className="chart-hit"
                  cx={x(point)}
                  cy={y(point)}
                  r="11"
                />
                <circle
                  className="reference-dot"
                  cx={x(point)}
                  cy={y(point)}
                  r="2"
                />
              </g>
            );
          })}
        {mode === "territories" &&
          territoryDataset === "emergency" &&
          [2022, 2023].map((year, index) => {
            const point = animatedReference.find(
              (candidate) => candidate.year === year,
            );
            if (!point) return null;
            const label =
              year === 2022 ? "PACA / Corse exclues" : "Martinique incluse";
            const compact = chartWidth / chartLabelSize < 55;
            return (
              <g className="scope-annotation" key={`scope-${year}`}>
                <title>
                  {year} : changement de périmètre national · {label}
                </title>
                <line
                  x1={x(point)}
                  x2={x(point)}
                  y1={y(point) - 5}
                  y2={y(point) - (compact ? 10 : 24)}
                />
                <text
                  x={x(point)}
                  y={y(point) - (compact ? 14 : 40)}
                  textAnchor="middle"
                >
                  {compact ? (
                    index === 0 ? (
                      "①"
                    ) : (
                      "②"
                    )
                  ) : (
                    <>
                      <tspan x={x(point)}>
                        {index === 0 ? "①" : "②"} Périmètre
                      </tspan>
                      <tspan x={x(point)} dy="1.4em">
                        {label}
                      </tspan>
                    </>
                  )}
                </text>
              </g>
            );
          })}
        {chartHoveredSeries && (
          <path
            key={`${hoveredMetric?.department.code}-${chartView}`}
            className="hover-line"
            d={createYearLinePath(chartHoveredSeries, x, y)}
            aria-hidden="true"
          />
        )}
        {!isNationalView && (
          <path
            className="department-line"
            d={createYearLinePath(animatedSeries, x, y)}
          />
        )}
        {animatedSeries.map((point) => {
          const targetValue =
            chartSeries.find((candidate) => candidate.year === point.year)
              ?.rate ?? point.rate;
          const targetPoint = selected.series.find(
            (candidate) => candidate.year === point.year,
          );
          const pointTooltip = {
            label: selected.department.name,
            year: point.year,
            rate: targetValue,
            count:
              targetPoint && "count" in targetPoint
                ? targetPoint.count
                : undefined,
          };
          const unit =
            chartView === "level"
              ? mode === "territories"
                ? territoryConfig.unit
                : "taux pour 100 000"
              : `indice · ${startYear} = 100`;
          return (
            <g
              key={point.year}
              className="chart-point"
              role="img"
              tabIndex={0}
              aria-label={`${selected.department.name}, ${point.year}, ${formatNumber(targetValue)}, ${unit}`}
              onPointerMove={(event) =>
                setChartTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  ...pointTooltip,
                })
              }
              onPointerLeave={(event) => {
                if (document.activeElement !== event.currentTarget)
                  setChartTooltip(null);
              }}
              onFocus={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                setChartTooltip({
                  x: bounds.left + bounds.width / 2,
                  y: bounds.top,
                  ...pointTooltip,
                });
              }}
              onBlur={() => setChartTooltip(null)}
            >
              <circle
                className="chart-hit"
                cx={x(point)}
                cy={y(point)}
                r="11"
              />
              <circle className="chart-dot" cx={x(point)} cy={y(point)} r="3" />
            </g>
          );
        })}
        {axisScale.progress === 1 &&
          (() => {
            const point = animatedSeries.at(-1);
            if (!point) return null;
            const target = chartSeries.find((p) => p.year === point.year);
            if (!target || Math.abs(point.rate - target.rate) > 0.001)
              return null;
            const other =
              selected.comparable && !isNationalView
                ? animatedReference.find((p) => p.year === point.year)
                : undefined;
            return (
              <ExplorerAnnotation
                x={x(point)}
                y={y(point)}
                comparisonY={
                  other && point.year === endYear ? y(other) : undefined
                }
                rightX={plotRight + chartLabelSize * 1.4}
                bracketSize={chartLabelSize * 1.5}
              />
            );
          })()}
        {chartYears.map((year) => (
          <text
            key={year}
            x={x({ year })}
            y="250"
            textAnchor={
              year === startYear ? "start" : year === endYear ? "end" : "middle"
            }
          >
            {year}
          </text>
        ))}
      </svg>
      <div className="legend">
        {!isNationalView && (
          <span
            className="department selected-legend"
            title={selected.department.name}
          >
            {selected.department.name}
          </span>
        )}
        {chartReference.length > 0 && (
          <span className="france">{referenceLabel}</span>
        )}
        <span
          className={`hovered hovered-slot${hoveredMetric ? "" : " is-empty"}`}
          title={hoveredMetric?.department.name}
        >
          {hoveredMetric?.department.name ?? "Aperçu au survol"}
        </span>
      </div>
      {mode === "territories" && territoryDataset === "emergency" && (
        <p className="chart-scope-note">
          ① 2022 : PACA et Corse exclues. ② 2023 : Martinique incluse. Périmètre
          variable : les segments ne se raccordent pas ; aucune évolution
          nationale calculée.
        </p>
      )}
      {mode === "territories" &&
        territoryDataset === "suicides" &&
        age === "00–17 ans" && (
          <p className="chart-scope-note">
            Référence France non calculable : le taux arrondi à zéro des 0–10
            ans empêche de reconstituer le dénominateur des 0–17 ans.
          </p>
        )}
      {chartTooltip && (
        <ViewportTooltip
          x={chartTooltip.x}
          y={chartTooltip.y}
          className="chart-tooltip"
        >
          <span>{chartTooltip.label}</span>
          <small>
            {chartTooltip.year} ·{" "}
            {chartView === "level"
              ? mode === "territories"
                ? territoryConfig.unit
                : "taux pour 100 000"
              : "indice base 100"}
            {chartTooltip.count != null
              ? ` · effectif diffusé ≈ ${formatNumber(chartTooltip.count, 1)}`
              : ""}
          </small>
          <strong>{formatNumber(chartTooltip.rate)}</strong>
        </ViewportTooltip>
      )}
    </div>
  );
}
