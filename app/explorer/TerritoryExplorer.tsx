import type { TerritoryExplorerProps } from "./explorerTypes";
import { EXPLORER_STEPS } from "./explorerSteps";
import { DeclaredExplorer } from "./DeclaredExplorer";
import ChartHelp from "../charts/help/ChartHelp";
import {
  hospitalExplanation,
  emergencyExplanation,
  deathExplanation,
} from "../charts/help/chartExplanations";
import { useTerritoryExplorer } from "./useTerritoryExplorer";
import { ExplorerNavigation } from "./ExplorerNavigation";
import { TerritorySelectionPanel } from "./TerritorySelectionPanel";
import { TerritoryTimeSeriesChart } from "./TerritoryTimeSeriesChart";
import { TerritoryDistributionChart } from "./TerritoryDistributionChart";

export function TerritoryExplorer(props: TerritoryExplorerProps) {
  const model = useTerritoryExplorer(props);
  const {
    landmarks,
    lab,
    mode,
    territoryDataset,
    stepIndex,
    data,
    step,
    scrollPosition,
    navigateStep,
    selectedCode,
    age,
    sex,
    chartView,
    title,
    context,
  } = model.frame;
  return (
    <section className="territory-appendix" id="territoires">
      <header className="section-heading">
        <p className="chapter">EXPLORER · QUATRE REGARDS</p>
        <div>
          <h2>
            Changer de regard
            <br />
            Explorer les données
          </h2>
          <p>
            Défilez pour passer de l’expérience déclarée aux urgences, à
            l’hôpital puis aux décès. À chaque étape, les filtres restent
            disponibles pour approfondir la mesure.
          </p>
        </div>
      </header>
      <div className="explorer-scroll-track">
        <ol
          className="explorer-scroll-landmarks"
          aria-label="Étapes du parcours Explorer"
        >
          {EXPLORER_STEPS.map((item, index) => (
            <li
              id={`explorer-step-${index + 1}`}
              key={item.label}
              ref={(element) => {
                landmarks.current[index] = element;
              }}
            >
              <span className="sr-only">
                {index + 1}. {item.label}
              </span>
            </li>
          ))}
        </ol>
        <div
          className="territory-lab"
          id="territory-explorer"
          ref={lab}
          data-mode={mode}
          data-dataset={territoryDataset}
          data-step={stepIndex}
        >
          <ExplorerNavigation {...model.navigation} />
          {mode === "declared" ? (
            <DeclaredExplorer
              data={data}
              step={step}
              position={scrollPosition}
              onNavigate={navigateStep}
            />
          ) : (
            <>
              <TerritorySelectionPanel {...model.selection} />
              <TerritoryTimeSeriesChart {...model.chart} />
              <TerritoryDistributionChart {...model.distribution} />
              <ChartHelp
                key={`${mode}-${territoryDataset}-${selectedCode}-${age}-${sex}-${chartView}`}
                explanation={
                  mode === "profiles"
                    ? hospitalExplanation(
                        true,
                        `${title} · France`,
                        false,
                        chartView === "change",
                      )
                    : territoryDataset === "emergency"
                      ? emergencyExplanation(
                          `${title} · ${context}`,
                          chartView === "change",
                        )
                      : territoryDataset === "suicides"
                        ? deathExplanation(`${title} · ${context}`)
                        : hospitalExplanation(
                            false,
                            `${title} · ${context}`,
                            age === "Tous",
                            chartView === "change",
                          )
                }
              />
            </>
          )}
        </div>
        <div className="explorer-scroll-status">
          <span>
            <b>
              {String(stepIndex + 1).padStart(2, "0")} / {EXPLORER_STEPS.length}
            </b>{" "}
            · {step.label}
          </span>
          <span>
            Défilez pour{" "}
            {stepIndex === EXPLORER_STEPS.length - 1
              ? "continuer"
              : "changer de regard"}{" "}
            ↓
          </span>
        </div>
      </div>
      <p className="source-note">
        <b>Lecture.</b> Chaque source mesure une réalité différente. Les unités,
        périmètres et limites sont précisés dans les boutons « ? ». Source :
        Odissé, Santé publique France.
      </p>
    </section>
  );
}
