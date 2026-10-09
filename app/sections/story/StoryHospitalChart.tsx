import { createLinePath } from "../../charts/paths";
import type { StoryFigureModel } from "./useStoryFigure";
export function StoryHospitalChart({
  model,
}: {
  model: Pick<
    StoryFigureModel,
    | "scene"
    | "plotLeft"
    | "plotRight"
    | "y"
    | "chartUnscale"
    | "maskId"
    | "drawing"
    | "values"
    | "x"
    | "pointEvents"
    | "hospitalInfo"
    | "boys"
  >;
}) {
  const {
    scene,
    plotLeft,
    plotRight,
    y,
    chartUnscale,
    maskId,
    drawing,
    values,
    x,
    pointEvents,
    hospitalInfo,
    boys,
  } = model;
  return (
    <>
      {(scene <= 1 ? [0, 50, 100, 150] : [0, 200, 400]).map((tick) => (
        <g className="story-gridline" key={tick}>
          <line x1={plotLeft} x2={plotRight} y1={y(tick)} y2={y(tick)} />
          <text x="0" y={y(tick) + 4 * chartUnscale} textAnchor="start">
            {tick}
          </text>
        </g>
      ))}
      <g
        className="story-main-reveal"
        mask={`url(#${maskId}-main)`}
        data-progress={drawing.main - drawing.mainStart}
      >
        <path
          className={scene === 0 ? "story-national" : "story-girls"}
          d={createLinePath(
            values,
            (point) => x(point.year),
            (point) => y(point.rate),
          )}
        />
        {values.map((point) => (
          <g
            key={point.year}
            {...pointEvents(
              hospitalInfo(
                point,
                scene === 0
                  ? "France · tous âges, tous sexes"
                  : scene === 1
                    ? "Femmes · tous âges"
                    : "Filles · 11–14 ans",
              ),
              drawing.main === 1 && drawing.mainStart === 0,
            )}
          >
            <circle
              className="story-point-hit"
              cx={x(point.year)}
              cy={y(point.rate)}
              r="12"
            />
            <circle
              className={scene === 0 ? "story-dot-muted" : "story-dot"}
              cx={x(point.year)}
              cy={y(point.rate)}
              r="4"
            />
          </g>
        ))}
      </g>
      {(scene === 1 || scene === 3) && (
        <g
          className="story-boys-reveal"
          mask={`url(#${maskId}-boys)`}
          data-progress={drawing.boys - drawing.boysStart}
        >
          <path
            className="story-boys"
            d={createLinePath(
              boys,
              (point) => x(point.year),
              (point) => y(point.rate),
            )}
          />
          {boys.map((point) => (
            <g
              key={point.year}
              {...pointEvents(
                hospitalInfo(
                  point,
                  scene === 1 ? "Hommes · tous âges" : "Garçons · 11–14 ans",
                ),
                drawing.boys === 1 && drawing.boysStart === 0,
              )}
            >
              <circle
                className="story-point-hit"
                cx={x(point.year)}
                cy={y(point.rate)}
                r="12"
              />
              <circle
                className="story-dot-muted"
                cx={x(point.year)}
                cy={y(point.rate)}
                r="4"
              />
            </g>
          ))}
        </g>
      )}
      {values.map((point) => (
        <text
          x={x(point.year)}
          y="301"
          textAnchor={point.year === 2019 ? "start" : "middle"}
          key={point.year}
        >
          {point.year}
        </text>
      ))}
    </>
  );
}
