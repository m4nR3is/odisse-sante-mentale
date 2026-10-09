import { formatNumber } from "../charts/format";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";
type Props = TerritoryExplorerModel["selection"]["metric"];

export function TerritoryMetric({
  measureLabel,
  measureUnit,
  isNationalView,
  territoryDataset,
  referenceLast,
  endYear,
  animatedNationalLevel,
  selected,
  changeLabel,
  startYear,
  formatEvolution,
  animatedChange,
  evolutionUnit,
  selectedFirst,
  selectedLast,
  mode,
  hasNationalReference,
  animatedLevelGap,
  usesAbsoluteChange,
  title,
}: Props) {
  return (
    <div className="territory-summary">
      <div className="metric-definition">
        <b>{measureLabel}</b>
        <span>{measureUnit}</span>
      </div>
      {isNationalView && territoryDataset === "emergency" && referenceLast ? (
        <>
          <span className="metric-period">
            Niveau de la référence couverte · {endYear}
          </span>
          <strong className="animated-number" aria-hidden="true">
            {formatNumber(animatedNationalLevel)}
          </strong>
          <span className="metric-endpoints">
            Pour 100 000 passages codés · périmètre variable.
          </span>
        </>
      ) : selected.comparable ? (
        <>
          <span className="metric-period">
            {changeLabel} · {startYear} → {endYear}
          </span>
          <strong className="animated-number" aria-hidden="true">
            {formatEvolution(animatedChange)}
            {evolutionUnit}
          </strong>
          <span className="metric-endpoints">
            {formatNumber(selectedFirst!.rate)} en {startYear} →{" "}
            {formatNumber(selectedLast!.rate)} en {endYear}
          </span>
        </>
      ) : (
        <div className="low-sample">
          <strong>
            {isNationalView
              ? "Référence indisponible"
              : selected.change == null
                ? "Comparaison indisponible"
                : "Effectif faible"}
          </strong>
          <span>
            {isNationalView ? (
              "Pour ce regroupement d’âge et de sexe."
            ) : (
              <>
                {selected.change == null
                  ? "Deux valeurs comparables sont nécessaires aux dates retenues."
                  : "Moins de 10 décès à l’une des deux dates : évolution non interprétable."}{" "}
                La courbe disponible reste descriptive.
              </>
            )}
          </span>
        </div>
      )}
      {mode === "territories" &&
        !isNationalView &&
        selected.comparable &&
        (hasNationalReference ? (
          <p
            className={`relative-level ${Math.abs(animatedLevelGap) < 0.05 ? "is-neutral" : animatedLevelGap > 0 ? "is-positive" : "is-negative"}`}
          >
            {Math.abs(animatedLevelGap) < 0.05 ? (
              <>
                Au niveau de{" "}
                {territoryDataset === "emergency"
                  ? "la référence nationale couverte"
                  : "la France"}{" "}
                en {endYear}
              </>
            ) : (
              <>
                <b>{formatEvolution(animatedLevelGap)}</b>{" "}
                {usesAbsoluteChange ? "point de taux pour 100 000" : ""} par
                rapport à{" "}
                {territoryDataset === "emergency"
                  ? "la référence nationale couverte"
                  : "la France"}{" "}
                en {endYear}
              </>
            )}
          </p>
        ) : (
          <p className="relative-level is-neutral">
            Référence nationale indisponible pour ce regroupement
          </p>
        ))}
      <span className="sr-only" aria-live="polite">
        {title}. {measureLabel}.{" "}
        {selected.comparable
          ? `${changeLabel} ${formatEvolution(selected.change!)}${evolutionUnit} entre ${startYear} et ${endYear}.`
          : "Évolution non interprétable."}
      </span>
    </div>
  );
}
