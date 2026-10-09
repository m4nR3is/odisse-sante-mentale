import { useExperienceEntrance } from "./animation/useExperienceEntrance";
import { HelpSection } from "./sections/HelpSection";
import { SiteFooter } from "./components/SiteFooter";
import { type ExperienceData } from "./data/experienceTypes";
import { type GuidedView } from "./explorer/explorerSteps";
import { TerritoryExplorer } from "./explorer/TerritoryExplorer";
import { ReadingNavigation } from "./navigation/ReadingNavigation";
import { GuidedStory } from "./sections/GuidedStory";
import { IntroOpening } from "./sections/IntroOpening";
import { MethodSection } from "./sections/MethodSection";
import useChartInteractions from "./charts/useChartInteractions";
import useChartTypography from "./charts/useChartTypography";
import { useRef, useState } from "react";

export default function Experience({
  initialData: data,
}: {
  initialData: ExperienceData;
}) {
  const entrance = useRef<HTMLElement>(null);
  useChartTypography(entrance);
  useChartInteractions(entrance);
  useExperienceEntrance(entrance);
  const [guidedView, setGuidedView] = useState<GuidedView | null>(null);
  const explore = (view: "declared" | "profiles") => {
    setGuidedView((previous) => ({
      view,
      revision: (previous?.revision ?? 0) + 1,
    }));
  };
  return (
    <main ref={entrance} className="experience entrance-pending">
      <a className="skip-link" href="#constats">
        Aller aux observations
      </a>
      <ReadingNavigation />
      <IntroOpening />
      <GuidedStory data={data} onExplore={explore} />
      <TerritoryExplorer data={data} guidedView={guidedView} />
      <MethodSection data={data} />
      <HelpSection />
      <SiteFooter />
    </main>
  );
}
