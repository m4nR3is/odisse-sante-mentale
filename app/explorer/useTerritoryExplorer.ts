import {
  measureFamilyFor,
  entryStepForMode,
  entryStepForDataset,
  entryStepForFamily,
  type ExplorerMode,
  type MeasureFamily,
} from "./explorerSteps";
import { useTerritoryChartSize } from "./useTerritoryChartSize";
import {
  territoryChartGeometry,
  distributionGeometry,
} from "../charts/geometry";
import {
  selectReferenceSeries,
  findSelectionMetric,
  seriesForChart,
  calculateReferenceMetrics,
} from "../data/territorySelection";
import type { TerritoryExplorerProps } from "./explorerTypes";
import { useExplorerScrollNavigation } from "./useExplorerScrollNavigation";
import { type ReferencePoint } from "../data/experienceTypes";
import {
  useState,
  useEffect,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  type TerritoryDataset,
  getTerritoryConfiguration,
  calculateTerritoryMetrics,
  calculateProfileMetrics,
  calculateNationalSelection,
} from "../data/territoryMetrics";
import {
  useAnimatedNumber,
  useAnimatedSeries,
  useAnimatedDistribution,
  useAnimatedAxisScale,
} from "../charts/useChartAnimations";
import { formatNumber, formatSignedPercent } from "../charts/format";

