import { familyScrollRange, entryStepForMode } from "./explorerSteps";
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
  const ranges = {
    declared: familyScrollRange("declared"),
    emergency: familyScrollRange("emergency"),
    hospital: familyScrollRange("hospital"),
    deaths: familyScrollRange("deaths"),
  };
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
            progress={scrollRangeProgress(
              scrollPosition,
              ranges.declared.start,
              ranges.declared.count,
            )}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "emergency"}
          onClick={() => chooseMeasureFamily("emergency")}
        >
          Urgences <span>Recours aigu · OSCOUR®</span>
          <ScrollIndicator
            progress={scrollRangeProgress(
              scrollPosition,
              ranges.emergency.start,
              ranges.emergency.count,
            )}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "hospital"}
          onClick={() => chooseMeasureFamily("hospital")}
        >
          Hôpital <span>Patients et séjours · MCO</span>
          <ScrollIndicator
            progress={scrollRangeProgress(
              scrollPosition,
              ranges.hospital.start,
              ranges.hospital.count,
            )}
          />
        </button>
        <button
          type="button"
          aria-pressed={family === "deaths"}
          onClick={() => chooseMeasureFamily("deaths")}
        >
          Décès <span>Suicides enregistrés</span>
          <ScrollIndicator
            progress={scrollRangeProgress(
              scrollPosition,
              ranges.deaths.start,
              ranges.deaths.count,
            )}
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
              progress={scrollRangeProgress(
                scrollPosition,
                entryStepForMode("territories"),
              )}
            />
          </button>
          <button
            type="button"
            aria-pressed={mode === "profiles"}
            onClick={() => switchMode("profiles")}
          >
            Patients · âge × sexe
            <ScrollIndicator
              progress={scrollRangeProgress(
                scrollPosition,
                entryStepForMode("profiles"),
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
}
