import {
  getTerritoryConfiguration,
  calculateTerritoryMetrics,
  calculateProfileMetrics,
  calculateNationalSelection,
  type TerritoryDataset,
} from "../data/territoryMetrics";
import { scrollRangeProgress } from "../animation/progress";
import ChartHelp, {
  hospitalExplanation,
  emergencyExplanation,
  deathExplanation,
} from "../ChartHelp";
import { formatNumber, formatSignedPercent } from "../charts/format";
import { createYearLinePath } from "../charts/paths";
import {
  useAnimatedNumber,
  useAnimatedSeries,
  useAnimatedDistribution,
  useAnimatedAxisScale,
} from "../charts/useChartAnimations";
import {
  type ExperienceData,
  type ReferencePoint,
} from "../data/experienceTypes";
import {
  ODISSE_AGES,
  TERRITORY_AGES,
  TERRITORY_SEXES,
} from "../data/indicatorDefinitions";
import { indexSeries } from "../data/series";
import { ExplorerAnnotation } from "../ReadingIllustrations";
import TerritoryMap from "../TerritoryMap";
import ViewportTooltip from "../ViewportTooltip";
import { DeclaredExplorer } from "./DeclaredExplorer";
import { type GuidedView, EXPLORER_STEPS } from "./explorerSteps";
import { ScrollIndicator } from "./ScrollIndicator";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";

