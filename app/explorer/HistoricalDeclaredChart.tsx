import { declaredMeasure } from "../charts/help/chartExplanations";
import {
  hasValidInterval,
  formatNumber,
  formatConfidenceInterval,
} from "../charts/format";
import { type CSSProperties } from "react";
import { createLinePath } from "../charts/paths";
import { ExplorerAnnotation } from "../charts/ReadingAnnotations";
import ViewportTooltip from "../components/ViewportTooltip";
import type { HistoricalDeclaredViewModel } from "./useHistoricalDeclaredView";

type Props = HistoricalDeclaredViewModel["chart"];

export function HistoricalDeclaredChart({
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
}: Props) {
  return (
    <div className="declared-history-chart" ref={previewReveal.ref}>
      <h3>{selectedName}</h3>
      <p>
        {declaredMeasure(indicator)} ·{" "}
        {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()} · 12
        derniers mois · prévalence déclarée
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
                ((isNational ? distributionReveal.progress : reveal.progress) -
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
  );
}
