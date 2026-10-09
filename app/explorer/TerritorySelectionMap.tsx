import TerritoryMap from "../maps/TerritoryMap";
import { formatNumber, formatSignedPercent } from "../charts/format";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";
type Props = TerritoryExplorerModel["selection"]["map"];

export function TerritorySelectionMap({
  territoryConfig,
  territoryDataset,
  age,
  sex,
  code,
  hoveredCode,
  metrics,
  setHoveredCode,
  setCode,
  setChartView,
}: Props) {
  return (
    <TerritoryMap
      legend={`Évolution · ${territoryConfig.startYear} → ${territoryConfig.endYear} · ${territoryDataset === "suicides" ? "pt de taux" : "%"}`}
      context={`${territoryConfig.label} · ${age === "Tous" ? "Tous les âges" : age} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex}`}
      level="departments"
      selected={code}
      preview={hoveredCode}
      items={metrics.map((row) => ({
        code: row.department.code,
        name: row.department.name,
        value: row.comparable ? (row.change ?? undefined) : undefined,
        available: row.series.length > 0,
        detail:
          row.comparable && row.change != null
            ? `${territoryDataset === "suicides" ? `${row.change >= 0 ? "+" : "−"}${formatNumber(Math.abs(row.change))} pt` : formatSignedPercent(row.change)} · ${territoryConfig.startYear} → ${territoryConfig.endYear}`
            : "Évolution non interprétable",
      }))}
      onPreview={setHoveredCode}
      onSelect={(nextCode) => {
        setCode(nextCode);
        if (nextCode === "FR") setChartView("level");
      }}
    />
  );
}