export function useTerritoryExplorer({
  data,
  guidedView,
}: TerritoryExplorerProps) {
  const { stepIndex, scrollPosition, step, landmarks, lab, navigateStep } =
    useExplorerScrollNavigation();
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
    navigateStep(entryStepForMode(guidedView.view));
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
  const {
    chartSvgRef,
    chartWidth,
    chartLabelSize,
    distributionSvgRef,
    distributionWidth,
    distributionHeight,
  } = useTerritoryChartSize(mode);
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
      selectReferenceSeries({
        data,
        mode,
        configuration: territoryConfig,
        age,
        sex,
        profileAge,
        profileSex,
      }),
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
    : findSelectionMetric(selectionMetrics, selectedCode);
  const hoveredMetric =
    hoveredCode && hoveredCode !== selected.department.code
      ? selectionMetrics.find((row) => row.department.code === hoveredCode)
      : null;
  const chartSeries = useMemo(
    () => seriesForChart(selected.series, startYear, chartView),
    [chartView, selected.series, startYear],
  );
  const chartReference: { year: number; rate: number }[] = useMemo(
    () =>
      seriesForChart(
        reference,
        startYear,
        chartView,
        !(mode === "territories" && territoryDataset === "emergency"),
      ),
    [chartView, reference, startYear, mode, territoryDataset],
  );
  const chartHoveredSeries = useMemo(
    () =>
      hoveredMetric
        ? seriesForChart(hoveredMetric.series, startYear, chartView)
        : null,
    [chartView, hoveredMetric, startYear],
  );
  const usesAbsoluteChange =
    mode === "territories" && territoryDataset === "suicides";
  const {
    referenceLast,
    selectedFirst,
    selectedLast,
    hasNationalReference,
    hasComparableNationalChange,
    nationalChange,
    levelGap,
  } = calculateReferenceMetrics(
    reference,
    selected,
    startYear,
    endYear,
    usesAbsoluteChange,
    mode === "territories" && territoryDataset === "emergency",
  );
  const animatedChange = useAnimatedNumber(selected.change ?? 0);
  const animatedNationalLevel = useAnimatedNumber(referenceLast?.rate ?? 0);
  const animatedNationalChange = useAnimatedNumber(nationalChange ?? 0);
  const animatedLevelGap = useAnimatedNumber(levelGap ?? 0);
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
  const { chartUnscale, plotLeft, plotRight, x, y } = territoryChartGeometry({
    width: chartWidth,
    labelSize: chartLabelSize,
    targetMaxRate,
    previousMax: axisScale.previousMax,
    maxRate,
    startYear,
    endYear,
  });
  const { min, max, increaseShare } = animatedDistribution;
  const distributionMin =
    mode === "territories" && hasComparableNationalChange
      ? Math.min(min, animatedNationalChange)
      : min;
  const distributionMax =
    mode === "territories" && hasComparableNationalChange
      ? Math.max(max, animatedNationalChange)
      : max;
  const { x: distributionX, markerX } = distributionGeometry(
    distributionWidth,
    distributionMin,
    distributionMax,
    0.001,
  );
  const nationalMarkerX = markerX(animatedNationalChange);
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
  const switchMode = (nextMode: ExplorerMode) =>
    navigateStep(entryStepForMode(nextMode));
  const switchTerritoryDataset = (dataset: TerritoryDataset) =>
    navigateStep(entryStepForDataset(dataset));
  const chooseMeasureFamily = (family: MeasureFamily) =>
    navigateStep(entryStepForFamily(family));
  const family = measureFamilyFor(mode, territoryDataset);
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

  // Chaque panneau reçoit son contrat, tandis que les sélections restent ici.
  return {
    navigation: {
      family,
      chooseMeasureFamily,
      scrollPosition,
      mode,
      switchTerritoryDataset,
      switchMode,
    },
    selection: {
      filterWidth,
      mode,
      filters: {
        mode,
        code,
        setCode,
        setChartView,
        territoryDataset,
        departmentOptions,
        age,
        profileAge,
        setAge,
        setProfileAge,
        sex,
        profileSex,
        setSex,
        setProfileSex,
      },
      metric: {
        measureLabel,
        measureUnit,
        isNationalView,
        territoryDataset,
        referenceLast,
        endYear,
        animatedNationalLevel,
        selected,
        changeLabel,
        startYear,
        formatEvolution,
        animatedChange,
        evolutionUnit,
        selectedFirst,
        selectedLast,
        mode,
        hasNationalReference,
        animatedLevelGap,
        usesAbsoluteChange,
        title,
      },
      map: {
        territoryConfig,
        territoryDataset,
        age,
        sex,
        code,
        hoveredCode,
        metrics,
        setHoveredCode,
        setCode,
        setChartView,
      },
    },
    chart: {
      isNationalView,
      mode,
      selected,
      title,
      measureLabel,
      context,
      usesAbsoluteChange,
      territoryDataset,
      chartView,
      setChartView,
      chartSvgRef,
      chartLabelSize,
      chartWidth,
      referenceLabel,
      axisScale,
      plotLeft,
      plotRight,
      y,
      chartUnscale,
      targetMaxRate,
      animatedReference,
      x,
      reference,
      setChartTooltip,
      chartHoveredSeries,
      hoveredMetric,
      animatedSeries,
      chartSeries,
      territoryConfig,
      startYear,
      endYear,
      chartYears,
      chartReference,
      age,
      chartTooltip,
    },
    distribution: {
      usesAbsoluteChange,
      startYear,
      endYear,
      mode,
      isNationalView,
      activeMetrics,
      increaseShare,
      distributionSvgRef,
      distributionWidth,
      moveAcrossDistribution,
      setHoveredCode,
      setTooltip,
      chooseClosestDistributionItem,
      distributionX,
      evolutionUnit,
      hasComparableNationalChange,
      nationalMarkerX,
      formatEvolution,
      animatedNationalChange,
      animatedDistribution,
      selected,
      selectDistributionItem,
      hoveredCode,
      tooltip,
      distributionMin,
      distributionMax,
    },
    frame: {
      landmarks,
      lab,
      mode,
      territoryDataset,
      stepIndex,
      data,
      step,
      scrollPosition,
      navigateStep,
      selectedCode,
      age,
      sex,
      chartView,
      title,
      context,
    },
  };
}

export type TerritoryExplorerModel = ReturnType<typeof useTerritoryExplorer>;
