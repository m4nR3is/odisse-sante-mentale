import { ScrollIndicator } from "./ScrollIndicator";
import { scrollRangeProgress } from "../animation/progress";
import TerritoryMap from "../maps/TerritoryMap";
import { formatSignedPercent, formatNumber } from "../charts/format";
import type { HistoricalDeclaredViewModel } from "./useHistoricalDeclaredView";

type Props = HistoricalDeclaredViewModel["controls"];

export function HistoricalDeclaredControls({
  indicators,
  indicator,
  onIndicator,
  position,
  selectedCode,
  setTerritoryCode,
  territories,
  sex,
  setSex,
  sexes,
  previewCode,
  regionChanges,
  setPreviewCode,
  change,
  reveal,
  isNational,
  gap,
}: Props) {
  return (
    <div className="declared-history-controls declared-head">
      <p className="chapter">DÉCLARÉ · BAROMÈTRES 2005–2021</p>
      <h3>
        Ce que l’enquête
        <br />
        rend visible.
      </h3>
      <p>
        Prévalence déclarée chez les 18–75 ans en France hexagonale, selon la
        région et le sexe. Les vagues 2005–2021 restent séparées de 2024, dont
        le protocole diffère.
      </p>
      <div
        className="declared-indicators history-indicators"
        role="group"
        aria-label="Indicateur déclaré historique"
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
              progress={scrollRangeProgress(
                position,
                3 + indicators.indexOf(item),
              )}
            />
          </button>
        ))}
      </div>
      <div className="history-filters">
        <label>
          Territoire
          <select
            value={selectedCode}
            onChange={(event) => setTerritoryCode(event.target.value)}
          >
            <option value="FR">France hexagonale</option>
            {territories.map(([code, name]) => (
              <option value={code} key={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sexe
          <select value={sex} onChange={(event) => setSex(event.target.value)}>
            {sexes.map((item) => (
              <option key={item} value={item}>
                {item === "Hommes et Femmes" ? "Tous les sexes" : item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TerritoryMap
        legend="Évolution · 2005 → 2021 · pt"
        context={`${indicator} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex}`}
        level="regions"
        selected={selectedCode}
        preview={previewCode}
        items={territories.map(([code, name]) => ({
          code,
          name,
          value: regionChanges.find((point) => point.code === code)?.change,
          detail: regionChanges.find((point) => point.code === code)
            ? `${formatSignedPercent(regionChanges.find((point) => point.code === code)!.change, 1).replace(" %", " pt")} · 2005 → 2021`
            : "Évolution indisponible",
        }))}
        onPreview={setPreviewCode}
        onSelect={setTerritoryCode}
      />
      <div className="declared-history-kpi">
        <strong>
          {change >= 0 ? "+" : "−"}
          {formatNumber(Math.abs(change) * reveal.progress, 1)} pt
        </strong>
        <span>évolution déclarée · 2005 → 2021</span>
        {!isNational && (
          <p className={gap > 0 ? "is-positive" : ""}>
            {gap >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(gap), 1)} pt par rapport à la France en 2021
          </p>
        )}
      </div>
    </div>
  );
}
