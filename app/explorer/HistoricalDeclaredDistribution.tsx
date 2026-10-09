import { formatNumber } from "../charts/format";
import type { HistoricalDeclaredViewModel } from "./useHistoricalDeclaredView";

type Props = HistoricalDeclaredViewModel["distribution"];

export function HistoricalDeclaredDistribution({
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
}: Props) {
  return (
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
  );
}
