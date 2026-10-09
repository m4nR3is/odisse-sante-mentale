import type { ExperienceData } from "../data/experienceTypes";
import { scrollRangeProgress } from "../animation/progress";
import {
  declaredStepIndex,
  declaredScrollRange,
  type ExplorerStep,
} from "./explorerSteps";
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
  step: ExplorerStep;
  onNavigate: (index: number) => void;
  position: number;
}) {
  const view = step.view;
  const socialRange = declaredScrollRange("social");
  const historyRange = declaredScrollRange("history");
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
          onClick={() => onNavigate(socialRange.start)}
        >
          Inégalités sociales · 2024
          <ScrollIndicator
            progress={scrollRangeProgress(
              position,
              socialRange.start,
              socialRange.count,
            )}
          />
        </button>
        <button
          type="button"
          aria-pressed={view === "history"}
          onClick={() => onNavigate(historyRange.start)}
        >
          Évolution déclarée · 2005–2021
          <ScrollIndicator
            progress={scrollRangeProgress(
              position,
              historyRange.start,
              historyRange.count,
            )}
          />
        </button>
      </div>
      {view === "social" ? (
        <SocialDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(declaredStepIndex("social", indicator))
          }
        />
      ) : (
        <HistoricalDeclaredView
          data={data}
          position={position}
          indicator={step.indicator}
          onIndicator={(indicator) =>
            onNavigate(declaredStepIndex("history", indicator))
          }
        />
      )}
    </div>
  );
}
