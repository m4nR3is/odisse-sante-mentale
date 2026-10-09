import type { ExperienceData } from "../data/experienceTypes";
import { scrollRangeProgress } from "../animation/progress";
import { EXPLORER_STEPS } from "./explorerSteps";
import { ScrollIndicator } from "./ScrollIndicator";
import { SocialDeclaredView } from "./SocialDeclaredView";
import { HistoricalDeclaredView } from "./HistoricalDeclaredView";

export function DeclaredExplorer({
  data,
  step,
  onNavigate,
  position,
}: {
  data: ExperienceData;
  step: (typeof EXPLORER_STEPS)[number];
  onNavigate: (index: number) => void;
  position: number;
}) {
  const view = step.view;
  return (
    <div className="declared-shell">
      <div
        className="measure-subnav declared-subnav"
        role="group"
        aria-label="Lecture des données déclarées"
      >
        <button
          type="button"
          aria-pressed={view === "social"}
          onClick={() => onNavigate(0)}
        >
          Inégalités sociales · 2024
          <ScrollIndicator progress={scrollRangeProgress(position, 0, 3)} />
        </button>
        <button
          type="button"
          aria-pressed={view === "history"}
          onClick={() => onNavigate(3)}
        >
          Évolution déclarée · 2005–2021
          <ScrollIndicator progress={scrollRangeProgress(position, 3, 3)} />
        </button>
      </div>
      {view === "social" ? (
        <SocialDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(
              EXPLORER_STEPS.findIndex(
                (candidate) =>
                  candidate.view === "social" &&
                  candidate.indicator === indicator,
              ),
            )
          }
        />
      ) : (
        <HistoricalDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(
              EXPLORER_STEPS.findIndex(
                (candidate) =>
                  candidate.view === "history" &&
                  candidate.indicator === indicator,
              ),
            )
          }
        />
      )}
    </div>
  );
}
