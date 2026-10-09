import type { DeclaredViewProps } from "./explorerTypes";
import ViewportTooltip from "../ViewportTooltip";
import { formatNumber } from "../charts/format";
import ChartHelp, { historyExplanation } from "../ChartHelp";
import { useHistoricalDeclaredView } from "./useHistoricalDeclaredView";
import { HistoricalDeclaredControls } from "./HistoricalDeclaredControls";
import { HistoricalDeclaredChart } from "./HistoricalDeclaredChart";
import { HistoricalDeclaredDistribution } from "./HistoricalDeclaredDistribution";

export function HistoricalDeclaredView(props: DeclaredViewProps) {
  const model = useHistoricalDeclaredView(props);
  const {
    reveal,
    distributionTooltip,
    indicator,
    sex,
    selectedCode,
    selectedName,
  } = model.frame;
  return (
    <div
      className="declared-history"
      ref={reveal.ref}
      data-reveal={reveal.progress}
    >
      <HistoricalDeclaredControls {...model.controls} />
      <HistoricalDeclaredChart {...model.chart} />
      <HistoricalDeclaredDistribution {...model.distribution} />
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
