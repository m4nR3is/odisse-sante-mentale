import { formatNumber } from "../charts/format";
import ViewportTooltip from "../ViewportTooltip";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";

type Props = TerritoryExplorerModel["distribution"];

export function TerritoryDistributionChart({
  usesAbsoluteChange,
  startYear,
  endYear,
  mode,
  isNationalView,
  activeMetrics,
  increaseShare,
  distributionSvgRef,
  distributionWidth,
  moveAcrossDistribution,
  setHoveredCode,
  setTooltip,
  chooseClosestDistributionItem,
  distributionX,
  evolutionUnit,
  hasComparableNationalChange,
  nationalMarkerX,
  formatEvolution,
  animatedNationalChange,
  animatedDistribution,
  selected,
  selectDistributionItem,
  hoveredCode,
  tooltip,
  distributionMin,
  distributionMax,
}: Props) {
  return (
    <div className="distribution">
      <small className="distribution-kicker">
        Distribution des {usesAbsoluteChange ? "écarts de taux" : "évolutions"}{" "}
        · {startYear} → {endYear}
      </small>
      <p className="distribution-explanation">
        {mode === "territories"
          ? `Un point = un département avec une évolution calculable aux deux dates${usesAbsoluteChange ? " et au moins 10 décès à chacune" : ""}. ${isNationalView ? "Survolez un point pour révéler sa courbe, cliquez pour sélectionner ce département." : "Le point orange est votre sélection."} Le repère France apparaît lorsque son évolution est comparable.`
          : "Un point = un groupe d’âge et de sexe. Le point orange est votre sélection ; la courbe en pointillés montre l’autre sexe au même âge."}
      </p>
      {activeMetrics.length ? (
        <p>
          <b>{formatNumber(increaseShare)} %</b>{" "}
          {mode === "territories"
            ? `des ${activeMetrics.length} départements retenus augmentent pour cette sélection.`
            : `des ${activeMetrics.length} trajectoires âge × sexe augmentent entre ${startYear} et ${endYear}.`}
        </p>
      ) : (
        <p className="no-comparison">
          Aucun département ne remplit les conditions de comparaison pour cette
          sélection.
        </p>
      )}
      <svg
        ref={distributionSvgRef}
        viewBox={`0 0 ${distributionWidth} 160`}
        aria-label={
          mode === "territories"
            ? "Choisir un département dans la distribution de leurs évolutions. La France est indiquée comme second repère lorsqu’elle est comparable."
            : "Choisir un profil âge et sexe dans la distribution de leurs évolutions."
        }
        onPointerMove={moveAcrossDistribution}
        onPointerLeave={() => {
          setHoveredCode(null);
          setTooltip(null);
        }}
        onPointerUp={chooseClosestDistributionItem}
      >
        <rect
          className="distribution-interaction"
          x="0"
          y="0"
          width={distributionWidth}
          height="160"
        />
        <line
          className="distribution-axis"
          x1="0"
          x2={distributionWidth}
          y1="80"
          y2="80"
        />
        <line
          className="zero-marker"
          x1={distributionX(0)}
          x2={distributionX(0)}
          y1="24"
          y2="140"
        />
        <text
          className="zero-label"
          x={distributionX(0)}
          y="17"
          textAnchor="middle"
        >
          0{evolutionUnit || " %"}
        </text>
        {mode === "territories" && hasComparableNationalChange && (
          <>
            <line
              className="national-marker"
              x1={nationalMarkerX}
              x2={nationalMarkerX}
              y1="35"
              y2="140"
            />
            <text
              className="national-marker-label"
              x={nationalMarkerX}
              y="29"
              textAnchor="middle"
            >
              France {formatEvolution(animatedNationalChange)}
              {evolutionUnit}
            </text>
          </>
        )}
        {[...animatedDistribution.rows]
          .sort((a, b) =>
            a.department.code === selected.department.code
              ? 1
              : b.department.code === selected.department.code
                ? -1
                : 0,
          )
          .map((row) => {
            const isSelected = row.department.code === selected.department.code;
            const selectItem = () =>
              selectDistributionItem(row.department.code);
            const tooltipData = {
              department: row.department.name,
              region: row.department.region,
              change: row.targetChange,
            };
            return (
              <g
                key={row.department.code}
                className={`distribution-point${isSelected ? " selected" : ""}${hoveredCode === row.department.code ? " is-hovered" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${row.department.name}, ${row.department.region}, évolution ${formatEvolution(row.targetChange)}${evolutionUnit}. Sélectionner.`}
                onFocus={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setHoveredCode(row.department.code);
                  setTooltip({
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top,
                    ...tooltipData,
                  });
                }}
                onBlur={() => {
                  setHoveredCode(null);
                  setTooltip(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectItem();
                  }
                }}
              >
                <circle
                  className="distribution-dot"
                  cx={distributionX(row.change)}
                  cy={row.y}
                  r={row.radius}
                >
                  <title>
                    {row.department.name} · {row.department.region} :{" "}
                    {formatEvolution(row.targetChange)}
                    {evolutionUnit}
                  </title>
                </circle>
              </g>
            );
          })}
      </svg>
      {tooltip && (
        <ViewportTooltip x={tooltip.x} y={tooltip.y}>
          <span>{tooltip.department}</span>
          <small>{tooltip.region}</small>
          <strong>
            {formatEvolution(tooltip.change)}
            {evolutionUnit}
          </strong>
        </ViewportTooltip>
      )}
      <span>
        {formatEvolution(distributionMin)}
        {evolutionUnit}
      </span>
      <span>
        {formatEvolution(distributionMax)}
        {evolutionUnit}
      </span>
    </div>
  );
}
