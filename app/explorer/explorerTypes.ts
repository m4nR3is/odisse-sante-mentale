import type { ExperienceData } from "../data/experienceTypes";
import type { GuidedView } from "./explorerSteps";

export type TerritoryExplorerProps = {
  data: ExperienceData;
  guidedView: GuidedView | null;
};

export type DeclaredViewProps = {
  data: ExperienceData;
  indicator: string;
  onIndicator: (indicator: string) => void;
  position: number;
};
