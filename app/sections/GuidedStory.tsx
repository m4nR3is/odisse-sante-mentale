import { scrollRangeProgress } from "../animation/progress";
import ChartHelp, {
  socialExplanation,
  storyHospitalExplanation,
} from "../ChartHelp";
import { formatNumber, formatSignedPercent } from "../charts/format";
import { createLinePath } from "../charts/paths";
import { type ExperienceData, type SeriesPoint } from "../data/experienceTypes";
import { FINANCIAL_ORDER, FINANCIAL_SHORT } from "../data/indicatorDefinitions";
import { ScrollIndicator } from "../explorer/ScrollIndicator";
import { StoryAnnotations } from "../ReadingIllustrations";
import ViewportTooltip from "../ViewportTooltip";
import {
  useState,
  useRef,
  useEffect,
  useId,
  useLayoutEffect,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from "react";

type StoryScene = 0 | 1 | 2 | 3 | 4;

type StoryPointInfo = {
  label: string;
  context: string;
  value: string;
  detail: string;
};

type StoryDrawing = {
  scene: StoryScene;
  main: number;
  mainStart: number;
  boys: number;
  boysStart: number;
  social: number;
};

function useStoryDrawing(scene: StoryScene, entered: boolean) {
  const [drawing, setDrawing] = useState<StoryDrawing>({
    scene,
    main: 0,
    mainStart: 0,
    boys: 0,
    boysStart: 0,
    social: 0,
  });
  const current = useRef(drawing);
  useEffect(() => {
    if (!entered) return;
    let frame = 0;
    const publish = (next: StoryDrawing) => {
      current.current = next;
      setDrawing(next);
    };
    const complete = {
      scene,
      main: 1,
      mainStart: 0,
      boys: scene === 1 || scene === 3 ? 1 : 0,
      boysStart: 0,
      social: scene === 4 ? 1 : 0,
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      publish(complete);
    };
    if (motion.matches) {
      finish();
      return;
    }
    const animate = (
      from: StoryDrawing,
      to: StoryDrawing,
      duration: number,
      done?: () => void,
    ) => {
      if (
        from.main === to.main &&
        from.boys === to.boys &&
        from.social === to.social &&
        from.mainStart === to.mainStart &&
        from.boysStart === to.boysStart
      ) {
        publish(to);
        done?.();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        publish({
          scene: to.scene,
          main: from.main + (to.main - from.main) * eased,
          mainStart: from.mainStart + (to.mainStart - from.mainStart) * eased,
          boys: from.boys + (to.boys - from.boys) * eased,
          boysStart: from.boysStart + (to.boysStart - from.boysStart) * eased,
          social: from.social + (to.social - from.social) * eased,
        });
        if (t < 1) frame = requestAnimationFrame(tick);
        else done?.();
      };
      frame = requestAnimationFrame(tick);
    };
    const from = current.current;
    if (from.scene === scene) {
      animate(from, complete, scene === 4 ? 1600 : 650);
    } else {
      // Keep the girls' curve when adding/removing the same-age comparison.
      const keepGirls =
        (from.scene === 2 || from.scene === 3) && (scene === 2 || scene === 3);
      // Advance the disappearing edge from 2019 towards 2024.
      const erased = {
        ...from,
        mainStart: keepGirls ? from.mainStart : from.main,
        boysStart: from.boys,
        social: 0,
      };
      animate(from, erased, 650, () => {
        const next = {
          scene,
          main: keepGirls ? erased.main : 0,
          mainStart: keepGirls ? erased.mainStart : 0,
          boys: 0,
          boysStart: 0,
          social: 0,
        };
        publish(next);
        animate(next, complete, scene === 4 ? 1600 : 750);
      });
    }
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [entered, scene]);
  return drawing;
}

function StoryFigure({
  data,
  scene: requestedScene,
}: {
  data: ExperienceData;
  scene: StoryScene;
}) {
  const maskId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartSize, setChartSize] = useState({ width: 580, height: 320 });
  useLayoutEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const resize = () => {
      const width = container.getBoundingClientRect().width;
      if (!width) return;
      const height = matchMedia("(max-width: 980px)").matches
        ? (Math.min(width, 720) * 320) / 580
        : Math.min((width * 320) / 580, innerHeight * 0.46);
      const viewWidth = (width / height) * 320;
      setChartSize((current) =>
        Math.abs(current.width - viewWidth) < 0.1 &&
        Math.abs(current.height - height) < 0.1
          ? current
          : { width: viewWidth, height },
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const drawing = useStoryDrawing(requestedScene, entered);
  const scene = drawing.scene;
  const [tooltip, setTooltip] = useState<
    (StoryPointInfo & { x: number; y: number }) | null
  >(null);
  useEffect(() => {
    const dismiss = () => setTooltip(null);
    dismiss();
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, [requestedScene]);
  const pointEvents = (info: StoryPointInfo, enabled: boolean) => ({
    className: "story-point",
    role: "img" as const,
    tabIndex: enabled ? 0 : -1,
    "aria-label": `${info.label}. ${info.context}. ${info.value}. ${info.detail}`,
    "data-interactive": enabled,
    onPointerMove: (event: ReactPointerEvent<SVGGElement>) => {
      if (enabled) setTooltip({ ...info, x: event.clientX, y: event.clientY });
    },
    onPointerLeave: (event: ReactPointerEvent<SVGGElement>) => {
      if (document.activeElement !== event.currentTarget) setTooltip(null);
    },
    onFocus: (event: ReactFocusEvent<SVGGElement>) => {
      if (!enabled) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      setTooltip({ ...info, x: bounds.left + bounds.width / 2, y: bounds.top });
    },
    onBlur: () => setTooltip(null),
    onKeyDown: (event: { key: string }) => {
      if (event.key === "Escape") setTooltip(null);
    },
  });
  const hospitalInfo = (point: SeriesPoint, label: string): StoryPointInfo => ({
    label,
    context: `${point.year} · Patients hospitalisés en MCO`,
    value: `${formatNumber(point.rate)} pour 100 000`,
    detail: `${formatNumber(point.patients, 0)} patients · ${scene <= 1 ? "Taux standardisé" : "Taux brut par âge et sexe"}`,
  });
  const national = data.odissePatients
    .filter((point) => point.age === "Tous" && point.sex === "Hommes et Femmes")
    .sort((a, b) => a.year - b.year);
  const girls = data.odissePatients
    .filter((point) => point.age === "11–14 ans" && point.sex === "Femmes")
    .sort((a, b) => a.year - b.year);
  const boys = data.odissePatients
    .filter(
      (point) =>
        point.age === (scene === 1 ? "Tous" : "11–14 ans") &&
        point.sex === "Hommes",
    )
    .sort((a, b) => a.year - b.year);
  const social = FINANCIAL_ORDER.map(
    (financial) =>
      data.social.find(
        (point) =>
          point.indicator === "Dépression" && point.financial === financial,
      )!,
  );
  const women = data.odissePatients
    .filter((point) => point.age === "Tous" && point.sex === "Femmes")
    .sort((a, b) => a.year - b.year);
  const values = scene === 0 ? national : scene === 1 ? women : girls;
  const chartUnscale = 320 / chartSize.height;
  const plotLeft = 36 * chartUnscale;
  const plotRight = chartSize.width - 46;
  const socialWidth = chartSize.width - 136 - 62;
  const x = (year: number) =>
    plotLeft + ((year - 2019) / 5) * (plotRight - plotLeft);
  const ceiling = scene <= 1 ? 150 : 500;
  const y = (rate: number) => 260 - (rate / ceiling) * 206;
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
                  <text
                    x={136 + (tick / 32) * socialWidth}
                    y="294"
                    textAnchor="middle"
                  >
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
          ) : (
            <>
              {(scene <= 1 ? [0, 50, 100, 150] : [0, 200, 400]).map((tick) => (
                <g className="story-gridline" key={tick}>
                  <line
                    x1={plotLeft}
                    x2={plotRight}
                    y1={y(tick)}
                    y2={y(tick)}
                  />
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
                          scene === 1
                            ? "Hommes · tous âges"
                            : "Garçons · 11–14 ans",
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

function StoryNumber({
  value,
  ratio = false,
  digits = 0,
}: {
  value: number;
  ratio?: boolean;
  digits?: number;
}) {
  const element = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const format = (number: number) =>
    ratio ? `× ${formatNumber(number)}` : formatSignedPercent(number, digits);
  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      cancelAnimationFrame(frame);
      setDisplayed(visible ? value : 0);
    };
    if (!visible || motion.matches) {
      finish();
      return;
    }
    setDisplayed(0);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1000);
      setDisplayed(value * progress * progress * (3 - 2 * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", finish);
    };
  }, [value, visible]);
  return (
    <strong ref={element} aria-label={format(value)} data-value={displayed}>
      <span aria-hidden="true">{format(displayed)}</span>
    </strong>
  );
}

export function GuidedStory({
  data,
  onExplore,
}: {
  data: ExperienceData;
  onExplore: (view: "declared" | "profiles") => void;
}) {
  const [scene, setScene] = useState<StoryScene>(0);
  const [storyPosition, setStoryPosition] = useState(0);
  const steps = useRef<Array<HTMLElement | null>>([]);
  useEffect(() => {
    let frame = 0;
    // The same viewport position always selects the same scene, in either direction.
    const synchronize = () => {
      frame = 0;
      const readingLine = window.innerHeight / 2;
      let activeScene: StoryScene = 0;
      steps.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= readingLine) {
          activeScene = index as StoryScene;
        }
      });
      setScene((current) => (current === activeScene ? current : activeScene));
      const bounds = steps.current[activeScene]?.getBoundingClientRect();
      const fraction = bounds
        ? Math.max(
            0,
            Math.min(
              1,
              (readingLine - bounds.top) / Math.max(1, bounds.height),
            ),
          )
        : 0;
      setStoryPosition(activeScene + fraction);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    const container = steps.current[0]?.parentElement;
    if (container) observer.observe(container);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const series = (age: string, sex: string) =>
    data.odissePatients
      .filter((point) => point.age === age && point.sex === sex)
      .sort((a, b) => a.year - b.year);
  const women = series("Tous", "Femmes");
  const men = series("Tous", "Hommes");
  const national = series("Tous", "Hommes et Femmes");
  const girls = series("11–14 ans", "Femmes");
  const boys = series("11–14 ans", "Hommes");
  const change = (points: SeriesPoint[]) =>
    100 * (points.at(-1)!.rate / points[0].rate - 1);
  const comfortable = data.social.find(
    (point) =>
      point.indicator === "Dépression" &&
      point.financial === FINANCIAL_ORDER[0],
  )!;
  const difficult = data.social.find(
    (point) =>
      point.indicator === "Dépression" &&
      point.financial === FINANCIAL_ORDER[3],
  )!;
  const scenes = [
    {
      chapter: "01 · LA PREMIÈRE IMPRESSION",
      title: "Une hausse modérée, à l’échelle nationale",
      metric: formatSignedPercent(change(national)),
      definition:
        "évolution du taux de patients en MCO pour gestes auto-infligés · 2019 → 2024",
      copy: `En France, le taux standardisé passe de ${formatNumber(national[0].rate)} à ${formatNumber(national.at(-1)!.rate)} pour 100 000 habitants. Cette vue d’ensemble résume des populations aux trajectoires différentes.`,
      next: "Cette hausse est-elle partagée par les femmes et les hommes ?",
    },
    {
      chapter: "02 · DISTINGUER LES SEXES",
      title: "Une hausse nationale, deux directions",
      metric: `${formatSignedPercent(change(women), 1)} / ${formatSignedPercent(change(men), 1)}`,
      definition:
        "évolutions des taux standardisés · femmes / hommes · tous âges · 2019 → 2024",
      copy: `Chez les femmes, le taux standardisé passe de ${formatNumber(women[0].rate)} à ${formatNumber(women.at(-1)!.rate)} pour 100 000 ; chez les hommes, de ${formatNumber(men[0].rate)} à ${formatNumber(men.at(-1)!.rate)}. La hausse nationale rassemble une augmentation chez les femmes et une baisse chez les hommes.`,
      next: "Les femmes de tous âges suivent-elles la même trajectoire ? Resserrons le regard sur les filles de 11–14 ans.",
    },
    {
      chapter: "03 · CHANGER DE POPULATION",
      title: "Chez les filles de 11–14 ans, la trajectoire se détache.",
      metric: formatSignedPercent(change(girls)),
      definition:
        "évolution du taux chez les filles de 11–14 ans · 2019 → 2024",
      copy: `Le taux passe de ${formatNumber(girls[0].rate)} à ${formatNumber(girls.at(-1)!.rate)} pour 100 000 filles du même âge. La hausse observée après 2020 devient visible. Ces données décrivent des prises en charge hospitalières, pas toute la souffrance psychique.`,
      next: "Les garçons du même âge suivent-ils cette trajectoire ?",
    },
    {
      chapter: "04 · COMPARER À ÂGE ÉGAL",
      title: "Le même âge, une autre trajectoire",
      metric: `${formatSignedPercent(change(girls))} / ${formatSignedPercent(change(boys))}`,
      definition:
        "évolutions des taux · filles / garçons de 11–14 ans · 2019 → 2024",
      copy: `Chez les garçons, le taux passe de ${formatNumber(boys[0].rate)} à ${formatNumber(boys.at(-1)!.rate)} pour 100 000. Les deux courbes montrent une divergence : la progression n’est pas uniforme, même au sein d’une tranche d’âge.`,
      next: "L’hôpital montre le recours aux soins. Que voit-on en interrogeant directement les personnes ?",
    },
    {
      chapter: "05 · CHANGER DE SOURCE",
      title: "L’enquête révèle une autre inégalité.",
      metric: `× ${formatNumber(difficult.estimate / comfortable.estimate)}`,
      definition:
        "rapport des prévalences déclarées · difficulté financière / aisance · 2024",
      copy: `Un épisode dépressif caractérisé dans les 12 derniers mois est déclaré par ${formatNumber(comfortable.estimate)} % des adultes de 18–79 ans se disant à l’aise financièrement et ${formatNumber(difficult.estimate)} % de ceux en difficulté. Les quatre situations dessinent un gradient.`,
      next: "Cette association ne permet pas d’expliquer la trajectoire hospitalière : populations, périodes et mesures diffèrent.",
    },
  ];
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
                <StoryFigure data={data} scene={index as StoryScene} />
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
          <StoryFigure data={data} scene={scene} />
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