export function TerritoryExplorer({
  data,
  guidedView,
}: {
  data: ExperienceData;
  guidedView: GuidedView | null;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const step = EXPLORER_STEPS[stepIndex];
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const lab = useRef<HTMLDivElement>(null);
  const navigateStep = (index: number) => {
    const marker = landmarks.current[index];
    if (!marker) return;
    const line =
      (document.querySelector(".topbar")?.getBoundingClientRect().bottom ??
        60) + 16;
    window.scrollTo({
      top: window.scrollY + marker.getBoundingClientRect().top - line,
      behavior: "instant",
    });
  };
  useEffect(() => {
    let frame = 0;
    const synchronize = () => {
      frame = 0;
      const line =
        (document.querySelector(".topbar")?.getBoundingClientRect().bottom ??
          60) + 17;
      let index = 0;
      landmarks.current.forEach((marker, candidate) => {
        if (marker && marker.getBoundingClientRect().top <= line)
          index = candidate;
      });
      setStepIndex((current) => (current === index ? current : index));
      const bounds = landmarks.current[index]?.getBoundingClientRect();
      const fraction = bounds
        ? Math.max(
            0,
            Math.min(1, (line - bounds.top) / Math.max(1, bounds.height)),
          )
        : 0;
      setScrollPosition(index + fraction);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (landmarks.current[0]?.parentElement)
      observer.observe(landmarks.current[0].parentElement);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  const [mode, setMode] = useState<"territories" | "profiles" | "declared">(
    "declared",
  );
  const [territoryDataset, setTerritoryDataset] =
    useState<TerritoryDataset>("hospitalisations");
  const [chartView, setChartView] = useState<"level" | "change">("level");
  const [age, setAge] = useState("Tous");
  const [sex, setSex] = useState("Hommes et Femmes");
  const [profileAge, setProfileAge] = useState("11–14 ans");
  const [profileSex, setProfileSex] = useState("Femmes");
  const territoryConfig = useMemo(
    () => getTerritoryConfiguration(data, territoryDataset),
    [
      data.departments,
      data.emergencyDepartments,
      data.emergencyNational,
      data.national,
      data.suicideDepartments,
      data.suicideNational,
      territoryDataset,
    ],
  );
  const metrics = useMemo(
    () =>
      calculateTerritoryMetrics(territoryConfig, territoryDataset, age, sex),
    [
      age,
      sex,
      territoryConfig.departments,
      territoryConfig.endYear,
      territoryConfig.startYear,
      territoryDataset,
    ],
  );
  const profileMetrics = useMemo(
    () => calculateProfileMetrics(data),
    [data.odissePatients],
  );
  const departmentOptions = useMemo(
    () =>
      [...metrics].sort((a, b) =>
        a.department.code.localeCompare(b.department.code, "fr"),
      ),
    [metrics],
  );
  const [code, setCode] = useState("FR");
  const isNationalView = mode === "territories" && code === "FR";
  useEffect(() => {
    if (
      code !== "FR" &&
      !departmentOptions.some((row) => row.department.code === code)
    )
      setCode("FR");
  }, [code, departmentOptions]);
  useEffect(() => {
    setMode(step.mode);
    setTerritoryDataset(step.dataset);
    setChartView("level");
    setTooltip(null);
    setChartTooltip(null);
    setHoveredCode(null);
  }, [step]);
  useEffect(() => {
    if (!guidedView) return;
    setProfileAge("11–14 ans");
    setProfileSex("Femmes");
    navigateStep(guidedView.view === "profiles" ? 8 : 0);
  }, [guidedView]);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    department: string;
    region: string;
    change: number;
  } | null>(null);
  const [chartTooltip, setChartTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    year: number;
    rate: number;
    count?: number;
  } | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const [chartWidth, setChartWidth] = useState(500);
  const [chartLabelSize, setChartLabelSize] = useState(10);
  const distributionSvgRef = useRef<SVGSVGElement>(null);
  const [distributionWidth, setDistributionWidth] = useState(720);
  const [distributionHeight, setDistributionHeight] = useState(160);
  useLayoutEffect(() => {
    const element = chartSvgRef.current;
    if (!element) return;
    const updateWidth = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        setChartWidth((260 * bounds.width) / bounds.height);
        setChartLabelSize((260 * 10) / bounds.height);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);
  useLayoutEffect(() => {
    const element = distributionSvgRef.current;
    if (!element) return;
    const updateWidth = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        setDistributionWidth((160 * bounds.width) / bounds.height);
        setDistributionHeight(bounds.height);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);
  const selectionMetrics = useMemo(
    () => (mode === "territories" ? metrics : profileMetrics),
    [metrics, mode, profileMetrics],
  );
  const activeMetrics = useMemo(
    () => selectionMetrics.filter((row) => row.comparable),
    [selectionMetrics],
  );
  const selectedCode =
    mode === "territories" ? code : `${profileAge}|${profileSex}`;
  const reference = useMemo(
    () =>
      mode === "territories"
        ? territoryConfig.national.filter(
            (point) => point.age === age && point.sex === sex,
          )
        : data.odissePatients
            .filter(
              (point) =>
                point.age === profileAge &&
                point.sex === (profileSex === "Femmes" ? "Hommes" : "Femmes"),
            )
            .sort((a, b) => a.year - b.year),
    [
      age,
      data.odissePatients,
      mode,
      profileAge,
      profileSex,
      sex,
      territoryConfig.national,
    ],
  );
  const startYear = mode === "territories" ? territoryConfig.startYear : 2019;
  const endYear = mode === "territories" ? territoryConfig.endYear : 2024;
  const nationalSelection = useMemo(
    () =>
      calculateNationalSelection(
        reference,
        startYear,
        endYear,
        territoryDataset,
      ),
    [reference, startYear, endYear, territoryDataset],
  );
  const selected = isNationalView
    ? nationalSelection
    : (selectionMetrics.find((row) => row.department.code === selectedCode) ?? {
        department: {
          code: selectedCode,
          name: "Données indisponibles",
          region: "",
          series: [],
        },
        series: [],
        change: null,
        comparable: false,
      });
  const hoveredMetric =
    hoveredCode && hoveredCode !== selected.department.code
      ? selectionMetrics.find((row) => row.department.code === hoveredCode)
      : null;
  const chartSeries = useMemo(
    () =>
      chartView === "level"
        ? selected.series
        : indexSeries(selected.series, startYear),
    [chartView, selected.series, startYear],
  );
  const chartReference: { year: number; rate: number }[] = useMemo(
    () =>
      chartView === "level"
        ? reference
        : mode === "territories" && territoryDataset === "emergency"
          ? []
          : indexSeries(
              reference as { year: number; rate: number }[],
              startYear,
            ),
    [chartView, reference, startYear, mode, territoryDataset],
  );
  const chartHoveredSeries = useMemo(
    () =>
      hoveredMetric
        ? chartView === "level"
          ? hoveredMetric.series
          : indexSeries(hoveredMetric.series, startYear)
        : null,
    [chartView, hoveredMetric, startYear],
  );
  const referenceFirst = reference.find((point) => point.year === startYear);
  const referenceLast = reference.find((point) => point.year === endYear);
  const selectedFirst = selected.series.find(
    (point) => point.year === startYear,
  );
  const selectedLast = selected.series.find((point) => point.year === endYear);
  const usesAbsoluteChange =
    mode === "territories" && territoryDataset === "suicides";
  const hasNationalReference = Boolean(
    referenceFirst &&
      referenceLast &&
      (usesAbsoluteChange || referenceFirst.rate > 0),
  );
  const hasComparableNationalChange =
    hasNationalReference &&
    !(mode === "territories" && territoryDataset === "emergency");
  const nationalChange = hasNationalReference
    ? usesAbsoluteChange
      ? referenceLast!.rate - referenceFirst!.rate
      : 100 * (referenceLast!.rate / referenceFirst!.rate - 1)
    : 0;
  const levelGap =
    hasNationalReference && selectedLast
      ? usesAbsoluteChange
        ? selectedLast.rate - referenceLast!.rate
        : 100 * (selectedLast.rate / referenceLast!.rate - 1)
      : 0;
  const animatedChange = useAnimatedNumber(selected.change ?? 0);
  const animatedNationalLevel = useAnimatedNumber(referenceLast?.rate ?? 0);
  const animatedNationalChange = useAnimatedNumber(nationalChange);
  const animatedLevelGap = useAnimatedNumber(levelGap);
  const animatedSeries = useAnimatedSeries<ReferencePoint>(chartSeries);
  const animatedReference = useAnimatedSeries(chartReference);
  const animatedDistribution = useAnimatedDistribution(
    activeMetrics,
    selectedCode,
    distributionWidth,
    distributionHeight,
  );
  const targetMaxRate = useMemo(
    () =>
      Math.max(
        1,
        ...chartSeries.map((point) => point.rate),
        ...chartReference.map((point) => point.rate),
        ...(chartHoveredSeries ?? []).map((point) => point.rate),
      ) * 1.12,
    [chartReference, chartSeries, chartHoveredSeries],
  );
  const axisScale = useAnimatedAxisScale(targetMaxRate);
  const maxRate = axisScale.domainMax;
  const chartUnscale = chartLabelSize / 10;
  const tickWidth =
    Math.max(
      ...[0, targetMaxRate / 2, targetMaxRate, axisScale.previousMax].map(
        (tick) => formatNumber(tick, 0).length,
      ),
    ) * 7.2;
  const plotLeft = (tickWidth + 12) * chartUnscale;
  const plotRight = chartWidth - 44 * chartUnscale;
  const x = (point: { year: number }) =>
    plotLeft +
    ((point.year - startYear) / Math.max(1, endYear - startYear)) *
      (plotRight - plotLeft);
  const y = (point: { rate: number }) => 218 - (point.rate / maxRate) * 180;
  const { min, max, increaseShare } = animatedDistribution;
  const distributionMin =
    mode === "territories" && hasComparableNationalChange
      ? Math.min(min, animatedNationalChange)
      : min;
  const distributionMax =
    mode === "territories" && hasComparableNationalChange
      ? Math.max(max, animatedNationalChange)
      : max;
  const distributionX = (value: number) =>
    20 +
    ((value - distributionMin) /
      Math.max(0.001, distributionMax - distributionMin)) *
      (distributionWidth - 40);
  const nationalMarkerX = Math.max(
    20,
    Math.min(distributionWidth - 20, distributionX(animatedNationalChange)),
  );
  const formatEvolution = (value: number) =>
    usesAbsoluteChange
      ? `${value >= 0 ? "+" : "−"}${formatNumber(Math.abs(value), 1)}`
      : formatSignedPercent(value);
  const evolutionUnit = usesAbsoluteChange ? " pt" : "";
  const closestDistributionRow = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX =
      ((event.clientX - bounds.left) / bounds.width) * distributionWidth;
    const pointerY = ((event.clientY - bounds.top) / bounds.height) * 160;
    const closest = animatedDistribution.rows.reduce<{
      row: (typeof animatedDistribution.rows)[number];
      distance: number;
    } | null>((best, row) => {
      const distance = Math.hypot(
        pointerX - distributionX(row.change),
        pointerY - row.y,
      );
      return !best || distance < best.distance ? { row, distance } : best;
    }, null);
    return closest && closest.distance <= Math.max(16, closest.row.radius + 9)
      ? closest.row
      : null;
  };
  const moveAcrossDistribution = (event: ReactPointerEvent<SVGSVGElement>) => {
    const row = closestDistributionRow(event);
    setHoveredCode(row?.department.code ?? null);
    setTooltip(
      row
        ? {
            x: event.clientX,
            y: event.clientY,
            department: row.department.name,
            region: row.department.region,
            change: row.targetChange,
          }
        : null,
    );
  };
  const chooseClosestDistributionItem = (
    event: ReactPointerEvent<SVGSVGElement>,
  ) => {
    const row = closestDistributionRow(event);
    if (row) selectDistributionItem(row.department.code);
  };
  const selectDistributionItem = (itemCode: string) => {
    if (mode === "territories") {
      setCode(itemCode);
    } else {
      const [nextAge, nextSex] = itemCode.split("|");
      setProfileAge(nextAge);
      setProfileSex(nextSex);
    }
  };
  const switchMode = (nextMode: "territories" | "profiles" | "declared") =>
    navigateStep(nextMode === "profiles" ? 8 : nextMode === "declared" ? 0 : 7);
  const switchTerritoryDataset = (
    dataset: "hospitalisations" | "emergency" | "suicides",
  ) =>
    navigateStep(dataset === "emergency" ? 6 : dataset === "suicides" ? 9 : 7);
  const chooseMeasureFamily = (
    family: "declared" | "emergency" | "hospital" | "deaths",
  ) =>
    navigateStep(
      family === "declared"
        ? 0
        : family === "emergency"
          ? 6
          : family === "hospital"
            ? 7
            : 9,
    );
  const family =
    mode === "declared"
      ? "declared"
      : mode === "territories" && territoryDataset === "emergency"
        ? "emergency"
        : mode === "profiles" ||
            (mode === "territories" && territoryDataset === "hospitalisations")
          ? "hospital"
          : "deaths";
  const title =
    mode === "territories"
      ? selected.department.name
      : `${profileAge} · ${profileSex}`;
  const referenceLabel =
    mode === "territories"
      ? territoryDataset === "emergency"
        ? "France · référence couverte"
        : "France"
      : `${profileSex === "Femmes" ? "Hommes" : "Femmes"} · ${profileAge}`;
  const measureLabel =
    mode === "territories"
      ? territoryConfig.label
      : "Patients en MCO pour gestes auto-infligés";
  const measureUnit =
    mode === "territories"
      ? territoryConfig.unit
      : "taux brut pour 100 000 personnes du même âge et sexe";
  const changeLabel = usesAbsoluteChange
    ? "Écart du taux"
    : "Évolution du taux";
  const context =
    mode === "territories"
      ? `${age === "Tous" ? "Tous les âges" : age} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex} · ${chartView === "level" ? territoryConfig.unit : `indice, ${startYear} = 100`}`
      : `France entière · ${profileSex === "Femmes" ? "patientes" : "patients"} hospitalisés · ${chartView === "level" ? "taux pour 100 000" : "indice, 2019 = 100"}`;
  const filterLabels =
    mode === "territories"
      ? [
          `${selected.department.code} · ${selected.department.name}`,
          age === "Tous" ? "Tous les âges" : age,
          sex === "Hommes et Femmes" ? "Tous les sexes" : sex,
        ]
      : [profileAge, profileSex];
  const filterWidth = `${Math.max(...filterLabels.map((label) => Array.from(label).length)) + 5}ch`;
  const chartYears = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => startYear + index,
  );
  return (
    <section className="territory-appendix" id="territoires">
      <header className="section-heading">
        <p className="chapter">EXPLORER · QUATRE REGARDS</p>
        <div>
          <h2>
            Changer de regard
            <br />
            Explorer les données
          </h2>
          <p>
            Défilez pour passer de l’expérience déclarée aux urgences, à
            l’hôpital puis aux décès. À chaque étape, les filtres restent
            disponibles pour approfondir la mesure.
          </p>
        </div>
      </header>
      <div className="explorer-scroll-track">
        <ol
          className="explorer-scroll-landmarks"
          aria-label="Étapes du parcours Explorer"
        >
          {EXPLORER_STEPS.map((item, index) => (
            <li
              id={`explorer-step-${index + 1}`}
              key={item.label}
              ref={(element) => {
                landmarks.current[index] = element;
              }}
            >
              <span className="sr-only">
                {index + 1}. {item.label}
              </span>
            </li>
          ))}
        </ol>
        <div
          className="territory-lab"
          id="territory-explorer"
          ref={lab}
          data-mode={mode}
          data-dataset={territoryDataset}
          data-step={stepIndex}
        >
          <div className="explorer-navigation">
            <div
              className="explorer-mode data-types"
              role="group"
              aria-label="Choisir une mesure de santé mentale"
            >
              <button
                type="button"
                aria-pressed={family === "declared"}
                onClick={() => chooseMeasureFamily("declared")}
              >
                Déclaré <span>Enquête · expérience rapportée</span>
                <ScrollIndicator
                  progress={scrollRangeProgress(scrollPosition, 0, 6)}
                />
              </button>
              <button
                type="button"
                aria-pressed={family === "emergency"}
                onClick={() => chooseMeasureFamily("emergency")}
              >
                Urgences <span>Recours aigu · OSCOUR®</span>
                <ScrollIndicator
                  progress={scrollRangeProgress(scrollPosition, 6, 1)}
                />
              </button>
              <button
                type="button"
                aria-pressed={family === "hospital"}
                onClick={() => chooseMeasureFamily("hospital")}
              >
                Hôpital <span>Patients et séjours · MCO</span>
                <ScrollIndicator
                  progress={scrollRangeProgress(scrollPosition, 7, 2)}
                />
              </button>
              <button
                type="button"
                aria-pressed={family === "deaths"}
                onClick={() => chooseMeasureFamily("deaths")}
              >
                Décès <span>Suicides enregistrés</span>
                <ScrollIndicator
                  progress={scrollRangeProgress(scrollPosition, 9, 1)}
                />
              </button>
            </div>
            {family === "hospital" && (
              <div
                className="measure-subnav"
                role="group"
                aria-label="Vue hospitalière"
              >
                <button
                  type="button"
                  aria-pressed={mode === "territories"}
                  onClick={() => switchTerritoryDataset("hospitalisations")}
                >
                  Séjours · départements
                  <ScrollIndicator
                    progress={scrollRangeProgress(scrollPosition, 7)}
                  />
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "profiles"}
                  onClick={() => switchMode("profiles")}
                >
                  Patients · âge × sexe
                  <ScrollIndicator
                    progress={scrollRangeProgress(scrollPosition, 8)}
                  />
                </button>
              </div>
            )}
          </div>
          {mode === "declared" ? (
            <DeclaredExplorer
              data={data}
              step={step}
              position={scrollPosition}
              onNavigate={navigateStep}
            />
          ) : (
            <>
              <div
                className="territory-selector"
                style={{ "--filter-width": filterWidth } as CSSProperties}
              >
                <div className="territory-filters">
                  {mode === "territories" && (
                    <label htmlFor="department">
                      Territoire
                      <select
                        id="department"
                        value={code}
                        onChange={(event) => {
                          setCode(event.target.value);
                          if (event.target.value === "FR")
                            setChartView("level");
                        }}
                      >
                        <option value="FR">
                          {territoryDataset === "emergency"
                            ? "France · référence couverte"
                            : "France entière"}
                        </option>
                        {departmentOptions.map((row) => (
                          <option
                            key={row.department.code}
                            value={row.department.code}
                          >
                            {row.department.code} · {row.department.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label htmlFor="territory-age">
                    Tranche d’âge
                    <select
                      id="territory-age"
                      value={mode === "territories" ? age : profileAge}
                      onChange={(event) =>
                        mode === "territories"
                          ? setAge(event.target.value)
                          : setProfileAge(event.target.value)
                      }
                    >
                      {(mode === "territories"
                        ? TERRITORY_AGES
                        : ODISSE_AGES
                      ).map((item) => (
                        <option key={item} value={item}>
                          {item === "Tous" ? "Tous les âges" : item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label htmlFor="territory-sex">
                    Sexe
                    <select
                      id="territory-sex"
                      value={mode === "territories" ? sex : profileSex}
                      onChange={(event) =>
                        mode === "territories"
                          ? setSex(event.target.value)
                          : setProfileSex(event.target.value)
                      }
                    >
                      {(mode === "territories"
                        ? TERRITORY_SEXES
                        : ["Femmes", "Hommes"]
                      ).map((item) => (
                        <option key={item} value={item}>
                          {item === "Hommes et Femmes"
                            ? "Tous les sexes"
                            : item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {mode === "territories" && (
                  <TerritoryMap
                    legend={`Évolution · ${territoryConfig.startYear} → ${territoryConfig.endYear} · ${territoryDataset === "suicides" ? "pt de taux" : "%"}`}
                    context={`${territoryConfig.label} · ${age === "Tous" ? "Tous les âges" : age} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex}`}
                    level="departments"
                    selected={code}
                    preview={hoveredCode}
                    items={metrics.map((row) => ({
                      code: row.department.code,
                      name: row.department.name,
                      value: row.comparable
                        ? (row.change ?? undefined)
                        : undefined,
                      available: row.series.length > 0,
                      detail:
                        row.comparable && row.change != null
                          ? `${territoryDataset === "suicides" ? `${row.change >= 0 ? "+" : "−"}${formatNumber(Math.abs(row.change))} pt` : formatSignedPercent(row.change)} · ${territoryConfig.startYear} → ${territoryConfig.endYear}`
                          : "Évolution non interprétable",
                    }))}
                    onPreview={setHoveredCode}
                    onSelect={(nextCode) => {
                      setCode(nextCode);
                      if (nextCode === "FR") setChartView("level");
                    }}
                  />
                )}
                <div className="territory-summary">
                  <div className="metric-definition">
                    <b>{measureLabel}</b>
                    <span>{measureUnit}</span>
                  </div>
                  {isNationalView &&
                  territoryDataset === "emergency" &&
                  referenceLast ? (
                    <>
                      <span className="metric-period">
                        Niveau de la référence couverte · {endYear}
                      </span>
                      <strong className="animated-number" aria-hidden="true">
                        {formatNumber(animatedNationalLevel)}
                      </strong>
                      <span className="metric-endpoints">
                        Pour 100 000 passages codés · périmètre variable.
                      </span>
                    </>
                  ) : selected.comparable ? (
                    <>
                      <span className="metric-period">
                        {changeLabel} · {startYear} → {endYear}
                      </span>
                      <strong className="animated-number" aria-hidden="true">
                        {formatEvolution(animatedChange)}
                        {evolutionUnit}
                      </strong>
                      <span className="metric-endpoints">
                        {formatNumber(selectedFirst!.rate)} en {startYear} →{" "}
                        {formatNumber(selectedLast!.rate)} en {endYear}
                      </span>
                    </>
                  ) : (
                    <div className="low-sample">
                      <strong>
                        {isNationalView
                          ? "Référence indisponible"
                          : selected.change == null
                            ? "Comparaison indisponible"
                            : "Effectif faible"}
                      </strong>
                      <span>
                        {isNationalView ? (
                          "Pour ce regroupement d’âge et de sexe."
                        ) : (
                          <>
                            {selected.change == null
                              ? "Deux valeurs comparables sont nécessaires aux dates retenues."
                              : "Moins de 10 décès à l’une des deux dates : évolution non interprétable."}{" "}
                            La courbe disponible reste descriptive.
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  {mode === "territories" &&
                    !isNationalView &&
                    selected.comparable &&
                    (hasNationalReference ? (
                      <p
                        className={`relative-level ${Math.abs(animatedLevelGap) < 0.05 ? "is-neutral" : animatedLevelGap > 0 ? "is-positive" : "is-negative"}`}
                      >
                        {Math.abs(animatedLevelGap) < 0.05 ? (
                          <>
                            Au niveau de{" "}
                            {territoryDataset === "emergency"
                              ? "la référence nationale couverte"
                              : "la France"}{" "}
                            en {endYear}
                          </>
                        ) : (
                          <>
                            <b>{formatEvolution(animatedLevelGap)}</b>{" "}
                            {usesAbsoluteChange
                              ? "point de taux pour 100 000"
                              : ""}{" "}
                            par rapport à{" "}
                            {territoryDataset === "emergency"
                              ? "la référence nationale couverte"
                              : "la France"}{" "}
                            en {endYear}
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="relative-level is-neutral">
                        Référence nationale indisponible pour ce regroupement
                      </p>
                    ))}
                  <span className="sr-only" aria-live="polite">
                    {title}. {measureLabel}.{" "}
                    {selected.comparable
                      ? `${changeLabel} ${formatEvolution(selected.change!)}${evolutionUnit} entre ${startYear} et ${endYear}.`
                      : "Évolution non interprétable."}
                  </span>
                </div>
              </div>
              <div className="territory-chart" data-national={isNationalView}>
                <h3
                  className="data-change"
                  key={`${mode}-${selected.department.code}`}
                >
                  {title}
                </h3>
                <p className="territory-context">
                  {measureLabel} · {context}
                </p>
                {!usesAbsoluteChange &&
                  !(isNationalView && territoryDataset === "emergency") && (
                    <div
                      className="chart-view-toggle"
                      role="group"
                      aria-label="Mesure affichée"
                    >
                      <button
                        type="button"
                        aria-pressed={chartView === "level"}
                        onClick={() => setChartView("level")}
                      >
                        Niveau
                      </button>
                      <button
                        type="button"
                        aria-pressed={chartView === "change"}
                        onClick={() => setChartView("change")}
                      >
                        Évolution · base 100
                      </button>
                    </div>
                  )}
                <svg
                  ref={chartSvgRef}
                  style={
                    {
                      "--chart-label-size": `${chartLabelSize}px`,
                    } as CSSProperties
                  }
                  viewBox={`0 0 ${chartWidth} 260`}
                  role="img"
                  aria-label={`${title}, ${chartView === "level" ? "taux réel" : "évolution en base 100"}, ${isNationalView ? "référence nationale" : `comparé à ${referenceLabel}`}`}
                >
                  <g
                    className="chart-grid chart-grid-old"
                    opacity={1 - axisScale.progress}
                  >
                    {[axisScale.previousMax / 2, axisScale.previousMax].map(
                      (tick, index) => (
                        <g key={`old-${index}`}>
                          <line
                            x1={plotLeft}
                            x2={plotRight}
                            y1={y({ rate: tick })}
                            y2={y({ rate: tick })}
                          />
                          <text x="0" y={y({ rate: tick }) + 4 * chartUnscale}>
                            {formatNumber(tick, 0)}
                          </text>
                        </g>
                      ),
                    )}
                  </g>
                  <g
                    className="chart-grid chart-grid-new"
                    opacity={axisScale.progress}
                  >
                    {[targetMaxRate / 2, targetMaxRate].map((tick, index) => (
                      <g key={`new-${index}`}>
                        <line
                          x1={plotLeft}
                          x2={plotRight}
                          y1={y({ rate: tick })}
                          y2={y({ rate: tick })}
                        />
                        <text x="0" y={y({ rate: tick }) + 4 * chartUnscale}>
                          {formatNumber(tick, 0)}
                        </text>
                      </g>
                    ))}
                  </g>
                  <g className="chart-grid chart-grid-zero">
                    <line
                      x1={plotLeft}
                      x2={plotRight}
                      y1={y({ rate: 0 })}
                      y2={y({ rate: 0 })}
                    />
                    <text x="0" y={y({ rate: 0 }) + 4 * chartUnscale}>
                      0
                    </text>
                  </g>
                  {chartView === "change" && (
                    <line
                      className="index-baseline"
                      x1={plotLeft}
                      x2={plotRight}
                      y1={y({ rate: 100 })}
                      y2={y({ rate: 100 })}
                    />
                  )}
                  <path
                    className="national-line"
                    d={createYearLinePath(
                      animatedReference,
                      x,
                      y,
                      mode === "territories" && territoryDataset === "emergency"
                        ? [2022, 2023]
                        : [],
                    )}
                  />
                  {mode === "territories" &&
                    territoryDataset === "emergency" &&
                    !isNationalView &&
                    animatedReference.map((point) => {
                      const info = {
                        label: "France · référence couverte",
                        year: point.year,
                        rate:
                          reference.find(
                            (candidate) => candidate.year === point.year,
                          )?.rate ?? point.rate,
                      };
                      return (
                        <g
                          className="chart-point"
                          key={point.year}
                          role="img"
                          tabIndex={0}
                          aria-label={`${info.label}, ${info.year}, ${formatNumber(info.rate)} pour 100 000 passages codés, périmètre variable`}
                          onPointerMove={(event) =>
                            setChartTooltip({
                              x: event.clientX,
                              y: event.clientY,
                              ...info,
                            })
                          }
                          onPointerLeave={(event) => {
                            if (document.activeElement !== event.currentTarget)
                              setChartTooltip(null);
                          }}
                          onFocus={(event) => {
                            const bounds =
                              event.currentTarget.getBoundingClientRect();
                            setChartTooltip({
                              x: bounds.left + bounds.width / 2,
                              y: bounds.top,
                              ...info,
                            });
                          }}
                          onBlur={() => setChartTooltip(null)}
                        >
                          <circle
                            className="chart-hit"
                            cx={x(point)}
                            cy={y(point)}
                            r="11"
                          />
                          <circle
                            className="reference-dot"
                            cx={x(point)}
                            cy={y(point)}
                            r="2"
                          />
                        </g>
                      );
                    })}
                  {mode === "territories" &&
                    territoryDataset === "emergency" &&
                    [2022, 2023].map((year, index) => {
                      const point = animatedReference.find(
                        (candidate) => candidate.year === year,
                      );
                      if (!point) return null;
                      const label =
                        year === 2022
                          ? "PACA / Corse exclues"
                          : "Martinique incluse";
                      const compact = chartWidth / chartLabelSize < 55;
                      return (
                        <g className="scope-annotation" key={`scope-${year}`}>
                          <title>
                            {year} : changement de périmètre national · {label}
                          </title>
                          <line
                            x1={x(point)}
                            x2={x(point)}
                            y1={y(point) - 5}
                            y2={y(point) - (compact ? 10 : 24)}
                          />
                          <text
                            x={x(point)}
                            y={y(point) - (compact ? 14 : 40)}
                            textAnchor="middle"
                          >
                            {compact ? (
                              index === 0 ? (
                                "①"
                              ) : (
                                "②"
                              )
                            ) : (
                              <>
                                <tspan x={x(point)}>
                                  {index === 0 ? "①" : "②"} Périmètre
                                </tspan>
                                <tspan x={x(point)} dy="1.4em">
                                  {label}
                                </tspan>
                              </>
                            )}
                          </text>
                        </g>
                      );
                    })}
                  {chartHoveredSeries && (
                    <path
                      key={`${hoveredMetric?.department.code}-${chartView}`}
                      className="hover-line"
                      d={createYearLinePath(chartHoveredSeries, x, y)}
                      aria-hidden="true"
                    />
                  )}
                  {!isNationalView && (
                    <path
                      className="department-line"
                      d={createYearLinePath(animatedSeries, x, y)}
                    />
                  )}
                  {animatedSeries.map((point) => {
                    const targetValue =
                      chartSeries.find(
                        (candidate) => candidate.year === point.year,
                      )?.rate ?? point.rate;
                    const targetPoint = selected.series.find(
                      (candidate) => candidate.year === point.year,
                    );
                    const pointTooltip = {
                      label: selected.department.name,
                      year: point.year,
                      rate: targetValue,
                      count:
                        targetPoint && "count" in targetPoint
                          ? targetPoint.count
                          : undefined,
                    };
                    const unit =
                      chartView === "level"
                        ? mode === "territories"
                          ? territoryConfig.unit
                          : "taux pour 100 000"
                        : `indice · ${startYear} = 100`;
                    return (
                      <g
                        key={point.year}
                        className="chart-point"
                        role="img"
                        tabIndex={0}
                        aria-label={`${selected.department.name}, ${point.year}, ${formatNumber(targetValue)}, ${unit}`}
                        onPointerMove={(event) =>
                          setChartTooltip({
                            x: event.clientX,
                            y: event.clientY,
                            ...pointTooltip,
                          })
                        }
                        onPointerLeave={(event) => {
                          if (document.activeElement !== event.currentTarget)
                            setChartTooltip(null);
                        }}
                        onFocus={(event) => {
                          const bounds =
                            event.currentTarget.getBoundingClientRect();
                          setChartTooltip({
                            x: bounds.left + bounds.width / 2,
                            y: bounds.top,
                            ...pointTooltip,
                          });
                        }}
                        onBlur={() => setChartTooltip(null)}
                      >
                        <circle
                          className="chart-hit"
                          cx={x(point)}
                          cy={y(point)}
                          r="11"
                        />
                        <circle
                          className="chart-dot"
                          cx={x(point)}
                          cy={y(point)}
                          r="3"
                        />
                      </g>
                    );
                  })}
                  {axisScale.progress === 1 &&
                    (() => {
                      const point = animatedSeries.at(-1);
                      if (!point) return null;
                      const target = chartSeries.find(
                        (p) => p.year === point.year,
                      );
                      if (!target || Math.abs(point.rate - target.rate) > 0.001)
                        return null;
                      const other =
                        selected.comparable && !isNationalView
                          ? animatedReference.find((p) => p.year === point.year)
                          : undefined;
                      return (
                        <ExplorerAnnotation
                          x={x(point)}
                          y={y(point)}
                          comparisonY={
                            other && point.year === endYear
                              ? y(other)
                              : undefined
                          }
                          rightX={plotRight + chartLabelSize * 1.4}
                          bracketSize={chartLabelSize * 1.5}
                        />
                      );
                    })()}
                  {chartYears.map((year) => (
                    <text
                      key={year}
                      x={x({ year })}
                      y="250"
                      textAnchor={
                        year === startYear
                          ? "start"
                          : year === endYear
                            ? "end"
                            : "middle"
                      }
                    >
                      {year}
                    </text>
                  ))}
                </svg>
                <div className="legend">
                  {!isNationalView && (
                    <span
                      className="department selected-legend"
                      title={selected.department.name}
                    >
                      {selected.department.name}
                    </span>
                  )}
                  {chartReference.length > 0 && (
                    <span className="france">{referenceLabel}</span>
                  )}
                  <span
                    className={`hovered hovered-slot${hoveredMetric ? "" : " is-empty"}`}
                    title={hoveredMetric?.department.name}
                  >
                    {hoveredMetric?.department.name ?? "Aperçu au survol"}
                  </span>
                </div>
                {mode === "territories" && territoryDataset === "emergency" && (
                  <p className="chart-scope-note">
                    ① 2022 : PACA et Corse exclues. ② 2023 : Martinique incluse.
                    Périmètre variable : les segments ne se raccordent pas ;
                    aucune évolution nationale calculée.
                  </p>
                )}
                {mode === "territories" &&
                  territoryDataset === "suicides" &&
                  age === "00–17 ans" && (
                    <p className="chart-scope-note">
                      Référence France non calculable : le taux arrondi à zéro
                      des 0–10 ans empêche de reconstituer le dénominateur des
                      0–17 ans.
                    </p>
                  )}
                {chartTooltip && (
                  <ViewportTooltip
                    x={chartTooltip.x}
                    y={chartTooltip.y}
                    className="chart-tooltip"
                  >
                    <span>{chartTooltip.label}</span>
                    <small>
                      {chartTooltip.year} ·{" "}
                      {chartView === "level"
                        ? mode === "territories"
                          ? territoryConfig.unit
                          : "taux pour 100 000"
                        : "indice base 100"}
                      {chartTooltip.count != null
                        ? ` · effectif diffusé ≈ ${formatNumber(chartTooltip.count, 1)}`
                        : ""}
                    </small>
                    <strong>{formatNumber(chartTooltip.rate)}</strong>
                  </ViewportTooltip>
                )}
              </div>
              <div className="distribution">
                <small className="distribution-kicker">
                  Distribution des{" "}
                  {usesAbsoluteChange ? "écarts de taux" : "évolutions"} ·{" "}
                  {startYear} → {endYear}
                </small>
                <p className="distribution-explanation">
                  {mode === "territories"
                    ? `Un point = un département avec une évolution calculable aux deux dates${usesAbsoluteChange ? " et au moins 10 décès à chacune" : ""}. ${isNationalView ? "Survolez un point pour révéler sa courbe, cliquez pour sélectionner ce département." : "Le point orange est votre sélection."} Le repère France apparaît lorsque son évolution est comparable.`
                    : "Un point = un groupe d’âge et de sexe. Le point orange est votre sélection ; la courbe en pointillés montre l’autre sexe au même âge."}
                </p>
                {activeMetrics.length ? (
                  <p>
                    <b>{formatNumber(increaseShare)} %</b>{" "}
                    {mode === "territories"
                      ? `des ${activeMetrics.length} départements retenus augmentent pour cette sélection.`
                      : `des ${activeMetrics.length} trajectoires âge × sexe augmentent entre ${startYear} et ${endYear}.`}
                  </p>
                ) : (
                  <p className="no-comparison">
                    Aucun département ne remplit les conditions de comparaison
                    pour cette sélection.
                  </p>
                )}
                <svg
                  ref={distributionSvgRef}
                  viewBox={`0 0 ${distributionWidth} 160`}
                  aria-label={
                    mode === "territories"
                      ? "Choisir un département dans la distribution de leurs évolutions. La France est indiquée comme second repère lorsqu’elle est comparable."
                      : "Choisir un profil âge et sexe dans la distribution de leurs évolutions."
                  }
                  onPointerMove={moveAcrossDistribution}
                  onPointerLeave={() => {
                    setHoveredCode(null);
                    setTooltip(null);
                  }}
                  onPointerUp={chooseClosestDistributionItem}
                >
                  <rect
                    className="distribution-interaction"
                    x="0"
                    y="0"
                    width={distributionWidth}
                    height="160"
                  />
                  <line
                    className="distribution-axis"
                    x1="0"
                    x2={distributionWidth}
                    y1="80"
                    y2="80"
                  />
                  <line
                    className="zero-marker"
                    x1={distributionX(0)}
                    x2={distributionX(0)}
                    y1="24"
                    y2="140"
                  />
                  <text
                    className="zero-label"
                    x={distributionX(0)}
                    y="17"
                    textAnchor="middle"
                  >
                    0{evolutionUnit || " %"}
                  </text>
                  {mode === "territories" && hasComparableNationalChange && (
                    <>
                      <line
                        className="national-marker"
                        x1={nationalMarkerX}
                        x2={nationalMarkerX}
                        y1="35"
                        y2="140"
                      />
                      <text
                        className="national-marker-label"
                        x={nationalMarkerX}
                        y="29"
                        textAnchor="middle"
                      >
                        France {formatEvolution(animatedNationalChange)}
                        {evolutionUnit}
                      </text>
                    </>
                  )}
                  {[...animatedDistribution.rows]
                    .sort((a, b) =>
                      a.department.code === selected.department.code
                        ? 1
                        : b.department.code === selected.department.code
                          ? -1
                          : 0,
                    )
                    .map((row) => {
                      const isSelected =
                        row.department.code === selected.department.code;
                      const selectItem = () =>
                        selectDistributionItem(row.department.code);
                      const tooltipData = {
                        department: row.department.name,
                        region: row.department.region,
                        change: row.targetChange,
                      };
                      return (
                        <g
                          key={row.department.code}
                          className={`distribution-point${isSelected ? " selected" : ""}${hoveredCode === row.department.code ? " is-hovered" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${row.department.name}, ${row.department.region}, évolution ${formatEvolution(row.targetChange)}${evolutionUnit}. Sélectionner.`}
                          onFocus={(event) => {
                            const bounds =
                              event.currentTarget.getBoundingClientRect();
                            setHoveredCode(row.department.code);
                            setTooltip({
                              x: bounds.left + bounds.width / 2,
                              y: bounds.top,
                              ...tooltipData,
                            });
                          }}
                          onBlur={() => {
                            setHoveredCode(null);
                            setTooltip(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectItem();
                            }
                          }}
                        >
                          <circle
                            className="distribution-dot"
                            cx={distributionX(row.change)}
                            cy={row.y}
                            r={row.radius}
                          >
                            <title>
                              {row.department.name} · {row.department.region} :{" "}
                              {formatEvolution(row.targetChange)}
                              {evolutionUnit}
                            </title>
                          </circle>
                        </g>
                      );
                    })}
                </svg>
                {tooltip && (
                  <ViewportTooltip x={tooltip.x} y={tooltip.y}>
                    <span>{tooltip.department}</span>
                    <small>{tooltip.region}</small>
                    <strong>
                      {formatEvolution(tooltip.change)}
                      {evolutionUnit}
                    </strong>
                  </ViewportTooltip>
                )}
                <span>
                  {formatEvolution(distributionMin)}
                  {evolutionUnit}
                </span>
                <span>
                  {formatEvolution(distributionMax)}
                  {evolutionUnit}
                </span>
              </div>
              <ChartHelp
                key={`${mode}-${territoryDataset}-${selectedCode}-${age}-${sex}-${chartView}`}
                explanation={
                  mode === "profiles"
                    ? hospitalExplanation(
                        true,
                        `${title} · France`,
                        false,
                        chartView === "change",
                      )
                    : territoryDataset === "emergency"
                      ? emergencyExplanation(
                          `${title} · ${context}`,
                          chartView === "change",
                        )
                      : territoryDataset === "suicides"
                        ? deathExplanation(`${title} · ${context}`)
                        : hospitalExplanation(
                            false,
                            `${title} · ${context}`,
                            age === "Tous",
                            chartView === "change",
                          )
                }
              />
            </>
          )}
        </div>
        <div className="explorer-scroll-status">
          <span>
            <b>
              {String(stepIndex + 1).padStart(2, "0")} / {EXPLORER_STEPS.length}
            </b>{" "}
            · {step.label}
          </span>
          <span>
            Défilez pour{" "}
            {stepIndex === EXPLORER_STEPS.length - 1
              ? "continuer"
              : "changer de regard"}{" "}
            ↓
          </span>
        </div>
      </div>
      <p className="source-note">
        <b>Lecture.</b> Chaque source mesure une réalité différente. Les unités,
        périmètres et limites sont précisés dans les boutons « ? ». Source :
        Odissé, Santé publique France.
      </p>
    </section>
  );
}
