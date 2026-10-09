import { ScrollIndicator } from "./ScrollIndicator";
import { scrollRangeProgress } from "../animation/progress";
import TerritoryMap from "../maps/TerritoryMap";
import { formatNumber, formatConfidenceInterval } from "../charts/format";
import { declaredMeasure } from "../charts/help/chartExplanations";
import type { SocialDeclaredViewModel } from "./useSocialDeclaredView";

type Props = SocialDeclaredViewModel["controls"];

export function SocialDeclaredControls({
  indicators,
  indicator,
  onIndicator,
  position,
  regions,
  selected,
  preview,
  setPreview,
  setSelected,
  setHovered,
  ratio,
  reveal,
  territory,
}: Props) {
  return (
    <div className="declared-head">
      <p className="chapter">DÉCLARÉ · BAROMÈTRE 2024</p>
      <h3>
        Ce que l’enquête
        <br />
        rend visible
      </h3>
      <p>
        18–79 ans · situation financière perçue.
        <br />
        Survolez une région pour comparer son gradient à la France ; cliquez
        pour la conserver.
      </p>
      <div
        className="declared-indicators"
        role="group"
        aria-label="Indicateur déclaré"
      >
        {indicators.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={indicator === item}
            onClick={() => onIndicator(item)}
          >
            {item}
            <ScrollIndicator
              progress={scrollRangeProgress(position, indicators.indexOf(item))}
            />
          </button>
        ))}
      </div>
      <TerritoryMap
        level="regions"
        signedValues={false}
        items={regions.map((point) => ({
          code: point.territoryCode,
          name: point.territory,
          value: point.estimate,
          available: true,
          detail: `${formatNumber(point.estimate)} % · ${formatConfidenceInterval(point)}`,
        }))}
        selected={selected}
        preview={preview}
        legend="Prévalence régionale · 2024 · %"
        context={`${declaredMeasure(indicator)} · tous profils`}
        onPreview={setPreview}
        onSelect={(code) => {
          setSelected(code);
          setPreview(null);
          setHovered(null);
        }}
      />
      <div className="declared-ratio">
        <strong>
          {ratio == null ? "—" : `× ${formatNumber(ratio * reveal.progress)}`}
        </strong>
        <span>
          {territory} ·{" "}
          {ratio == null
            ? "rapport non calculable : valeur non diffusée"
            : "en difficulté / à l’aise"}
        </span>
      </div>
    </div>
  );
}
