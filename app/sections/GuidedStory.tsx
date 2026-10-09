import { type ExperienceData } from "../data/experienceTypes";
import { type StoryScene } from "./story/storyTypes";
import { StoryNumber } from "./story/StoryNumber";
import { StoryFigure } from "./story/StoryFigure";
import { ScrollIndicator } from "../explorer/ScrollIndicator";
import { scrollRangeProgress } from "../animation/progress";
import { useMemo } from "react";
import { buildStoryScenes } from "./story/buildStoryScenes";
import { useStoryScroll } from "./story/useStoryScroll";
export function GuidedStory({
  data,
  onExplore,
}: {
  data: ExperienceData;
  onExplore: (view: "declared" | "profiles") => void;
}) {
  const { scene, storyPosition, steps } = useStoryScroll();

  const story = useMemo(() => buildStoryScenes(data), [data]);
  const {
    scenes,
    women,
    men,
    national,
    girls,
    boys,
    change,
    comfortable,
    difficult,
  } = story;
  return (
    <section
      className="guided-opening scroll-story"
      id="constats"
      aria-labelledby="observations-title"
    >
      <header className="section-heading">
        <p className="chapter">COMPRENDRE AVANT D’EXPLORER</p>
        <div>
          <h2 id="observations-title">
            Un chiffre
            <br />
            Plusieurs regards
          </h2>
          <p>
            Partons de la vue d’ensemble. Changeons de population, puis de
            source, pour comprendre ce que chaque mesure rend visible.
          </p>
        </div>
      </header>
      <div className="story-layout">
        <div className="story-steps">
          {scenes.map((step, index) => (
            <article
              className={`story-step${scene === index ? " is-active" : ""}`}
              id={`scene-${index + 1}`}
              data-story-step={index}
              key={step.chapter}
              ref={(element) => {
                steps.current[index] = element;
              }}
              aria-labelledby={`scene-title-${index}`}
            >
              <p className="chapter">{step.chapter}</p>
              <h3 id={`scene-title-${index}`}>
                {step.title.replace("11–14", "11\u2060–\u206014")}
              </h3>
              <div className="story-stat">
                {index === 1 || index === 3 ? (
                  <div className="story-comparison">
                    <div>
                      <StoryNumber
                        value={change(index === 1 ? women : girls)}
                        digits={index === 1 ? 1 : 0}
                      />
                      <span>{index === 1 ? "Femmes" : "Filles"}</span>
                    </div>
                    <div>
                      <StoryNumber
                        value={change(index === 1 ? men : boys)}
                        digits={index === 1 ? 1 : 0}
                      />
                      <span>{index === 1 ? "Hommes" : "Garçons"}</span>
                    </div>
                  </div>
                ) : (
                  <StoryNumber
                    value={
                      index === 0
                        ? change(national)
                        : index === 2
                          ? change(girls)
                          : difficult.estimate / comfortable.estimate
                    }
                    ratio={index === 4}
                  />
                )}
                <span>{step.definition}</span>
              </div>
              <p className="story-copy">{step.copy}</p>
              <div className="story-mobile-figure">
                <StoryFigure story={story} scene={index as StoryScene} />
              </div>
              <p className="story-next">
                {index < 4 && <span aria-hidden="true">↓ </span>}
                {step.next}
              </p>
              {index === 3 && (
                <button
                  type="button"
                  className="evidence-action"
                  onClick={() => onExplore("profiles")}
                >
                  Explorer les seize profils <span>↗</span>
                </button>
              )}
              {index === 4 && (
                <button
                  type="button"
                  className="evidence-action"
                  onClick={() => onExplore("declared")}
                >
                  Explorer les indicateurs déclarés <span>↗</span>
                </button>
              )}
            </article>
          ))}
        </div>
        <aside className="story-sticky" aria-label="Visualisation du récit">
          <nav className="story-progress" aria-label="Scènes du récit">
            {scenes.map((step, index) => (
              <a
                href={`#scene-${index + 1}`}
                key={step.chapter}
                aria-current={scene === index ? "step" : undefined}
              >
                <span>0{index + 1}</span>
                <span className="sr-only"> {step.title}</span>
                <ScrollIndicator
                  progress={scrollRangeProgress(storyPosition, index)}
                />
              </a>
            ))}
          </nav>
          <StoryFigure story={story} scene={scene} />
        </aside>
      </div>
      <div className="reading-bridge">
        <p className="chapter">CE QUE CE RÉCIT RÉVÈLE</p>
        <div className="reading-takeaway">
          <h3>Une hausse nationale peut réunir des trajectoires opposées.</h3>
          <p>Et changer de source, c’est changer ce que l’on mesure.</p>
          <p className="reading-takeaway-detail">
            Enquête, urgences, hospitalisations et décès éclairent des
            dimensions différentes. Ces sources ne sont pas les étapes d’un même
            parcours individuel : explorez-les en conservant leurs propres
            populations, unités et périodes.
          </p>
        </div>
        <a href="#territoires">Explorer les quatre regards ↓</a>
      </div>
    </section>
  );
}
