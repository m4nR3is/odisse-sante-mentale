import type { CSSProperties } from "react";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";
import { TerritoryFilters } from "./TerritoryFilters";
import { TerritoryMetric } from "./TerritoryMetric";
import { TerritorySelectionMap } from "./TerritorySelectionMap";

type Props = TerritoryExplorerModel["selection"];
export function TerritorySelectionPanel({
  filterWidth,
  mode,
  filters,
  map,
  metric,
}: Props) {
  return (
    <div
      className="territory-selector"
      style={{ "--filter-width": filterWidth } as CSSProperties}
    >
      <TerritoryFilters {...filters} />
      {mode === "territories" && <TerritorySelectionMap {...map} />}
      <TerritoryMetric {...metric} />
    </div>
  );
}
