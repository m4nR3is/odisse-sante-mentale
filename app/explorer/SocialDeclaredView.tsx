import type { DeclaredViewProps } from "./explorerTypes";
import ChartHelp from "../ChartHelp";
import { useSocialDeclaredView } from "./useSocialDeclaredView";
import { SocialDeclaredControls } from "./SocialDeclaredControls";
import { SocialGradientChart } from "./SocialGradientChart";

export function SocialDeclaredView(props: DeclaredViewProps) {
  const model = useSocialDeclaredView(props);
  const { reveal, activeCode, indicator, explanation } = model.frame;
  return (
    <div
      className="declared-explorer social-has-map"
      ref={reveal.ref}
      data-reveal={reveal.progress}
      data-social-region={activeCode}
    >
      <SocialDeclaredControls {...model.controls} />
      <SocialGradientChart {...model.chart} />
      <p className="monthly-method">
        <b>Lecture.</b> La carte montre les niveaux régionaux ; le graphique
        compare les situations financières. France : hors Mayotte. Sources et
        limites : bouton « ? ».
      </p>
      <ChartHelp key={`${indicator}-${activeCode}`} explanation={explanation} />
    </div>
  );
}
