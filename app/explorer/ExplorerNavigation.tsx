import { ScrollIndicator } from "./ScrollIndicator";
import { scrollRangeProgress } from "../animation/progress";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";

type Props = TerritoryExplorerModel["navigation"];

export function ExplorerNavigation({
  family,
  chooseMeasureFamily,
  scrollPosition,
  mode,
  switchTerritoryDataset,
  switchMode,
}: Props) {
  return (
    <div className="explorer-navigation">
      <div
        className="explorer-mode data-types"
        role="group"
        aria-label="Choisir une mesure de santé mentale"
      >
        <button
          type="button"
          aria-pressed={family === "declared"}
          onClick={() => chooseMeasureFamily("declared")}
        >
          Déclaré <span>Enquête · expérience rapportée</span>
          <ScrollIndicator
            progress={scrollRangeProgress(scrollPosition, 0, 6)}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "emergency"}
          onClick={() => chooseMeasureFamily("emergency")}
        >
          Urgences <span>Recours aigu · OSCOUR®</span>
          <ScrollIndicator
            progress={scrollRangeProgress(scrollPosition, 6, 1)}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "hospital"}
          onClick={() => chooseMeasureFamily("hospital")}
        >
          Hôpital <span>Patients et séjours · MCO</span>
          <ScrollIndicator
            progress={scrollRangeProgress(scrollPosition, 7, 2)}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "deaths"}
          onClick={() => chooseMeasureFamily("deaths")}
        >
          Décès <span>Suicides enregistrés</span>
          <ScrollIndicator
            progress={scrollRangeProgress(scrollPosition, 9, 1)}
          />
        </button>
      </div>
      {family === "hospital" && (
        <div
          className="measure-subnav"
          role="group"
          aria-label="Vue hospitalière"
        >
          <button
            type="button"
            aria-pressed={mode === "territories"}
            onClick={() => switchTerritoryDataset("hospitalisations")}
          >
            Séjours · départements
            <ScrollIndicator
              progress={scrollRangeProgress(scrollPosition, 7)}
            />
          </button>
          <button
            type="button"
            aria-pressed={mode === "profiles"}
            onClick={() => switchMode("profiles")}
          >
            Patients · âge × sexe
            <ScrollIndicator
              progress={scrollRangeProgress(scrollPosition, 8)}
            />
          </button>
        </div>
      )}
    </div>
  );
}
