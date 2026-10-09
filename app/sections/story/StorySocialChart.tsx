import { FINANCIAL_SHORT } from "../../data/indicatorDefinitions";
import { formatNumber } from "../../charts/format";
import type { StoryFigureModel } from "./useStoryFigure";
export function StorySocialChart({
  model,
}: {
  model: Pick<
    StoryFigureModel,
    "drawing" | "socialWidth" | "social" | "pointEvents"
  >;
}) {
  const { drawing, socialWidth, social, pointEvents } = model;
  return (
    <g>
      {[0, 10, 20, 30].map((tick) => (
        <g
          className="story-gridline"
          key={tick}
          opacity={Math.min(1, drawing.social * 4)}
        >
          <line
            x1={136 + (tick / 32) * socialWidth}
            x2={136 + (tick / 32) * socialWidth}
            y1="44"
            y2="258"
          />
          <text x={136 + (tick / 32) * socialWidth} y="294" textAnchor="middle">
            {tick} %
          </text>
        </g>
      ))}
      {social.map((point, index) => {
        const progress = Math.max(
          0,
          Math.min(1, (drawing.social - index * 0.17) / 0.49),
        );
        const phase = (start: number, duration: number) =>
          Math.max(0, Math.min(1, (progress - start) / duration));
        const labelProgress = phase(0, 0.25);
        const countProgress = phase(0.15, 0.6);
        const arrival = phase(0.75, 0.25);
        const growth = arrival * arrival * (3 - 2 * arrival);
        const animatedEstimate = point.estimate * countProgress;
        const center = 136 + (animatedEstimate / 32) * socialWidth;
        const intervalProgress = growth;
        const intervalScale = intervalProgress;
        return (
          <g
            className="story-social-row"
            key={point.financial}
            data-progress={progress}
            data-estimate={animatedEstimate}
            opacity={progress > 0 ? 1 : 0}
          >
            <text
              className="story-social-label"
              x="0"
              y={68 + index * 60}
              opacity={labelProgress}
              transform={`translate(0 ${(1 - labelProgress) * 10})`}
            >
              {FINANCIAL_SHORT[point.financial]}
            </text>
            <line
              className="story-interval"
              x1={
                center +
                ((point.low - point.estimate) / 32) *
                  socialWidth *
                  intervalScale
              }
              x2={
                center +
                ((point.high - point.estimate) / 32) *
                  socialWidth *
                  intervalScale
              }
              y1={63 + index * 60}
              y2={63 + index * 60}
              opacity={intervalProgress}
            />
            <g
              {...pointEvents(
                {
                  label: FINANCIAL_SHORT[point.financial],
                  context: "Dépression déclarée · 2024",
                  value: `${formatNumber(point.estimate)} %`,
                  detail: `IC à 95 % : ${formatNumber(point.low)}–${formatNumber(point.high)} %`,
                },
                progress === 1,
              )}
            >
              <circle
                className="story-point-hit"
                cx={center}
                cy={63 + index * 60}
                r="12"
              />
              <circle
                className="story-dot story-social-dot"
                cx={center}
                cy={63 + index * 60}
                r={2 + 3 * growth}
                style={{
                  fill:
                    growth === 0
                      ? "var(--ink)"
                      : `color-mix(in srgb, var(--ink) ${(1 - growth) * 100}%, var(--reference))`,
                }}
              />
            </g>
            <text
              className="story-value"
              x={
                center +
                ((point.high - point.estimate) / 32) *
                  socialWidth *
                  intervalScale +
                10
              }
              y={68 + index * 60}
              opacity={phase(0, 0.12)}
            >
              {formatNumber(animatedEstimate)} %
            </text>
          </g>
        );
      })}
    </g>
  );
}
