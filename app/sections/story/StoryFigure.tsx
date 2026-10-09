import { FINANCIAL_SHORT } from "../../data/indicatorDefinitions";
import { formatNumber } from "../../charts/format";
import { createLinePath } from "../../charts/paths";
import { StoryAnnotations } from "../../charts/ReadingAnnotations";
import ViewportTooltip from "../../components/ViewportTooltip";
import ChartHelp from "../../charts/help/ChartHelp";
import {
  socialExplanation,
  storyHospitalExplanation,
} from "../../charts/help/chartExplanations";
import type { StoryData } from "./buildStoryScenes";
import type { StoryScene } from "./storyTypes";
import { useStoryFigure } from "./useStoryFigure";
import { StorySocialChart } from "./StorySocialChart";
import { StoryHospitalChart } from "./StoryHospitalChart";
export function StoryFigure({
  story,
  scene: requestedScene,
}: {
  story: StoryData;
  scene: StoryScene;
}) {
  const model = useStoryFigure(story, requestedScene);
  const {
    scene,
    svgRef,
    chartSize,
    social,
    values,
    boys,
    drawing,
    maskId,
    x,
    y,
    chartUnscale,
    socialWidth,
    plotRight,
    tooltip,
  } = model;
  return (
    <div className="story-figure" data-scene={scene}>
      <div className="story-figure-heading">
        <p className="chapter">
          {scene === 4
            ? "ENQUÊTE · BAROMÈTRE 2024"
            : "MCO · PATIENTS · GESTES AUTO-INFLIGÉS"}
        </p>
        <h3>
          {
            [
              "La vue d’ensemble",
              "Femmes et hommes · tous âges",
              "Les filles de 11–14 ans",
              "Deux trajectoires, un même âge",
              "La situation financière perçue",
            ][scene]
          }
        </h3>
        {scene === 2 && (
          <p className="story-scale-notice">
            Nouvelle population · taux brut
            <br />
            <b>Nouvelle échelle : 0–500 pour 100 000</b>
          </p>
        )}
        <p>
          {scene === 4
            ? "Épisode dépressif caractérisé · 12 derniers mois · 18–79 ans"
            : scene === 0
              ? "France · tous âges, tous sexes · taux standardisé pour 100 000 habitants"
              : scene === 1
                ? "France · tous âges · taux standardisés pour 100 000 personnes de chaque sexe"
                : "France · taux brut pour 100 000 personnes du même âge et sexe"}
        </p>
      </div>
      <div className="story-visual">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartSize.width} 320`}
          style={{ height: chartSize.height, maxWidth: "none" }}
          role="group"
          aria-label={
            scene === 4
              ? `Dépression déclarée selon la situation financière : ${social.map((point) => `${FINANCIAL_SHORT[point.financial]}, ${formatNumber(point.estimate)} %`).join(" ; ")}. Intervalles de confiance à 95 %.`
              : `${scene === 0 ? "Tous âges et sexes" : scene === 1 ? "Femmes · tous âges" : "Filles de 11–14 ans"} : ${formatNumber(values[0].rate)} en 2019, ${formatNumber(values.at(-1)!.rate)} en 2024, pour 100 000.${scene === 1 || scene === 3 ? ` ${scene === 1 ? "Hommes · tous âges" : "Garçons de 11–14 ans"} : ${formatNumber(boys[0].rate)} à ${formatNumber(boys.at(-1)!.rate)}.` : ""}`
          }
        >
          <defs>
            {[
              {
                name: "main",
                points: values,
                start: drawing.mainStart,
                end: drawing.main,
              },
              {
                name: "boys",
                points: boys,
                start: drawing.boysStart,
                end: drawing.boys,
              },
            ].map(({ name, points, start, end }) => (
              <mask
                key={name}
                id={`${maskId}-${name}`}
                maskUnits="userSpaceOnUse"
                x="-20"
                y="0"
                width={chartSize.width + 20}
                height="320"
              >
                <path
                  d={createLinePath(
                    points,
                    (point) => x(point.year),
                    (point) => y(point.rate),
                  )}
                  fill="none"
                  stroke="white"
                  strokeWidth={32 * chartUnscale}
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray={`${Math.max(0, end - start)} 1`}
                  strokeDashoffset={-start}
                  opacity={end <= start ? 0 : 1}
                />
              </mask>
            ))}
          </defs>
          {scene === 4 ? (
            <StorySocialChart model={model} />
          ) : (
            <StoryHospitalChart model={model} />
          )}
          {(scene === 4
            ? drawing.social === 1
            : drawing.main === 1 &&
              drawing.mainStart === 0 &&
              ((scene !== 1 && scene !== 3) || drawing.boys === 1)) && (
            <StoryAnnotations
              plotRight={plotRight}
              scene={scene}
              mainY={y(values.at(-1)!.rate)}
              comparisonY={y(boys.at(-1)!.rate)}
              socialEnds={[
                136 + (social[0].estimate / 32) * socialWidth,
                136 + (social.at(-1)!.estimate / 32) * socialWidth,
              ]}
            />
          )}
        </svg>
        {scene === 4 ? (
          <>
            <dl className="story-mobile-values">
              {social.map((point) => (
                <div key={point.financial}>
                  <dt>{FINANCIAL_SHORT[point.financial]}</dt>
                  <dd>
                    {formatNumber(point.estimate)} %
                    <small>
                      IC 95 % : {formatNumber(point.low)}–
                      {formatNumber(point.high)} %
                    </small>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="story-chart-note">
              Le point indique le pourcentage estimé ; le trait montre son
              intervalle de confiance à 95 %, c’est-à-dire l’incertitude de
              l’enquête.
            </p>
          </>
        ) : (
          <>
            <div className="story-legend">
              <span className={scene === 0 ? "is-national" : ""}>
                {scene === 0
                  ? "Tous âges, tous sexes"
                  : scene === 1
                    ? "Femmes · tous âges"
                    : "Filles · 11–14 ans"}{" "}
                · {formatNumber(values.at(-1)!.rate)} en 2024
              </span>
              {(scene === 1 || scene === 3) && (
                <span className="is-boys">
                  {scene === 1 ? "Hommes · tous âges" : "Garçons"} ·{" "}
                  {formatNumber(boys.at(-1)!.rate)} en 2024
                </span>
              )}
            </div>
            <p className="story-chart-note">
              {scene === 0
                ? "MCO : médecine, chirurgie et obstétrique, hors hospitalisations psychiatriques. Taux standardisé pour la comparaison nationale."
                : scene === 1
                  ? "Femmes et hommes : taux standardisés, sur la même échelle de 0 à 150 pour 100 000."
                  : scene === 2
                    ? "Nouvelle population : taux brut par âge et sexe. Nouvelle échelle : de 0 à 500 pour 100 000."
                    : "Les deux courbes partagent la même échelle et la même période."}
            </p>
          </>
        )}
      </div>
      {tooltip && (
        <ViewportTooltip x={tooltip.x} y={tooltip.y} className="story-tooltip">
          <span>{tooltip.label}</span>
          <small>{tooltip.context}</small>
          <strong>{tooltip.value}</strong>
          <small>{tooltip.detail}</small>
        </ViewportTooltip>
      )}
      <a
        className="story-source"
        href={
          scene === 4
            ? "https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/"
            : "https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/"
        }
        target="_blank"
        rel="noreferrer"
      >
        Source : Odissé ·{" "}
        {scene === 4 ? "Baromètre 2024" : "Patients hospitalisés"} ↗
      </a>
      <ChartHelp
        key={scene}
        explanation={
          scene === 4
            ? socialExplanation("Dépression")
            : storyHospitalExplanation(scene)
        }
      />
    </div>
  );
}
