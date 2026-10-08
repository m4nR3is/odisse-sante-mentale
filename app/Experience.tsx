import ChartHelp, { declaredMeasure, socialExplanation, historyExplanation, hospitalExplanation, storyHospitalExplanation, emergencyExplanation, deathExplanation } from "./ChartHelp";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type FocusEvent as ReactFocusEvent, type ReactNode } from "react";

type SeriesPoint = { year: number; sex: string; age: string; patients: number; rate: number };
type NationalPoint = { year: number; sex: string; age: string; rate: number; stays: number };
type ReferencePoint = { year: number; sex: string; age: string; rate: number; count?: number };
type SocialPoint = { indicator: string; financial: string; estimate: number; low: number; high: number; sample: number };
type DeclaredHistoryPoint = { indicator: string; territoryCode: string; territory: string; year: number; sex: string; estimate: number; low: number; high: number };
type Department = { code: string; name: string; region: string; series: { year: number; sex: string; age: string; rate: number; count?: number }[] };
type Projection = { pre_slope_per_year: number; expected_rate: number; forecast_interval_95_approx: number[]; observed_rate: number; excess_patients_approx: number };
type GroupAnalysis = { series: { year: number; rate: number; patients: number; population: number }[]; break_audit: { best_breakpoint: number; leave_one_year_out: Record<string, number> }; counterfactual: Projection };
type Rehospitalisation = { age: string; mean_2012_2019: number; mean_2021_2025: number; change_percent: number; series: { year: number; stays_per_patient: number }[] };
type StoryAnalysis = { groups: Record<string, GroupAnalysis>; rehospitalisation: Rehospitalisation[]; territory: { n_departments: number; increase_share_percent: number; persistent_increase_share_percent: number } };

export type ExperienceData = {
  meta: { generated: string; odisseLatestYear: number; dreesLatestYear: number; unit: string };
  longSeries: SeriesPoint[];
  odissePatients: SeriesPoint[];
  national: NationalPoint[];
  social: SocialPoint[];
  declaredHistory: DeclaredHistoryPoint[];
  departments: Department[];
  emergencyDepartments: Department[];
  emergencyNational: ReferencePoint[];
  suicideDepartments: Department[];
  suicideNational: ReferencePoint[];
  storyAnalysis: StoryAnalysis;
};

const ODISSE_AGES = ["00–10 ans", "11–14 ans", "15–17 ans", "18–24 ans", "25–44 ans", "45–64 ans", "65–84 ans", "85 ans et plus"];
const TERRITORY_AGES = ["Tous", "00–17 ans", "18–24 ans", "25–44 ans", "45–64 ans", "65 ans et plus"];
const TERRITORY_SEXES = ["Hommes et Femmes", "Femmes", "Hommes"];
const EMERGENCY_CODING_BREAK = new Set(["04", "05", "06", "13", "83", "84", "2A", "2B"]);
const FOCUS_AGES = ["11–14 ans", "15–17 ans", "18–24 ans"];
const FINANCIAL_ORDER = ["Vous êtes à l’aise", "Ça va", "C’est juste, il faut faire attention", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette"];
const FINANCIAL_SHORT: Record<string, string> = { "Vous êtes à l’aise": "À l’aise", "Ça va": "Ça va", "C’est juste, il faut faire attention": "C’est juste", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette": "En difficulté" };
const fmt = (value: number, digits = 1) => value.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value: number, digits = 0) => `${value >= 0 ? "+" : "−"}${fmt(Math.abs(value), digits)} %`;
const hasValidInterval = (point: { estimate: number; low: number; high: number }) => Number.isFinite(point.low) && Number.isFinite(point.high) && 0 <= point.low && point.low <= point.estimate && point.estimate <= point.high && point.high <= 100;
const intervalLabel = (point: { estimate: number; low: number; high: number }) => hasValidInterval(point) ? `IC 95 % : ${fmt(point.low)}–${fmt(point.high)} %` : "IC 95 % indisponible : intervalle incohérent dans la source";
const CHART_TRANSITION_MS = 760;
const scrollRangeProgress = (position: number, start: number, length = 1) => Math.max(0, Math.min(1, (position - start) / length));
function ScrollIndicator({ progress }: { progress: number }) {
  return <span className="control-scroll-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />;
}

function ViewportTooltip({ x, y, className = "", children }: { x: number; y: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y, vertical: "above", horizontal: "right" });
  useLayoutEffect(() => {
    const tooltip = ref.current;
    if (!tooltip) return;
    const margin = 12, gap = 14;
    const bounds = tooltip.getBoundingClientRect();
    const horizontal = x + gap + bounds.width <= window.innerWidth - margin ? "right" : "left";
    const vertical = y - gap - bounds.height >= margin ? "above" : "below";
    const preferredLeft = horizontal === "right" ? x + gap : x - gap - bounds.width;
    const preferredTop = vertical === "above" ? y - gap - bounds.height : y + gap;
    setPosition({ left: Math.max(margin, Math.min(preferredLeft, window.innerWidth - bounds.width - margin)), top: Math.max(margin, Math.min(preferredTop, window.innerHeight - bounds.height - margin)), vertical, horizontal });
  }, [x, y]);
  return <div ref={ref} className={`distribution-tooltip${className ? ` ${className}` : ""}`} data-placement={position.vertical} data-anchor-side={position.horizontal} style={{ left: position.left, top: position.top }} aria-hidden="true">{children}</div>;
}

function linePath<T>(values: T[], x: (point: T, index: number) => number, y: (point: T) => number) {
  return values.map((point, index) => `${index ? "L" : "M"}${x(point, index).toFixed(1)},${y(point).toFixed(1)}`).join(" ");
}

function yearLinePath<T extends { year: number }>(values: T[], x: (point: T) => number, y: (point: T) => number, breakYears: number[] = []) {
  return values.map((point, index) => `${index && point.year === values[index - 1].year + 1 && !breakYears.includes(point.year) ? "L" : "M"}${x(point).toFixed(1)},${y(point).toFixed(1)}`).join(" ");
}

function NationalSignal({ data }: { data: ExperienceData }) {
  const series = data.national.filter((point) => point.age === "Tous" && point.sex === "Hommes et Femmes");
  const first = series[0], last = series.at(-1)!;
  const change = (last.rate / first.rate - 1) * 100;
  const x = (_: NationalPoint, index: number) => 24 + index * 58;
  const y = (point: NationalPoint) => 134 - ((point.rate - 108) / 42) * 96;
  return <div className="national-signal">
    <div className="national-signal__head"><span>France entière</span><strong>{signed(change)}</strong></div>
    <svg viewBox="0 0 340 164" role="img" aria-label={`Taux standardisé national : ${fmt(first.rate)} en ${first.year}, ${fmt(last.rate)} en ${last.year}`}>
      <line x1="24" x2="314" y1={y({ ...first, rate: 130 })} y2={y({ ...first, rate: 130 })} />
      <path d={linePath(series, x, y)} />
      {series.map((point, index) => <circle key={point.year} cx={x(point, index)} cy={y(point)} r="3"><title>{point.year} : {fmt(point.rate)} pour 100 000</title></circle>)}
      <text x="24" y="158">2019</text><text x="314" y="158" textAnchor="end">2024</text>
    </svg>
    <p>Taux standardisé de séjours pour 100 000 · Odissé</p>
  </div>;
}

function TrajectoryCell({ values, focus }: { values: SeriesPoint[]; focus: boolean }) {
  const first = values[0], last = values.at(-1)!;
  const change = (last.rate / first.rate - 1) * 100;
  const x = (_: SeriesPoint, index: number) => 6 + index * 37.6;
  const y = (point: SeriesPoint) => 62 - (point.rate / 700) * 54;
  return <div className={`trajectory-cell${focus ? " is-focus" : ""}`}>
    <svg viewBox="0 0 206 68" role="img" aria-label={`${first.sex}, ${first.age} : taux de ${fmt(first.rate)} en 2019 à ${fmt(last.rate)} en 2024`}>
      <line x1="6" x2="194" y1="62" y2="62" />
      <path d={linePath(values, x, y)} />
      {values.map((point, index) => <circle key={point.year} cx={x(point, index)} cy={y(point)} r={index === values.length - 1 ? 3.2 : 1.8}><title>{point.year} : {fmt(point.rate)}</title></circle>)}
    </svg>
    <div><span>{fmt(first.rate)} → {fmt(last.rate)}</span><strong>{signed(change)}</strong></div>
  </div>;
}

function TrajectoryMatrix({ data }: { data: ExperienceData }) {
  const get = (age: string, sex: string) => data.odissePatients.filter((point) => point.age === age && point.sex === sex).sort((a, b) => a.year - b.year);
  return <section className="matrix-section" id="trajectoires">
    <header className="section-heading">
      <p className="chapter">01 · DÉCOMPOSER</p>
      <div><h2>Une moyenne<br />Seize trajectoires</h2><p>Toutes les séries sont affichées sur la même échelle. La hausse nationale n’est ni générale, ni symétrique.</p></div>
    </header>
    <div className="matrix" role="table" aria-label="Évolution des patients hospitalisés par âge et sexe entre 2019 et 2024">
      <div className="matrix-head" role="row"><span>Âge</span><span>Femmes · taux pour 100 000</span><span>Hommes · taux pour 100 000</span></div>
      {ODISSE_AGES.map((age) => <div className={`matrix-row${FOCUS_AGES.includes(age) ? " is-focus" : ""}`} role="row" key={age}>
        <div className="age-label" role="rowheader"><strong>{age}</strong>{FOCUS_AGES.includes(age) && <span>signal focal</span>}</div>
        <TrajectoryCell values={get(age, "Femmes")} focus={FOCUS_AGES.includes(age)} />
        <TrajectoryCell values={get(age, "Hommes")} focus={false} />
      </div>)}
    </div>
    <p className="source-note"><b>Lecture.</b> Entre 2019 et 2024, le taux augmente de 93 % chez les filles de 11–14 ans, de 65 % chez les 15–17 ans et de 42 % chez les femmes de 18–24 ans. Il recule dans la plupart des groupes plus âgés. Source : Odissé, patients hospitalisés en MCO pour gestes auto-infligés.</p>
  </section>;
}

function BreakChart({ age, analysis }: { age: string; analysis: GroupAnalysis }) {
  const values = analysis.series;
  const projection = analysis.counterfactual;
  const x = (year: number) => 34 + ((year - 2012) / 13) * 330;
  const y = (rate: number) => 244 - (rate / 780) * 214;
  const actual = linePath(values, (point) => x(point.year), (point) => y(point.rate));
  const fitted2012 = projection.expected_rate - projection.pre_slope_per_year * 13;
  const fitted2019 = projection.expected_rate - projection.pre_slope_per_year * 6;
  const projected = `M${x(2012)},${y(fitted2012)} L${x(2025)},${y(projection.expected_rate)}`;
  const interval = `${x(2019)},${y(fitted2019)} ${x(2025)},${y(projection.forecast_interval_95_approx[1])} ${x(2025)},${y(projection.forecast_interval_95_approx[0])}`;
  const stability = analysis.break_audit.leave_one_year_out[String(analysis.break_audit.best_breakpoint)] ?? 0;
  return <article className="break-card">
    <div className="break-card__title"><span>Femmes</span><h3>{age}</h3></div>
    <svg viewBox="0 0 390 282" role="img" aria-label={`${age} : ${fmt(projection.observed_rate)} observé en 2025 contre ${fmt(projection.expected_rate)} selon la projection de la tendance 2012 à 2019`}>
      {[0, 200, 400, 600].map((tick) => <g key={tick}><line x1="34" x2="364" y1={y(tick)} y2={y(tick)} /><text x="2" y={y(tick) + 4}>{tick}</text></g>)}
      <rect x={x(2020)} y="30" width={x(2021) - x(2020)} height="214" />
      <polygon points={interval} />
      <path className="projection" d={projected} />
      <path className="observed" d={actual} />
      <circle className="observed-dot" cx={x(2025)} cy={y(projection.observed_rate)} r="4" />
      <circle className="projection-dot" cx={x(2025)} cy={y(projection.expected_rate)} r="4" />
      <text x={x(2012)} y="270" textAnchor="middle">2012</text><text x={x(2019)} y="270" textAnchor="middle">2019</text><text x={x(2021)} y="270" textAnchor="middle">2021</text><text x={x(2025)} y="270" textAnchor="middle">2025</text>
    </svg>
    <div className="break-values"><div><strong>{fmt(projection.observed_rate)}</strong><span>observé</span></div><div><strong>{fmt(projection.expected_rate)}</strong><span>projection</span></div><div><strong>{stability}/14</strong><span>tests → 2021</span></div></div>
  </article>;
}

function BreakSection({ data }: { data: ExperienceData }) {
  return <section className="break-section" id="rupture">
    <header className="section-heading light"><p className="chapter">02 · ÉPROUVER</p><div><h2>Une bifurcation,<br />pas une date magique</h2><p>La série longue permet de comparer les valeurs observées avec la prolongation descriptive de la tendance antérieure. Ce repère n’est pas un scénario causal.</p></div></header>
    <div className="break-grid">{FOCUS_AGES.map((age) => <BreakChart key={age} age={age} analysis={data.storyAnalysis.groups[`Femmes · ${age}`]} />)}</div>
    <p className="source-note light"><b>Méthode.</b> Patientes uniques hospitalisées pour gestes auto-infligés, taux pour 100 000. Rupture sélectionnée par AICc et testée en retirant successivement chaque année. Source : DREES, 2012–2025.</p>
  </section>;
}

function IndexedPair({ data, age }: { data: ExperienceData; age: string }) {
  const patients = data.longSeries.filter((point) => point.sex === "Femmes" && point.age === age && point.year >= 2019);
  const stays = data.storyAnalysis.rehospitalisation.find((row) => row.age === age)!.series.filter((point) => point.year >= 2019);
  const patientBase = patients[0].patients, stayBase = stays[0].stays_per_patient;
  const patientIndex = patients.map((point) => ({ year: point.year, value: 100 * point.patients / patientBase }));
  const stayIndex = stays.map((point) => ({ year: point.year, value: 100 * point.stays_per_patient / stayBase }));
  const x = (_: { year: number; value: number }, index: number) => 25 + index * 48;
  const y = (point: { value: number }) => 170 - ((point.value - 80) / 130) * 138;
  return <article className="indexed-card"><h3>{age}</h3><svg viewBox="0 0 346 205" role="img" aria-label={`${age}, évolution comparée du nombre de patientes et des séjours par patiente, indice 100 en 2019`}>
    {[100, 150, 200].map((tick) => <g key={tick}><line x1="25" x2="313" y1={y({ value: tick })} y2={y({ value: tick })} /><text x="0" y={y({ value: tick }) + 4}>{tick}</text></g>)}
    <path className="patients-line" d={linePath(patientIndex, x, y)} /><path className="stays-line" d={linePath(stayIndex, x, y)} />
    <text x="25" y="198">2019</text><text x="313" y="198" textAnchor="end">2025</text>
  </svg><div className="indexed-result"><strong>{signed(patientIndex.at(-1)!.value - 100)}</strong><span>patientes</span><strong>{signed(stayIndex.at(-1)!.value - 100)}</strong><span>séjours / patiente</span></div></article>;
}

function Decomposition({ data }: { data: ExperienceData }) {
  return <section className="decomposition" id="decomposition"><header className="section-heading"><p className="chapter">03 · DÉCOMPOSER</p><div><h2>Plus de patientes<br />Pas seulement plus de séjours</h2><p>Deux quantités évoluent, mais pas du tout dans les mêmes proportions. Base 100 en 2019.</p></div></header><div className="indexed-grid">{FOCUS_AGES.map((age) => <IndexedPair key={age} age={age} data={data} />)}</div><div className="legend"><span className="patients">Nombre de patientes</span><span className="stays">Séjours par patiente</span></div></section>;
}

function SocialPanel({ data, indicator }: { data: ExperienceData; indicator: string }) {
  const points = FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === indicator && point.financial === financial)!).filter(Boolean);
  const ratio = points.at(-1)!.estimate / points[0].estimate;
  return <article className="social-panel"><div className="social-panel__head"><h3>{indicator}</h3><strong>× {fmt(ratio, 1)}</strong></div>{points.map((point) => <div className="social-row" key={point.financial}><span>{FINANCIAL_SHORT[point.financial]}</span><div className="social-axis"><i style={{ left: `${point.low / 32 * 100}%`, width: `${(point.high - point.low) / 32 * 100}%` }} /><b style={{ left: `${point.estimate / 32 * 100}%` }} /><em style={{ left: `${point.estimate / 32 * 100}%` }}>{fmt(point.estimate)} %</em></div></div>)}<div className="social-scale"><span>0</span><span>10</span><span>20</span><span>30 %</span></div></article>;
}

function SocialSection({ data }: { data: ExperienceData }) {
  return <section className="social-section" id="social"><header className="section-heading light"><p className="chapter">04 · CHANGER DE MESURE</p><div><h2>Une autre inégalité,<br />mesurée autrement</h2><p>Dans le Baromètre 2024, trois indicateurs déclarés suivent le même gradient financier. Ils documentent une autre dimension ; ils n’expliquent pas la rupture hospitalière.</p></div></header><div className="social-grid">{["Dépression", "Anxiété", "Pensées suicidaires"].map((indicator) => <SocialPanel key={indicator} indicator={indicator} data={data} />)}</div><p className="source-note light">Estimations et intervalles de confiance à 95 %. Les quatre situations financières restent visibles simultanément. Source : Baromètre de Santé publique France 2024, Odissé.</p></section>;
}

function average(values: { rate: number }[]) { return values.reduce((sum, point) => sum + point.rate, 0) / values.length; }

function indexedSeries<T extends { year: number; rate: number }>(series: T[], baselineYear: number) {
  const baseline = series.find((point) => point.year === baselineYear)?.rate ?? series[0]?.rate ?? 0;
  return series.map((point) => ({ ...point, rate: baseline > 0 ? point.rate / baseline * 100 : 0 }));
}

function useAnimatedNumber(target: number, duration = CHART_TRANSITION_MS) {
  const [displayed, setDisplayed] = useState(target);
  const current = useRef(target);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setDisplayed(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);
  return displayed;
}

function useAnimatedSeries<T extends { year: number; rate: number }>(target: T[], duration = CHART_TRANSITION_MS) {
  const [displayed, setDisplayed] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setDisplayed(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = target.map((point, index) => {
        const proportionalIndex = target.length > 1 ? Math.round(index / (target.length - 1) * Math.max(0, from.length - 1)) : 0;
        const previousRate = from.find((candidate) => candidate.year === point.year)?.rate ?? from[proportionalIndex]?.rate ?? point.rate;
        return { ...point, rate: previousRate + (point.rate - previousRate) * eased };
      });
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);
  return displayed;
}

function useAnimatedAxisScale(targetMax: number, duration = CHART_TRANSITION_MS) {
  const initial = { domainMax: targetMax, previousMax: targetMax, targetMax, progress: 1 };
  const [displayed, setDisplayed] = useState(initial);
  const current = useRef(initial);
  useLayoutEffect(() => {
    const from = current.current;
    const previousMax = from.targetMax;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const destination = { domainMax: targetMax, previousMax: targetMax, targetMax, progress: 1 };
      current.current = destination;
      setDisplayed(destination);
      return;
    }
    const transitionStart = { domainMax: from.domainMax, previousMax, targetMax, progress: 0 };
    current.current = transitionStart;
    setDisplayed(transitionStart);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {
        domainMax: from.domainMax + (targetMax - from.domainMax) * eased,
        previousMax,
        targetMax,
        progress: eased,
      };
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, targetMax]);
  return displayed;
}

type DistributionFrame = {
  rows: { department: Department; change: number; targetChange: number; y: number; radius: number }[];
  min: number;
  max: number;
  increaseShare: number;
};

function distributionFrame(target: { department: Department; change: number | null }[], selectedCode: string, width = 720, height = 160): DistributionFrame {
  const min = Math.min(0, ...target.map((row) => row.change!));
  const max = Math.max(0, ...target.map((row) => row.change!));
  const scaleX = (value: number) => 20 + (value - min) / Math.max(0.001, max - min) * (width - 40);
  const pixelScale = 160 / Math.max(20, height);
  const normalRadius = 4.1 * pixelScale;
  const collisionGap = 0.28 * pixelScale;
  type PhysicsNode = DistributionFrame["rows"][number] & { x: number };
  const nodes: PhysicsNode[] = [...target].sort((a, b) => a.change! - b.change!).map((row, index) => ({
    department: row.department,
    change: row.change!,
    targetChange: row.change!,
    x: scaleX(row.change!),
    y: 80 + (index % 2 ? 1 : -1) * (0.03 + index * 0.001),
    radius: normalRadius,
  }));
  const resolveCollisions = (attraction: number) => {
    for (const node of nodes) node.y += (80 - node.y) * attraction;
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const left = nodes[leftIndex], right = nodes[rightIndex];
        const minimumDistance = left.radius + right.radius + collisionGap;
        const deltaX = right.x - left.x;
        if (Math.abs(deltaX) >= minimumDistance) continue;
        const minimumDeltaY = Math.sqrt(Math.max(0, minimumDistance ** 2 - deltaX ** 2));
        const deltaY = right.y - left.y;
        if (Math.abs(deltaY) >= minimumDeltaY) continue;
        const direction = Math.abs(deltaY) < 0.0001 ? ((leftIndex + rightIndex) % 2 ? 1 : -1) : Math.sign(deltaY);
        const correction = (minimumDeltaY - Math.abs(deltaY)) / 2;
        left.y -= direction * correction;
        right.y += direction * correction;
      }
    }
    for (const node of nodes) node.y = Math.max(node.radius + 2, Math.min(158 - node.radius, node.y));
  };

  for (let iteration = 0; iteration < 180; iteration += 1) resolveCollisions(0.075);
  const selectedNode = nodes.find((node) => node.department.code === selectedCode);
  if (selectedNode) selectedNode.radius = 9 * pixelScale;
  for (let iteration = 0; iteration < 140; iteration += 1) resolveCollisions(0.055);
  for (let iteration = 0; iteration < 20; iteration += 1) resolveCollisions(0);

  const rows = target.map((row) => nodes.find((node) => node.department.code === row.department.code)!);
  return {
    rows,
    min,
    max,
    increaseShare: rows.length ? 100 * rows.filter((row) => row.change > 0).length / rows.length : 0,
  };
}

const EXPLORER_STEPS = [
  { label: "Dépression · 2024", mode: "declared", view: "social", indicator: "Dépression", dataset: "hospitalisations" },
  { label: "Anxiété · 2024", mode: "declared", view: "social", indicator: "Anxiété", dataset: "hospitalisations" },
  { label: "Pensées suicidaires · 2024", mode: "declared", view: "social", indicator: "Pensées suicidaires", dataset: "hospitalisations" },
  { label: "Dépression · 2005–2021", mode: "declared", view: "history", indicator: "Dépression", dataset: "hospitalisations" },
  { label: "Pensées suicidaires · 2005–2021", mode: "declared", view: "history", indicator: "Pensées suicidaires", dataset: "hospitalisations" },
  { label: "Tentatives de suicide · 2005–2021", mode: "declared", view: "history", indicator: "Tentatives de suicide", dataset: "hospitalisations" },
  { label: "Urgences · départements", mode: "territories", view: "social", indicator: "Dépression", dataset: "emergency" },
  { label: "Hôpital · séjours départementaux", mode: "territories", view: "social", indicator: "Dépression", dataset: "hospitalisations" },
  { label: "Hôpital · patients par âge et sexe", mode: "profiles", view: "social", indicator: "Dépression", dataset: "hospitalisations" },
  { label: "Décès · départements", mode: "territories", view: "social", indicator: "Dépression", dataset: "suicides" },
] as const;

function usePanelReveal(key: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => { cancelAnimationFrame(frame); setProgress(entered ? 1 : 0); };
    if (!entered || motion.matches) { finish(); return; }
    setProgress(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", finish); };
  }, [entered, key]);
  return { ref, progress };
}

function SocialDeclaredView({ data, indicator, onIndicator, position }: { data: ExperienceData; indicator: string; onIndicator: (indicator: string) => void; position: number }) {
  const indicators = ["Dépression", "Anxiété", "Pensées suicidaires"];
  const reveal = usePanelReveal(indicator);
  const [outgoing, setOutgoing] = useState<{ indicator: string; progress: number } | null>(null);
  const [exitProgress, setExitProgress] = useState(0);
  const previousFrame = useRef({ indicator, progress: reveal.progress });
  const clipId = useId();
  useLayoutEffect(() => {
    const previous = previousFrame.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (previous.indicator === indicator || previous.progress === 0 || motion.matches) { setOutgoing(null); return; }
    setOutgoing(previous);
    setExitProgress(0);
    let frame = 0;
    const start = performance.now();
    const finish = () => { cancelAnimationFrame(frame); setOutgoing(null); };
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      setExitProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", finish); };
  }, [indicator]);
  useLayoutEffect(() => { previousFrame.current = { indicator, progress: reveal.progress }; });
  const [hovered, setHovered] = useState<{ x: number; y: number; point: SocialPoint } | null>(null);
  useEffect(() => { setHovered(null); }, [indicator]);
  const points = FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === indicator && point.financial === financial)).filter((point): point is SocialPoint => Boolean(point));
  const outgoingPoints = outgoing ? FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === outgoing.indicator && point.financial === financial)).filter((point): point is SocialPoint => Boolean(point)) : [];
  const outgoingMax = Math.max(32, ...outgoingPoints.map((point) => point.high));
  const max = Math.max(32, ...points.map((point) => point.high));
  const first = points[0], last = points.at(-1);
  const ratio = first && last ? last.estimate / first.estimate : 0;
  const x = (value: number) => 118 + value / max * 562;
  return <div className="declared-explorer" ref={reveal.ref} data-reveal={reveal.progress}>
    <div className="declared-head">
      <p className="chapter">DÉCLARÉ · BAROMÈTRE 2024</p>
      <h3>Ce que l’enquête<br />rend visible.</h3>
      <p>Prévalence déclarée chez les 18–79 ans, en France hors Mayotte, selon la situation financière perçue. Ce gradient social ne décrit ni une trajectoire individuelle ni une comparaison entre départements.</p>
      <div className="declared-indicators" role="group" aria-label="Indicateur déclaré">
        {indicators.map((item) => <button type="button" key={item} aria-pressed={indicator === item} onClick={() => onIndicator(item)}>{item}<ScrollIndicator progress={scrollRangeProgress(position, indicators.indexOf(item))} /></button>)}
      </div>
      {first && last && <div className="declared-ratio"><strong>× {fmt(ratio * reveal.progress, 1)}</strong><span>entre les personnes « en difficulté » et celles « à l’aise »</span></div>}
    </div>
    <div className="declared-chart has-chart-help"><ChartHelp key={indicator} explanation={socialExplanation(indicator)} />
      <p><b>{indicator === "Anxiété" ? "Trouble anxieux généralisé" : indicator === "Dépression" ? "Épisode dépressif caractérisé" : indicator}</b><span>12 derniers mois · estimation et IC à 95 %</span></p>
      <svg viewBox="0 0 720 260" role="img" aria-label={`${indicator} selon la situation financière en 2024`}>
        <defs><clipPath id={clipId}><rect x="118" y="20" width="602" height="205" /></clipPath></defs>
        {outgoing && <g className="declared-outgoing" clipPath={`url(#${clipId})`} aria-hidden="true" pointerEvents="none" data-indicator={outgoing.indicator} data-exit={exitProgress}>{outgoingPoints.map((point, index) => {
          const p = Math.max(0, Math.min(1, (outgoing.progress - index * .15) / .55));
          const travel = Math.min(1, p / .75), arrival = Math.max(0, (p - .75) / .25);
          const startX = 118 + point.estimate * travel / outgoingMax * 562;
          const cx = startX + (760 - startX) * exitProgress, cy = 48 + index * 52;
          return <g className="declared-row" key={point.financial} opacity={p > 0 ? Math.min(1, (1 - exitProgress) * 4) : 0}><line x1={cx + (point.low - point.estimate) / outgoingMax * 562 * arrival} x2={cx + (point.high - point.estimate) / outgoingMax * 562 * arrival} y1={cy} y2={cy} opacity={arrival} /><circle cx={cx} cy={cy} r={2 + 4 * arrival} /><text className="declared-value" x={cx + (point.high - point.estimate) / outgoingMax * 562 * arrival + 10} y={cy + 4}>{fmt(point.estimate * travel)} %</text></g>;
        })}</g>}
        {[0, 10, 20, 30].filter((tick) => tick <= max).map((tick) => <g className="declared-grid" key={tick}><line x1={x(tick)} x2={x(tick)} y1="24" y2="220" /><text x={x(tick)} y="244" textAnchor="middle">{tick} %</text></g>)}
        {points.map((point, index) => {
          const p = Math.max(0, Math.min(1, (reveal.progress - index * .15) / .55));
          const travel = Math.min(1, p / .75), arrival = Math.max(0, (p - .75) / .25);
          const estimate = point.estimate * travel, cx = x(estimate), cy = 48 + index * 52;
          return <g className="declared-row" key={point.financial} opacity={p > 0 ? 1 : 0}><text x="4" y={cy + 4} opacity={Math.min(1, p * 4)}>{FINANCIAL_SHORT[point.financial]}</text><line x1={cx + (point.low - point.estimate) / max * 562 * arrival} x2={cx + (point.high - point.estimate) / max * 562 * arrival} y1={cy} y2={cy} opacity={arrival} /><g className="declared-social-point" role="img" tabIndex={p > 0 ? 0 : -1} aria-label={`${indicator}, ${FINANCIAL_SHORT[point.financial]}, ${fmt(point.estimate)} %, IC 95 % : ${fmt(point.low)}–${fmt(point.high)} %`} onPointerMove={(event) => setHovered({ x: event.clientX, y: event.clientY, point })} onPointerLeave={() => setHovered(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHovered({ x: bounds.left + bounds.width / 2, y: bounds.top, point }); }} onBlur={() => setHovered(null)}><circle className="declared-point-hit" cx={cx} cy={cy} r="12" /><circle className="declared-point-dot" cx={cx} cy={cy} r={2 + 4 * arrival} style={{ fill: arrival === 0 ? "var(--ink)" : `color-mix(in srgb, var(--ink) ${(1 - arrival) * 100}%, var(--accent))` }} /></g><text className="declared-value" x={Math.min(692, cx + (point.high - point.estimate) / max * 562 * arrival + 10)} y={cy + 4}>{fmt(estimate)} %</text></g>;
        })}
      </svg>
      <dl className="evidence-mobile-values">{points.map((point, index) => {
        const p = Math.max(0, Math.min(1, (reveal.progress - index * .15) / .55));
        return <div key={point.financial} tabIndex={p > 0 ? 0 : -1} onPointerMove={(event) => setHovered({ x: event.clientX, y: event.clientY, point })} onPointerLeave={() => setHovered(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHovered({ x: bounds.left + bounds.width / 2, y: bounds.top, point }); }} onBlur={() => setHovered(null)} style={{ opacity: p, transform: `translateX(${(1 - p) * -35}px)` }}><dt>{FINANCIAL_SHORT[point.financial]}</dt><dd>{fmt(point.estimate * Math.min(1, p / .75))} % <small>IC 95 % : {fmt(point.low)}–{fmt(point.high)} %</small></dd></div>;
      })}</dl>
      {outgoing && <dl className="declared-mobile-outgoing" aria-hidden="true" style={{ opacity: Math.min(1, (1 - exitProgress) * 4), transform: `translateX(${exitProgress * 110}%)` }}>{outgoingPoints.map((point, index) => {
        const p = Math.max(0, Math.min(1, (outgoing.progress - index * .15) / .55));
        return <div key={point.financial} style={{ opacity: p }}><dt>{FINANCIAL_SHORT[point.financial]}</dt><dd>{fmt(point.estimate * Math.min(1, p / .75))} % <small>IC 95 % : {fmt(point.low)}–{fmt(point.high)} %</small></dd></div>;
      })}</dl>}
      {hovered && <ViewportTooltip x={hovered.x} y={hovered.y} className="declared-tooltip"><span>{FINANCIAL_SHORT[hovered.point.financial]}</span><small>{indicator} · France · 2024</small><strong>{fmt(hovered.point.estimate)} %</strong><small>Intervalle de confiance à 95 % : {fmt(hovered.point.low)}–{fmt(hovered.point.high)} %</small></ViewportTooltip>}
      <div className="declared-caution"><b>Pont avec les inégalités sociales</b><span>Une association observée, pas une explication causale des hospitalisations, urgences ou décès.</span></div>
    </div>
    <p className="monthly-method"><b>Lecture.</b> Il s’agit de données déclaratives issues d’une enquête nationale. Elles rendent visible une souffrance qui ne se confond pas avec le recours aux soins. Source : Baromètre de Santé publique France 2024, Odissé.</p>
  </div>;
}

function HistoricalDeclaredView({ data, indicator, onIndicator, position }: { data: ExperienceData; indicator: string; onIndicator: (indicator: string) => void; position: number }) {
  const indicators = ["Dépression", "Pensées suicidaires", "Tentatives de suicide"];
  const sexes = ["Hommes et Femmes", "Femmes", "Hommes"];
  const [sex, setSex] = useState(sexes[0]);
  const [territoryCode, setTerritoryCode] = useState("FR");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [distributionTooltip, setDistributionTooltip] = useState<{ x: number; y: number; name: string; change: number } | null>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; year: number; estimate: number; low: number; high: number } | null>(null);
  const available = data.declaredHistory.filter((point) => point.indicator === indicator && point.sex === sex);
  const territories = [...new Map(available.filter((point) => point.territoryCode !== "FR").map((point) => [point.territoryCode, point.territory])).entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const selectedCode = territoryCode === "FR" || territories.some(([code]) => code === territoryCode) ? territoryCode : "FR";
  const isNational = selectedCode === "FR";
  const selectedName = isNational ? "France hexagonale" : territories.find(([code]) => code === selectedCode)?.[1] ?? "Région";
  const selected = available.filter((point) => point.territoryCode === selectedCode).sort((a, b) => a.year - b.year);
  const france = available.filter((point) => point.territoryCode === "FR").sort((a, b) => a.year - b.year);
  const preview = previewCode && previewCode !== selectedCode ? available.filter((point) => point.territoryCode === previewCode).sort((a, b) => a.year - b.year) : [];
  const previewName = territories.find(([code]) => code === previewCode)?.[1];
  const regionChanges = territories.map(([code, name]) => {
    const series = available.filter((point) => point.territoryCode === code).sort((a, b) => a.year - b.year);
    const first = series.find((point) => point.year === 2005), last = series.find((point) => point.year === 2021);
    return first && last ? { code, name, change: last.estimate - first.estimate } : null;
  }).filter((point): point is { code: string; name: string; change: number } => Boolean(point)).sort((a, b) => a.change - b.change);
  const first = selected[0], last = selected.at(-1);
  const franceLast = france.at(-1);
  const change = first && last ? last.estimate - first.estimate : 0;
  const gap = last && franceLast ? last.estimate - franceLast.estimate : 0;
  const maxValue = Math.max(1, ...available.map((point) => hasValidInterval(point) ? point.high : point.estimate)) * 1.18;
  const x = (year: number) => 50 + (year - 2005) / 16 * 620;
  const y = (value: number) => 218 - value / maxValue * 176;
  const distributionMin = regionChanges.length ? Math.min(...regionChanges.map((point) => point.change)) : 0;
  const distributionMax = regionChanges.length ? Math.max(...regionChanges.map((point) => point.change)) : 0;
  const distributionRef = useRef<SVGSVGElement>(null);
  const [distributionSize, setDistributionSize] = useState({ width: 720, height: 100 });
  useLayoutEffect(() => {
    const svg = distributionRef.current;
    if (!svg) return;
    const update = () => { const bounds = svg.getBoundingClientRect(); setDistributionSize({ width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) }); };
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    update();
    return () => observer.disconnect();
  }, []);
  const distributionX = (value: number) => 20 + (value - distributionMin) / Math.max(.01, distributionMax - distributionMin) * (distributionSize.width - 40);
  const distributionOrigin = Math.max(20, Math.min(distributionSize.width - 20, distributionX(0)));
  const showTooltip = (event: ReactPointerEvent<SVGGElement>, point: DeclaredHistoryPoint, label: string) => setHovered({ x: event.clientX, y: event.clientY, label, year: point.year, estimate: point.estimate, low: point.low, high: point.high });
  const reveal = usePanelReveal(`${indicator}|${sex}|${selectedCode}`);
  const distributionReveal = usePanelReveal(`${indicator}|${sex}`);
  const previewReveal = usePanelReveal(`${indicator}|${sex}|${previewCode ?? ""}`);
  const maskId = useId();
  useEffect(() => { setHovered(null); setDistributionTooltip(null); setPreviewCode(null); }, [indicator, sex, selectedCode]);
  return <div className="declared-history" ref={reveal.ref} data-reveal={reveal.progress}>
    <div className="declared-history-controls declared-head">
      <p className="chapter">DÉCLARÉ · BAROMÈTRES 2005–2021</p>
      <h3>Ce que l’enquête<br />rend visible.</h3>
      <p>Prévalence déclarée chez les 18–75 ans en France hexagonale, selon la région et le sexe. Les vagues 2005–2021 restent séparées de 2024, dont le protocole diffère.</p>
      <div className="declared-indicators history-indicators" role="group" aria-label="Indicateur déclaré historique">
        {indicators.map((item) => <button type="button" key={item} aria-pressed={indicator === item} onClick={() => onIndicator(item)}>{item}<ScrollIndicator progress={scrollRangeProgress(position, 3 + indicators.indexOf(item))} /></button>)}
      </div>
      <div className="history-filters">
      <label>Territoire<select value={selectedCode} onChange={(event) => setTerritoryCode(event.target.value)}><option value="FR">France hexagonale</option>{territories.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
      <label>Sexe<select value={sex} onChange={(event) => setSex(event.target.value)}>{sexes.map((item) => <option key={item} value={item}>{item === "Hommes et Femmes" ? "Tous les sexes" : item}</option>)}</select></label>
      </div>
      <div className="declared-history-kpi"><strong>{change >= 0 ? "+" : "−"}{fmt(Math.abs(change) * reveal.progress, 1)} pt</strong><span>évolution déclarée · 2005 → 2021</span>{!isNational && <p className={gap > 0 ? "is-positive" : ""}>{gap >= 0 ? "+" : "−"}{fmt(Math.abs(gap), 1)} pt par rapport à la France en 2021</p>}</div>
    </div>
    <div className="declared-history-chart has-chart-help" ref={previewReveal.ref}><ChartHelp key={`${indicator}-${selectedCode}-${sex}`} explanation={historyExplanation(indicator, selectedName, sex)} /><h3>{selectedName}</h3><p>{declaredMeasure(indicator)} · {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()} · 12 derniers mois · prévalence déclarée{selected.some((point) => !hasValidInterval(point)) && " · IC incohérent non affiché"}</p><svg viewBox="0 0 720 270" role="img" aria-label={`${indicator}, ${selectedName}${isNational ? "" : " comparée à la France"}, de 2005 à 2021`}>
      {[0, maxValue / 2, maxValue].map((tick) => <g className="declared-history-grid" key={tick}><line x1="50" x2="670" y1={y(tick)} y2={y(tick)} /><text x="46" y={y(tick) - 5} textAnchor="end">{fmt(tick, 0)} %</text></g>)}
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="270"><path d={linePath(selected, (point) => x(point.year), (point) => y(point.estimate))} fill="none" stroke="white" strokeWidth="30" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - reveal.progress} /></mask>
        <mask id={`${maskId}-france`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="270"><path d={linePath(france, (point) => x(point.year), (point) => y(point.estimate))} fill="none" stroke="white" strokeWidth="30" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - distributionReveal.progress} /></mask>
        <mask id={`${maskId}-preview`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="270"><path d={linePath(preview, (point) => x(point.year), (point) => y(point.estimate))} fill="none" stroke="white" strokeWidth="30" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - previewReveal.progress} /></mask>
      </defs>
      <path className="declared-history-france" mask={`url(#${maskId}-france)`} d={linePath(france, (point) => x(point.year), (point) => y(point.estimate))} />
      {!isNational && <path className="declared-history-region" mask={`url(#${maskId})`} d={linePath(selected, (point) => x(point.year), (point) => y(point.estimate))} />}
      {preview.length > 0 && <path className="declared-history-preview" mask={`url(#${maskId}-preview)`} data-region={previewName} data-reveal={previewReveal.progress} d={linePath(preview, (point) => x(point.year), (point) => y(point.estimate))} />}
      {selected.map((point) => <g opacity={Math.max(0, Math.min(1, ((isNational ? distributionReveal.progress : reveal.progress) - (point.year - 2005) / 16 * .8) / .2))} className={`declared-history-point${isNational ? " is-national" : ""}`} key={point.year} role="img" aria-label={`${selectedName}, ${point.year}, ${fmt(point.estimate)} %, ${intervalLabel(point)}`} tabIndex={0} onPointerMove={(event) => showTooltip(event, point, selectedName)} onPointerLeave={() => setHovered(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHovered({ x: bounds.left + bounds.width / 2, y: bounds.top, label: selectedName, year: point.year, estimate: point.estimate, low: point.low, high: point.high }); }} onBlur={() => setHovered(null)}>{hasValidInterval(point) && <line x1={x(point.year)} x2={x(point.year)} y1={y(point.low)} y2={y(point.high)} />}<circle cx={x(point.year)} cy={y(point.estimate)} r="5" /></g>)}
      {[2005, 2010, 2017, 2021].map((year) => <text className="declared-history-year" key={year} x={x(year)} y="258" textAnchor="middle">{year}</text>)}
    </svg><dl className="history-mobile-values">{selected.map((point) => <div key={point.year}><dt>{point.year}</dt><dd>{fmt(point.estimate)} % <small>{intervalLabel(point)}</small></dd></div>)}</dl><div className="legend"><span className="france">France</span>{!isNational && <span className="department selected-legend">{selectedName}</span>}{preview.length > 0 && <span className="department declared-preview-legend">{previewName} · aperçu</span>}</div>{hovered && <ViewportTooltip x={hovered.x} y={hovered.y}><span>{hovered.label}</span><small>{hovered.year} · {intervalLabel(hovered)}</small><strong>{fmt(hovered.estimate)} %</strong></ViewportTooltip>}</div>
    <div className="declared-history-distribution" ref={distributionReveal.ref} data-reveal={distributionReveal.progress}><small>DISTRIBUTION DES ÉVOLUTIONS RÉGIONALES · 2005 → 2021 · EN POINTS</small><svg ref={distributionRef} viewBox={`0 0 ${distributionSize.width} ${distributionSize.height}`} role="img" aria-label="Choisir une région dans la distribution de son évolution"><line className="distribution-axis" x1="20" x2={distributionSize.width - 20} y1={distributionSize.height * .54} y2={distributionSize.height * .54} />{distributionMin <= 0 && distributionMax >= 0 && <><line className="zero-marker" x1={distributionX(0)} x2={distributionX(0)} y1="16" y2={distributionSize.height - 4} /><text x={distributionX(0)} y="12" textAnchor="middle">0 pt</text></>}{regionChanges.map((point, index) => <g key={point.code} className={point.code === selectedCode ? "is-selected" : ""} aria-label={`${point.name}, évolution ${fmt(point.change)} points. Sélectionner.`} role="button" tabIndex={0} onPointerEnter={(event) => { setPreviewCode(point.code); setDistributionTooltip({ x: event.clientX, y: event.clientY, name: point.name, change: point.change }); }} onPointerMove={(event) => { setPreviewCode(point.code); setDistributionTooltip({ x: event.clientX, y: event.clientY, name: point.name, change: point.change }); }} onPointerLeave={() => { setPreviewCode(null); setDistributionTooltip(null); }} onFocus={(event) => { setPreviewCode(point.code); const bounds = event.currentTarget.getBoundingClientRect(); setDistributionTooltip({ x: bounds.left + bounds.width / 2, y: bounds.top, name: point.name, change: point.change }); }} onBlur={() => { setPreviewCode(null); setDistributionTooltip(null); }} onClick={() => setTerritoryCode(point.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setTerritoryCode(point.code); } }}><circle className="history-region-hit" cx={distributionOrigin + (distributionX(point.change) - distributionOrigin) * distributionReveal.progress} cy={distributionSize.height * .54 + (index % 3 - 1) * Math.min(8, distributionSize.height / 6)} r="12" /><circle className="history-region-dot" cx={distributionOrigin + (distributionX(point.change) - distributionOrigin) * distributionReveal.progress} cy={distributionSize.height * .54 + (index % 3 - 1) * Math.min(8, distributionSize.height / 6)} r={2 + ((point.code === selectedCode ? 8 : 5) - 2) * distributionReveal.progress} opacity={distributionReveal.progress} /></g>)}</svg><span>{distributionMin >= 0 ? "+" : "−"}{fmt(Math.abs(distributionMin), 1)} pt</span><span>{distributionMax >= 0 ? "+" : "−"}{fmt(Math.abs(distributionMax), 1)} pt</span></div>
    {distributionTooltip && <ViewportTooltip x={distributionTooltip.x} y={distributionTooltip.y} className="declared-tooltip"><span>{distributionTooltip.name}</span><small>{indicator} · {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()} · 2005 → 2021</small><strong>{distributionTooltip.change >= 0 ? "+" : "−"}{fmt(Math.abs(distributionTooltip.change), 1)} pt</strong><small>Évolution de la prévalence déclarée · sélectionner cette région</small></ViewportTooltip>}
    <p className="monthly-method"><b>Comparabilité.</b> Les vagues historiques concernent les 18–75 ans. Les écarts entre estimations restent à lire avec leurs intervalles de confiance. Le Baromètre 2024 repose sur un protocole différent : ses valeurs ne sont pas raccordées à ces courbes. Sources : Baromètres de Santé publique France 2005, 2010, 2017 et 2021, Odissé.</p>
  </div>;
}

function DeclaredExplorer({ data, step, onNavigate, position }: { data: ExperienceData; step: typeof EXPLORER_STEPS[number]; onNavigate: (index: number) => void; position: number }) {
  const view = step.view;
  return <div className="declared-shell"><div className="measure-subnav declared-subnav" role="group" aria-label="Lecture des données déclarées"><button type="button" aria-pressed={view === "social"} onClick={() => onNavigate(0)}>Inégalités sociales · 2024<ScrollIndicator progress={scrollRangeProgress(position, 0, 3)} /></button><button type="button" aria-pressed={view === "history"} onClick={() => onNavigate(3)}>Évolution déclarée · 2005–2021<ScrollIndicator progress={scrollRangeProgress(position, 3, 3)} /></button></div>{view === "social" ? <SocialDeclaredView data={data} position={position} indicator={step.indicator} onIndicator={(indicator) => onNavigate(EXPLORER_STEPS.findIndex((candidate) => candidate.view === "social" && candidate.indicator === indicator))} /> : <HistoricalDeclaredView data={data} position={position} indicator={step.indicator} onIndicator={(indicator) => onNavigate(EXPLORER_STEPS.findIndex((candidate) => candidate.view === "history" && candidate.indicator === indicator))} />}</div>;
}

function useAnimatedDistribution(target: { department: Department; change: number | null }[], selectedCode: string, width: number, height: number, duration = 650) {
  const [displayed, setDisplayed] = useState(() => distributionFrame(target, selectedCode, width, height));
  const current = useRef(displayed);
  useEffect(() => {
    const destination = distributionFrame(target, selectedCode, width, height);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = destination;
      setDisplayed(destination);
      return;
    }
    const from = current.current;
    const fromByCode = new Map(from.rows.map((row) => [row.department.code, row]));
    const started = performance.now();
    let frame = 0;
    const interpolate = (start: number, end: number, progress: number) => start + (end - start) * progress;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const next: DistributionFrame = {
        rows: destination.rows.map((row, index) => {
          const previous = fromByCode.get(row.department.code) ?? from.rows[index % from.rows.length] ?? row;
          return {
            ...row,
            change: interpolate(previous.change, row.change, eased),
            y: interpolate(previous.y, row.y, eased),
            radius: interpolate(previous.radius, row.radius, eased),
          };
        }),
        min: interpolate(from.min, destination.min, eased),
        max: interpolate(from.max, destination.max, eased),
        increaseShare: interpolate(from.increaseShare, destination.increaseShare, eased),
      };
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, height, selectedCode, target, width]);
  return displayed;
}

type GuidedView = { view: "declared" | "profiles"; revision: number };

function TerritoryAppendix({ data, guidedView }: { data: ExperienceData; guidedView: GuidedView | null }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const step = EXPLORER_STEPS[stepIndex];
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const lab = useRef<HTMLDivElement>(null);
  const navigateStep = (index: number) => {
    const marker = landmarks.current[index];
    if (!marker) return;
    const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 16;
    window.scrollTo({ top: window.scrollY + marker.getBoundingClientRect().top - line, behavior: "instant" });
  };
  useEffect(() => {
    let frame = 0;
    const synchronize = () => {
      frame = 0;
      const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 17;
      let index = 0;
      landmarks.current.forEach((marker, candidate) => { if (marker && marker.getBoundingClientRect().top <= line) index = candidate; });
      setStepIndex((current) => current === index ? current : index);
      const bounds = landmarks.current[index]?.getBoundingClientRect();
      const fraction = bounds ? Math.max(0, Math.min(1, (line - bounds.top) / Math.max(1, bounds.height))) : 0;
      setScrollPosition(index + fraction);

    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(synchronize); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (landmarks.current[0]?.parentElement) observer.observe(landmarks.current[0].parentElement);
    synchronize();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const [mode, setMode] = useState<"territories" | "profiles" | "declared">("declared");
  const [territoryDataset, setTerritoryDataset] = useState<"hospitalisations" | "emergency" | "suicides">("hospitalisations");
  const [chartView, setChartView] = useState<"level" | "change">("level");
  const [age, setAge] = useState("Tous");
  const [sex, setSex] = useState("Hommes et Femmes");
  const [profileAge, setProfileAge] = useState("11–14 ans");
  const [profileSex, setProfileSex] = useState("Femmes");
  const territoryConfig = useMemo(() => territoryDataset === "emergency"
    ? { departments: data.emergencyDepartments, national: data.emergencyNational, startYear: 2020, endYear: 2024, label: "Passages aux urgences pour gestes auto-infligés", shortLabel: "Urgences", unit: "part pour 100 000 passages codés", description: "Gestes auto-infligés parmi les passages avec un diagnostic renseigné" }
    : territoryDataset === "suicides"
      ? { departments: data.suicideDepartments, national: data.suicideNational, startYear: 2019, endYear: 2023, label: "Décès par suicide", shortLabel: "Décès", unit: "taux pour 100 000 habitants", description: "Décès enregistrés par suicide" }
      : { departments: data.departments, national: data.national, startYear: 2019, endYear: 2024, label: "Séjours en MCO pour gestes auto-infligés", shortLabel: "Séjours MCO", unit: "taux pour 100 000 habitants", description: "Séjours hospitaliers en MCO pour gestes auto-infligés" }, [data.departments, data.emergencyDepartments, data.emergencyNational, data.national, data.suicideDepartments, data.suicideNational, territoryDataset]);
  const metrics = useMemo(() => territoryConfig.departments.map((department) => {
    const series = department.series.filter((point) => point.age === age && point.sex === sex && !(territoryDataset === "emergency" && EMERGENCY_CODING_BREAK.has(department.code) && point.year >= 2022)).sort((a, b) => a.year - b.year);
    const first = series.find((point) => point.year === territoryConfig.startYear), last = series.find((point) => point.year === territoryConfig.endYear);
    const isDeathDataset = territoryDataset === "suicides";
    const change = first && last && (isDeathDataset || first.rate > 0) ? (isDeathDataset ? last.rate - first.rate : 100 * (last.rate / first.rate - 1)) : null;
    const comparable = change != null && (!isDeathDataset || ((first?.count ?? 0) >= 10 && (last?.count ?? 0) >= 10));
    return { department, series, change: change != null && Number.isFinite(change) ? change : null, comparable };
  }).sort((a, b) => (a.change ?? 0) - (b.change ?? 0)), [age, sex, territoryConfig.departments, territoryConfig.endYear, territoryConfig.startYear, territoryDataset]);
  const profileMetrics = useMemo(() => ODISSE_AGES.flatMap((profileAgeValue) => ["Femmes", "Hommes"].map((profileSexValue) => {
    const series = data.odissePatients.filter((point) => point.age === profileAgeValue && point.sex === profileSexValue).sort((a, b) => a.year - b.year);
    const first = series[0], last = series.at(-1)!;
    return {
      department: { code: `${profileAgeValue}|${profileSexValue}`, name: `${profileAgeValue} · ${profileSexValue}`, region: "France entière", series: [] },
      series,
      change: 100 * (last.rate / first.rate - 1),
      comparable: true,
    };
  })).sort((a, b) => a.change - b.change), [data.odissePatients]);
  const departmentOptions = useMemo(() => [...metrics].sort((a, b) => a.department.code.localeCompare(b.department.code, "fr")), [metrics]);
  const [code, setCode] = useState("80");
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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; department: string; region: string; change: number } | null>(null);
  const [chartTooltip, setChartTooltip] = useState<{ x: number; y: number; label: string; year: number; rate: number; count?: number } | null>(null);
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
        setChartWidth(260 * bounds.width / bounds.height);
        setChartLabelSize(260 * 10 / bounds.height);
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
        setDistributionWidth(160 * bounds.width / bounds.height);
        setDistributionHeight(bounds.height);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);
  const selectionMetrics = useMemo(() => mode === "territories" ? metrics : profileMetrics, [metrics, mode, profileMetrics]);
  const activeMetrics = useMemo(() => selectionMetrics.filter((row) => row.comparable), [selectionMetrics]);
  const selectedCode = mode === "territories" ? code : `${profileAge}|${profileSex}`;
  const selected = selectionMetrics.find((row) => row.department.code === selectedCode) ?? selectionMetrics[0] ?? { department: { code: "", name: "Données indisponibles", region: "", series: [] }, series: [], change: null, comparable: false };
  const hoveredMetric = hoveredCode && hoveredCode !== selected.department.code ? activeMetrics.find((row) => row.department.code === hoveredCode) : null;
  const reference = useMemo(() => mode === "territories"
    ? territoryConfig.national.filter((point) => point.age === age && point.sex === sex)
    : data.odissePatients.filter((point) => point.age === profileAge && point.sex === (profileSex === "Femmes" ? "Hommes" : "Femmes")).sort((a, b) => a.year - b.year), [age, data.odissePatients, mode, profileAge, profileSex, sex, territoryConfig.national]);
  const startYear = mode === "territories" ? territoryConfig.startYear : 2019;
  const endYear = mode === "territories" ? territoryConfig.endYear : 2024;
  const chartSeries = useMemo(() => chartView === "level" ? selected.series : indexedSeries(selected.series, startYear), [chartView, selected.series, startYear]);
  const chartReference: { year: number; rate: number }[] = useMemo(() => chartView === "level" ? reference : mode === "territories" && territoryDataset === "emergency" ? [] : indexedSeries(reference as { year: number; rate: number }[], startYear), [chartView, reference, startYear, mode, territoryDataset]);
  const chartHoveredSeries = useMemo(() => hoveredMetric ? (chartView === "level" ? hoveredMetric.series : indexedSeries(hoveredMetric.series, startYear)) : null, [chartView, hoveredMetric, startYear]);
  const referenceFirst = reference.find((point) => point.year === startYear);
  const referenceLast = reference.find((point) => point.year === endYear);
  const selectedFirst = selected.series.find((point) => point.year === startYear);
  const selectedLast = selected.series.find((point) => point.year === endYear);
  const usesAbsoluteChange = mode === "territories" && territoryDataset === "suicides";
  const hasNationalReference = Boolean(referenceFirst && referenceLast && (usesAbsoluteChange || referenceFirst.rate > 0));
  const hasComparableNationalChange = hasNationalReference && !(mode === "territories" && territoryDataset === "emergency");
  const nationalChange = hasNationalReference ? (usesAbsoluteChange ? referenceLast!.rate - referenceFirst!.rate : 100 * (referenceLast!.rate / referenceFirst!.rate - 1)) : 0;
  const levelGap = hasNationalReference && selectedLast ? (usesAbsoluteChange ? selectedLast.rate - referenceLast!.rate : 100 * (selectedLast.rate / referenceLast!.rate - 1)) : 0;
  const animatedChange = useAnimatedNumber(selected.change ?? 0);
  const animatedNationalChange = useAnimatedNumber(nationalChange);
  const animatedLevelGap = useAnimatedNumber(levelGap);
  const animatedSeries = useAnimatedSeries(chartSeries);
  const animatedReference = useAnimatedSeries(chartReference);
  const animatedDistribution = useAnimatedDistribution(activeMetrics, selectedCode, distributionWidth, distributionHeight);
  const targetMaxRate = useMemo(() => Math.max(1, ...chartSeries.map((point) => point.rate), ...chartReference.map((point) => point.rate)) * 1.12, [chartReference, chartSeries]);
  const axisScale = useAnimatedAxisScale(targetMaxRate);
  const maxRate = axisScale.domainMax;
  const x = (point: { year: number }) => 4 + ((point.year - startYear) / Math.max(1, endYear - startYear)) * (chartWidth - 8);
  const y = (point: { rate: number }) => 218 - point.rate / maxRate * 180;
  const { min, max, increaseShare } = animatedDistribution;
  const distributionMin = mode === "territories" && hasComparableNationalChange ? Math.min(min, animatedNationalChange) : min;
  const distributionMax = mode === "territories" && hasComparableNationalChange ? Math.max(max, animatedNationalChange) : max;
  const distributionX = (value: number) => 20 + (value - distributionMin) / Math.max(0.001, distributionMax - distributionMin) * (distributionWidth - 40);
  const nationalMarkerX = Math.max(20, Math.min(distributionWidth - 20, distributionX(animatedNationalChange)));
  const formatEvolution = (value: number) => usesAbsoluteChange ? `${value >= 0 ? "+" : "−"}${fmt(Math.abs(value), 1)}` : signed(value);
  const evolutionUnit = usesAbsoluteChange ? " pt" : "";
  const closestDistributionRow = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width * distributionWidth;
    const pointerY = (event.clientY - bounds.top) / bounds.height * 160;
    const closest = animatedDistribution.rows.reduce<{ row: typeof animatedDistribution.rows[number]; distance: number } | null>((best, row) => {
      const distance = Math.hypot(pointerX - distributionX(row.change), pointerY - row.y);
      return !best || distance < best.distance ? { row, distance } : best;
    }, null);
    return closest && closest.distance <= Math.max(16, closest.row.radius + 9) ? closest.row : null;
  };
  const moveAcrossDistribution = (event: ReactPointerEvent<SVGSVGElement>) => {
    const row = closestDistributionRow(event);
    setHoveredCode(row?.department.code ?? null);
    setTooltip(row ? { x: event.clientX, y: event.clientY, department: row.department.name, region: row.department.region, change: row.targetChange } : null);
  };
  const chooseClosestDistributionItem = (event: ReactPointerEvent<SVGSVGElement>) => {
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
  const switchMode = (nextMode: "territories" | "profiles" | "declared") => navigateStep(nextMode === "profiles" ? 8 : nextMode === "declared" ? 0 : 7);
  const switchTerritoryDataset = (dataset: "hospitalisations" | "emergency" | "suicides") => navigateStep(dataset === "emergency" ? 6 : dataset === "suicides" ? 9 : 7);
  const chooseMeasureFamily = (family: "declared" | "emergency" | "hospital" | "deaths") => navigateStep(family === "declared" ? 0 : family === "emergency" ? 6 : family === "hospital" ? 7 : 9);
  const family = mode === "declared" ? "declared" : (mode === "territories" && territoryDataset === "emergency") ? "emergency" : mode === "profiles" || (mode === "territories" && territoryDataset === "hospitalisations") ? "hospital" : "deaths";
  const title = mode === "territories" ? selected.department.name : `${profileAge} · ${profileSex}`;
  const referenceLabel = mode === "territories" ? (territoryDataset === "emergency" ? "France · référence couverte" : "France") : `${profileSex === "Femmes" ? "Hommes" : "Femmes"} · ${profileAge}`;
  const measureLabel = mode === "territories" ? territoryConfig.label : "Patients en MCO pour gestes auto-infligés";
  const measureUnit = mode === "territories" ? territoryConfig.unit : "taux brut pour 100 000 personnes du même âge et sexe";
  const changeLabel = usesAbsoluteChange ? "Écart du taux" : "Évolution du taux";
  const context = mode === "territories"
    ? `${age === "Tous" ? "Tous les âges" : age} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex} · ${chartView === "level" ? territoryConfig.unit : `indice, ${startYear} = 100`}`
    : `France entière · ${profileSex === "Femmes" ? "patientes" : "patients"} hospitalisés · ${chartView === "level" ? "taux pour 100 000" : "indice, 2019 = 100"}`;
  const filterLabels = mode === "territories"
    ? [`${selected.department.code} · ${selected.department.name}`, age === "Tous" ? "Tous les âges" : age, sex === "Hommes et Femmes" ? "Tous les sexes" : sex]
    : [profileAge, profileSex];
  const filterWidth = `${Math.max(...filterLabels.map((label) => Array.from(label).length)) + 5}ch`;
  const chartYears = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  return <section className="territory-appendix" id="territoires">
    <header className="section-heading"><p className="chapter">EXPLORER · QUATRE REGARDS</p><div><h2>Changer de regard<br />Explorer les données</h2><p>Défilez pour passer de l’expérience déclarée aux urgences, à l’hôpital puis aux décès. À chaque étape, les filtres restent disponibles pour approfondir la mesure.</p></div></header>
    <div className="explorer-scroll-track">
    <ol className="explorer-scroll-landmarks" aria-label="Étapes du parcours Explorer">{EXPLORER_STEPS.map((item, index) => <li id={`explorer-step-${index + 1}`} key={item.label} ref={(element) => { landmarks.current[index] = element; }}><span className="sr-only">{index + 1}. {item.label}</span></li>)}</ol>
    <div className="territory-lab" id="territory-explorer" ref={lab} data-mode={mode} data-dataset={territoryDataset} data-step={stepIndex}>
      <div className="explorer-navigation"><div className="explorer-mode data-types" role="group" aria-label="Choisir une mesure de santé mentale"><button type="button" aria-pressed={family === "declared"} onClick={() => chooseMeasureFamily("declared")}>Déclaré <span>Enquête · expérience rapportée</span><ScrollIndicator progress={scrollRangeProgress(scrollPosition, 0, 6)} /></button><button type="button" aria-pressed={family === "emergency"} onClick={() => chooseMeasureFamily("emergency")}>Urgences <span>Recours aigu · OSCOUR®</span><ScrollIndicator progress={scrollRangeProgress(scrollPosition, 6, 1)} /></button><button type="button" aria-pressed={family === "hospital"} onClick={() => chooseMeasureFamily("hospital")}>Hôpital <span>Patients et séjours · MCO</span><ScrollIndicator progress={scrollRangeProgress(scrollPosition, 7, 2)} /></button><button type="button" aria-pressed={family === "deaths"} onClick={() => chooseMeasureFamily("deaths")}>Décès <span>Suicides enregistrés</span><ScrollIndicator progress={scrollRangeProgress(scrollPosition, 9, 1)} /></button></div>
      {family === "hospital" && <div className="measure-subnav" role="group" aria-label="Vue hospitalière"><button type="button" aria-pressed={mode === "territories"} onClick={() => switchTerritoryDataset("hospitalisations")}>Séjours · départements<ScrollIndicator progress={scrollRangeProgress(scrollPosition, 7)} /></button><button type="button" aria-pressed={mode === "profiles"} onClick={() => switchMode("profiles")}>Patients · âge × sexe<ScrollIndicator progress={scrollRangeProgress(scrollPosition, 8)} /></button></div>}</div>
      {mode === "declared" ? <DeclaredExplorer data={data} step={step} position={scrollPosition} onNavigate={navigateStep} /> : <><div className="territory-selector" style={{ "--filter-width": filterWidth } as CSSProperties}><div className="territory-filters">{mode === "territories" && <label htmlFor="department">Département<select id="department" value={selected.department.code} onChange={(event) => setCode(event.target.value)}>{departmentOptions.map((row) => <option key={row.department.code} value={row.department.code}>{row.department.code} · {row.department.name}</option>)}</select></label>}<label htmlFor="territory-age">Tranche d’âge<select id="territory-age" value={mode === "territories" ? age : profileAge} onChange={(event) => mode === "territories" ? setAge(event.target.value) : setProfileAge(event.target.value)}>{(mode === "territories" ? TERRITORY_AGES : ODISSE_AGES).map((item) => <option key={item} value={item}>{item === "Tous" ? "Tous les âges" : item}</option>)}</select></label><label htmlFor="territory-sex">Sexe<select id="territory-sex" value={mode === "territories" ? sex : profileSex} onChange={(event) => mode === "territories" ? setSex(event.target.value) : setProfileSex(event.target.value)}>{(mode === "territories" ? TERRITORY_SEXES : ["Femmes", "Hommes"]).map((item) => <option key={item} value={item}>{item === "Hommes et Femmes" ? "Tous les sexes" : item}</option>)}</select></label></div><div className="territory-summary"><div className="metric-definition"><b>{measureLabel}</b><span>{measureUnit}</span></div>{selected.comparable ? <><span className="metric-period">{changeLabel} · {startYear} → {endYear}</span><strong className="animated-number" aria-hidden="true">{formatEvolution(animatedChange)}{evolutionUnit}</strong><span className="metric-endpoints">{fmt(selectedFirst!.rate)} en {startYear} → {fmt(selectedLast!.rate)} en {endYear}</span></> : <div className="low-sample"><strong>{selected.change == null ? "Comparaison indisponible" : "Effectif faible"}</strong><span>{selected.change == null ? "Deux valeurs comparables sont nécessaires aux dates retenues." : "Moins de 10 décès à l’une des deux dates : évolution non interprétable."} La courbe disponible reste descriptive.</span></div>}{mode === "territories" && selected.comparable && (hasNationalReference ? <p className={`relative-level ${Math.abs(animatedLevelGap) < .05 ? "is-neutral" : animatedLevelGap > 0 ? "is-positive" : "is-negative"}`}>{Math.abs(animatedLevelGap) < .05 ? <>Au niveau de {territoryDataset === "emergency" ? "la référence nationale couverte" : "la France"} en {endYear}</> : <><b>{formatEvolution(animatedLevelGap)}</b> {usesAbsoluteChange ? "point de taux pour 100 000" : ""} par rapport à {territoryDataset === "emergency" ? "la référence nationale couverte" : "la France"} en {endYear}</>}</p> : <p className="relative-level is-neutral">Référence nationale indisponible pour ce regroupement</p>)}<span className="sr-only" aria-live="polite">{title}. {measureLabel}. {selected.comparable ? `${changeLabel} ${formatEvolution(selected.change!)}${evolutionUnit} entre ${startYear} et ${endYear}.` : "Évolution non interprétable."}</span></div></div>
      <div className="territory-chart has-chart-help"><ChartHelp key={`${mode}-${territoryDataset}-${selectedCode}-${age}-${sex}-${chartView}`} explanation={mode === "profiles" ? hospitalExplanation(true, `${title} · France`, false, chartView === "change") : territoryDataset === "emergency" ? emergencyExplanation(`${title} · ${context}`, chartView === "change") : territoryDataset === "suicides" ? deathExplanation(`${title} · ${context}`) : hospitalExplanation(false, `${title} · ${context}`, age === "Tous", chartView === "change")} /><h3 className="data-change" key={`${mode}-${selected.department.code}`}>{title}</h3><p className="territory-context">{measureLabel} · {context}</p>{!usesAbsoluteChange && <div className="chart-view-toggle" role="group" aria-label="Mesure affichée"><button type="button" aria-pressed={chartView === "level"} onClick={() => setChartView("level")}>Niveau</button><button type="button" aria-pressed={chartView === "change"} onClick={() => setChartView("change")}>Évolution · base 100</button></div>}<svg ref={chartSvgRef} style={{ "--chart-label-size": `${chartLabelSize}px` } as CSSProperties} viewBox={`0 0 ${chartWidth} 260`} role="img" aria-label={`${title}, ${chartView === "level" ? "taux réel" : "évolution en base 100"}, comparé à ${referenceLabel}`}><g className="chart-grid chart-grid-old" opacity={1 - axisScale.progress}>{[axisScale.previousMax / 2, axisScale.previousMax].map((tick, index) => <g key={`old-${index}`}><line x1="4" x2={chartWidth - 4} y1={y({ rate: tick })} y2={y({ rate: tick })} /><text x="4" y={y({ rate: tick }) - 5}>{fmt(tick, 0)}</text></g>)}</g><g className="chart-grid chart-grid-new" opacity={axisScale.progress}>{[targetMaxRate / 2, targetMaxRate].map((tick, index) => <g key={`new-${index}`}><line x1="4" x2={chartWidth - 4} y1={y({ rate: tick })} y2={y({ rate: tick })} /><text x="4" y={y({ rate: tick }) - 5}>{fmt(tick, 0)}</text></g>)}</g><g className="chart-grid chart-grid-zero"><line x1="4" x2={chartWidth - 4} y1={y({ rate: 0 })} y2={y({ rate: 0 })} /><text x="4" y={y({ rate: 0 }) - 5}>0</text></g>{chartView === "change" && <line className="index-baseline" x1="4" x2={chartWidth - 4} y1={y({ rate: 100 })} y2={y({ rate: 100 })} />}<path className="national-line" d={yearLinePath(animatedReference, x, y, mode === "territories" && territoryDataset === "emergency" ? [2022, 2023] : [])} />{mode === "territories" && territoryDataset === "emergency" && animatedReference.map((point) => <circle className="reference-dot" key={point.year} cx={x(point)} cy={y(point)} r="2"><title>{point.year} · France : {fmt(point.rate)} pour 100 000 passages codés · périmètre variable</title></circle>)}{mode === "territories" && territoryDataset === "emergency" && [2022, 2023].map((year, index) => {
        const point = animatedReference.find((candidate) => candidate.year === year);
        if (!point) return null;
        const label = year === 2022 ? "PACA / Corse exclues" : "Martinique incluse";
        const compact = chartWidth / chartLabelSize < 55;
        return <g className="scope-annotation" key={`scope-${year}`}><title>{year} : changement de périmètre national · {label}</title><line x1={x(point)} x2={x(point)} y1={y(point) - 5} y2={y(point) - (compact ? 10 : 24)} /><text x={x(point)} y={y(point) - (compact ? 14 : 40)} textAnchor="middle">{compact ? index === 0 ? "①" : "②" : <><tspan x={x(point)}>{index === 0 ? "①" : "②"} Périmètre</tspan><tspan x={x(point)} dy="1.4em">{label}</tspan></>}</text></g>;
      })}{chartHoveredSeries && <path key={`${hoveredMetric?.department.code}-${chartView}`} className="hover-line" d={yearLinePath(chartHoveredSeries, x, y)} aria-hidden="true" />}<path className="department-line" d={yearLinePath(animatedSeries, x, y)} />{animatedSeries.map((point) => {
        const targetValue = chartSeries.find((candidate) => candidate.year === point.year)?.rate ?? point.rate;
        const targetPoint = selected.series.find((candidate) => candidate.year === point.year);
        const pointTooltip = { label: selected.department.name, year: point.year, rate: targetValue, count: targetPoint && "count" in targetPoint ? targetPoint.count : undefined };
        const unit = chartView === "level" ? (mode === "territories" ? territoryConfig.unit : "taux pour 100 000") : `indice · ${startYear} = 100`;
        return <g key={point.year} className="chart-point" role="img" tabIndex={0} aria-label={`${selected.department.name}, ${point.year}, ${fmt(targetValue)}, ${unit}`} onPointerMove={(event) => setChartTooltip({ x: event.clientX, y: event.clientY, ...pointTooltip })} onPointerLeave={() => setChartTooltip(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setChartTooltip({ x: bounds.left + bounds.width / 2, y: bounds.top, ...pointTooltip }); }} onBlur={() => setChartTooltip(null)}><circle className="chart-hit" cx={x(point)} cy={y(point)} r="11" /><circle className="chart-dot" cx={x(point)} cy={y(point)} r="3" /></g>;
      })}{chartYears.map((year) => <text key={year} x={x({ year })} y="250" textAnchor={year === startYear ? "start" : year === endYear ? "end" : "middle"}>{year}</text>)}</svg><div className="legend"><span className="department selected-legend" title={selected.department.name}>{selected.department.name}</span>{chartReference.length > 0 && <span className="france">{referenceLabel}</span>}<span className={`hovered hovered-slot${hoveredMetric ? "" : " is-empty"}`} title={hoveredMetric?.department.name}>{hoveredMetric?.department.name ?? "Aperçu au survol"}</span></div>{mode === "territories" && territoryDataset === "emergency" && <p className="chart-scope-note">① 2022 : PACA et Corse exclues. ② 2023 : Martinique incluse. Périmètre variable : les segments ne se raccordent pas ; aucune évolution nationale calculée.</p>}{mode === "territories" && territoryDataset === "suicides" && age === "00–17 ans" && <p className="chart-scope-note">Référence France non calculable : le taux arrondi à zéro des 0–10 ans empêche de reconstituer le dénominateur des 0–17 ans.</p>}{chartTooltip && <ViewportTooltip x={chartTooltip.x} y={chartTooltip.y} className="chart-tooltip"><span>{chartTooltip.label}</span><small>{chartTooltip.year} · {chartView === "level" ? (mode === "territories" ? territoryConfig.unit : "taux pour 100 000") : "indice base 100"}{chartTooltip.count != null ? ` · effectif diffusé ≈ ${fmt(chartTooltip.count, 1)}` : ""}</small><strong>{fmt(chartTooltip.rate)}</strong></ViewportTooltip>}</div>
      <div className="distribution"><small className="distribution-kicker">Distribution des {usesAbsoluteChange ? "écarts de taux" : "évolutions"} · {startYear} → {endYear}</small><p className="distribution-explanation">{mode === "territories" ? `Un point = un département avec une évolution calculable aux deux dates${usesAbsoluteChange ? " et au moins 10 décès à chacune" : ""}. Le point orange est votre sélection ; le repère France apparaît lorsque son évolution est comparable.` : "Un point = un groupe d’âge et de sexe. Le point orange est votre sélection ; la courbe en pointillés montre l’autre sexe au même âge."}</p>{activeMetrics.length ? <p><b>{fmt(increaseShare)} %</b> {mode === "territories" ? `des ${activeMetrics.length} départements retenus augmentent pour cette sélection.` : `des ${activeMetrics.length} trajectoires âge × sexe augmentent entre ${startYear} et ${endYear}.`}</p> : <p className="no-comparison">Aucun département ne remplit les conditions de comparaison pour cette sélection.</p>}<svg ref={distributionSvgRef} viewBox={`0 0 ${distributionWidth} 160`} aria-label={mode === "territories" ? "Choisir un département dans la distribution de leurs évolutions. La France est indiquée comme second repère lorsqu’elle est comparable." : "Choisir un profil âge et sexe dans la distribution de leurs évolutions."} onPointerMove={moveAcrossDistribution} onPointerLeave={() => { setHoveredCode(null); setTooltip(null); }} onPointerUp={chooseClosestDistributionItem}><rect className="distribution-interaction" x="0" y="0" width={distributionWidth} height="160" /><line className="distribution-axis" x1="20" x2={distributionWidth - 20} y1="80" y2="80" /><line className="zero-marker" x1={distributionX(0)} x2={distributionX(0)} y1="24" y2="140" /><text className="zero-label" x={distributionX(0)} y="17" textAnchor="middle">0{evolutionUnit || " %"}</text>{mode === "territories" && hasComparableNationalChange && <><line className="national-marker" x1={nationalMarkerX} x2={nationalMarkerX} y1="35" y2="140" /><text className="national-marker-label" x={nationalMarkerX} y="29" textAnchor="middle">France {formatEvolution(animatedNationalChange)}{evolutionUnit}</text></>}{[...animatedDistribution.rows].sort((a, b) => a.department.code === selected.department.code ? 1 : b.department.code === selected.department.code ? -1 : 0).map((row) => {
        const isSelected = row.department.code === selected.department.code;
        const selectItem = () => selectDistributionItem(row.department.code);
        const tooltipData = { department: row.department.name, region: row.department.region, change: row.targetChange };
        return <g key={row.department.code} className={`distribution-point${isSelected ? " selected" : ""}${hoveredCode === row.department.code ? " is-hovered" : ""}`} role="button" tabIndex={0} aria-label={`${row.department.name}, ${row.department.region}, évolution ${formatEvolution(row.targetChange)}${evolutionUnit}. Sélectionner.`} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHoveredCode(row.department.code); setTooltip({ x: bounds.left + bounds.width / 2, y: bounds.top, ...tooltipData }); }} onBlur={() => { setHoveredCode(null); setTooltip(null); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectItem(); } }}><circle className="distribution-dot" cx={distributionX(row.change)} cy={row.y} r={row.radius}><title>{row.department.name} · {row.department.region} : {formatEvolution(row.targetChange)}{evolutionUnit}</title></circle></g>;
      })}</svg>{tooltip && <ViewportTooltip x={tooltip.x} y={tooltip.y}><span>{tooltip.department}</span><small>{tooltip.region}</small><strong>{formatEvolution(tooltip.change)}{evolutionUnit}</strong></ViewportTooltip>}<span>{formatEvolution(distributionMin)}{evolutionUnit}</span><span>{formatEvolution(distributionMax)}{evolutionUnit}</span></div></>}
    </div>
    <div className="explorer-scroll-status"><span><b>{String(stepIndex + 1).padStart(2, "0")} / {EXPLORER_STEPS.length}</b> · {step.label}</span><span>Défilez pour {stepIndex === EXPLORER_STEPS.length - 1 ? "continuer" : "changer de regard"} ↓</span></div>
    </div>
    <p className="source-note"><b>Lecture.</b> Les vagues déclarées de 2005–2021 ne sont pas raccordées au Baromètre 2024, dont le protocole diffère. Aux urgences, PACA et Corse sont exclues des comparaisons 2020–2024 en raison d’une rupture de codage depuis 2022. Le total national exclut ces régions depuis 2022 et intègre la Martinique depuis 2023 : son évolution sur 2020–2024 n’est donc pas calculée. Le dénominateur est celui des passages avec au moins un diagnostic renseigné. Dans la distribution, chaque point représente un département (ou un profil âge × sexe) avec une évolution calculable aux deux dates. Le trait France est un repère national distinct des départements. Chaque bouton ouvre une mesure distincte. MCO désigne la médecine, la chirurgie et l’obstétrique. Les gestes auto-infligés incluent les tentatives de suicide et les automutilations non suicidaires. Les hospitalisations en psychiatrie sont hors du champ MCO. Les séjours MCO, les passages aux urgences, les décès par suicide et les patients hospitalisés ne forment pas un entonnoir individuel et n’ont pas tous le même dénominateur. Pour les taux de population, pour les séjours et les décès, « Tous les âges » utilise le taux standardisé et les classes d’âge le taux brut. Les urgences expriment une part pour 100 000 passages codés, pas un taux dans la population. Pour les décès, l’évolution est exprimée en points de taux pour 100 000, et non en pourcentage relatif. Pour les décès par suicide, un département dont l’effectif est inférieur à 10 à l’une des deux dates reste visible dans la courbe, mais est exclu de la comparaison et de la distribution. Ce seuil est une règle de prudence de cette interface, pas un test statistique. Les références nationales par âges regroupés sont approchées à partir des effectifs et taux diffusés, arrondis par la source. Source : Odissé, Santé publique France.</p>
  </section>;
}

const METHOD_SCENES = [
  { word: "Distinguer", label: "QUATRE REGARDS", title: "Des réalités différentes", copy: "Interroger une personne, compter un passage aux urgences, un séjour ou un décès : chaque source rend une dimension visible.", takeaway: "Ces sources ne sont pas les étapes d’un même parcours individuel.", rows: [
    ["Déclaré", "Une expérience rapportée", "Épisode dépressif caractérisé, trouble anxieux généralisé et pensées suicidaires déclarés dans les enquêtes."],
    ["Urgences", "Un recours aigu", "Passages pour gestes auto-infligés dans OSCOUR® ; le périmètre national varie depuis 2022."],
    ["Hôpital", "Une prise en charge", "Patients et séjours en MCO pour gestes auto-infligés ; hospitalisations en psychiatrie exclues."],
    ["Décès", "Une mortalité enregistrée", "Décès par suicide, documentés séparément."],
  ] },
  { word: "Rapporter", label: "LE DÉNOMINATEUR COMPTE", title: "Un chiffre, rapporté à quoi ?", copy: "Le dénominateur donne son sens à la mesure. Une part de l’activité des urgences et un taux dans la population répondent à des questions différentes.", takeaway: "Les niveaux ne se comparent pas d’une source à l’autre.", rows: [
    ["Déclaré", "% des personnes", "Prévalence déclarée dans la population couverte par l’enquête."],
    ["Urgences", "Pour 100 000 passages", "Part des gestes auto-infligés parmi les passages avec au moins un diagnostic renseigné."],
    ["Hôpital", "Pour 100 000 habitants", "Taux de patients ou de séjours : deux unités de comptage distinctes."],
    ["Décès", "Pour 100 000 habitants", "Taux de décès par suicide ; évolutions exprimées en points de taux."],
  ] },
  { word: "Comparer", label: "GARDER LES MÊMES REPÈRES", title: "Des comparaisons sous conditions", copy: "Avant de rapprocher deux valeurs, vérifier la population, la période et la définition. L’incertitude fait partie de la lecture.", takeaway: "Un seuil de prudence n’est pas un test de significativité.", rows: [
    ["Population", "Brut ou standardisé", "Les taux hospitaliers et de décès tous âges sont standardisés ; les taux par âge sont bruts. Certaines références nationales regroupées sont approchées à partir de valeurs arrondies."],
    ["Période", "2005–2021 ≠ 2024", "Les Baromètres historiques restent séparés de 2024, dont le protocole a changé."],
    ["Incertitude", "Conserver les intervalles", "Les IC à 95 % sont affichés lorsqu’ils sont cohérents. Une borne incohérente dans la source est signalée ; une donnée absente reste absente."],
    ["Petits effectifs", "Au moins 10 décès", "Pour comparer les évolutions départementales, ce seuil doit être atteint aux deux dates. La courbe disponible reste visible."],
  ] },
  { word: "Interpréter", label: "SAVOIR OÙ S’ARRÊTER", title: "Observer un écart, garder ses limites", copy: "Une visualisation permet de repérer des différences et de poser des questions. Elle ne suffit pas à identifier leur cause.", takeaway: "Derrière les données, des personnes. Aucun indicateur ne résume leur expérience.", rows: [
    ["Association", "Une relation observée", "Le gradient financier déclaré ne démontre pas une cause des hospitalisations."],
    ["Prise en charge", "Un regard sur les soins", "Les données reflètent aussi l’accès, l’offre et le codage, pas toute la souffrance psychique."],
    ["Territoires", "Situer, sans classer", "Une distribution décrit des écarts de mesure ; elle ne classe pas la souffrance des habitants."],
    ["Traçabilité", "Pouvoir vérifier", "Les exports, calculs et règles de comparaison sont conservés dans le dépôt public."],
  ] },
];

function MethodSection({ data }: { data: ExperienceData }) {
  const root = useRef<HTMLElement>(null);
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const [reading, setReading] = useState({ scene: 0, fraction: 0, reduced: false });
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const synchronize = () => {
      frame = 0;
      const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 18;
      let scene = 0;
      landmarks.current.forEach((element, index) => { if (element && element.getBoundingClientRect().top <= line) scene = index; });
      const bounds = landmarks.current[scene]?.getBoundingClientRect();
      const fraction = bounds ? Math.max(0, Math.min(1, (line - bounds.top) / bounds.height)) : 0;
      setReading(current => current.scene === scene && Math.abs(current.fraction - fraction) < .001 && current.reduced === motion.matches ? current : { scene, fraction, reduced: motion.matches });
      root.current?.querySelectorAll<HTMLElement>(".method-reveal").forEach(element => {
        const reveal = motion.matches ? 1 : Math.max(0, Math.min(1, (window.innerHeight * .9 - element.getBoundingClientRect().top) / (window.innerHeight * .25)));
        element.style.setProperty("--method-reveal", String(reveal));
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(synchronize); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    if (root.current) observer.observe(root.current);
    synchronize();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); motion.removeEventListener("change", schedule); observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const [clickRevision, setClickRevision] = useState(0);
  useEffect(() => {
    if (!clickRevision) return;
    const timer = window.setTimeout(() => setClickRevision(0), 700);
    return () => window.clearTimeout(timer);
  }, [clickRevision]);
  const step = METHOD_SCENES[reading.scene];
  const reveal = reading.reduced ? 1 : Math.max(0, Math.min(1, reading.fraction / .52));
  const eased = reveal * reveal * (3 - 2 * reveal);
  return <section className="method method-narrative" id="methode" ref={root} aria-labelledby="method-heading">
    <header className="method-heading method-reveal"><p className="chapter">MÉTHODE · UNE AUTRE FAÇON DE LIRE</p><h2 id="method-heading">Lire les données<br />Garder leurs limites</h2><p>Quatre gestes pour comprendre ce que les chiffres permettent de dire.</p></header>
    <div className="method-scroll-track">
      <ol className="method-landmarks" aria-label="Étapes de la méthode">{METHOD_SCENES.map((scene, index) => <li key={scene.word} id={`method-step-${index + 1}`} ref={element => { landmarks.current[index] = element; }}><span className="sr-only">{scene.word} {scene.title}</span></li>)}</ol>
      <div className="method-stage" data-method-scene={reading.scene} data-method-reveal={reveal.toFixed(3)} style={{ "--method-scene-reveal": reveal } as CSSProperties}>
        <nav className="method-steps" aria-label="Parcourir la méthode">{METHOD_SCENES.map((scene, index) => <a key={scene.word} href={`#method-step-${index + 1}`} aria-current={reading.scene === index ? "step" : undefined} onClick={(event) => {
          event.preventDefault();
          const element = landmarks.current[index];
          if (!element) return;
          const bounds = element.getBoundingClientRect();
          const line = (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 60) + 18;
          window.scrollTo({ top: window.scrollY + bounds.top - line + bounds.height * .55, behavior: "instant" });
          setClickRevision((revision) => revision + 1);
        }}><span>0{index + 1}</span>{scene.word}<ScrollIndicator progress={reading.scene === index ? reading.fraction : 0} /></a>)}</nav>
        <div className={`method-stage-body${clickRevision ? " method-click-arrival" : ""}`} key={`method-${reading.scene}-${clickRevision}`}>
          <div className="method-reading"><p className="chapter">{step.label}</p><h3 style={{ transform: eased === 1 ? "none" : `translateY(${(1 - eased) * 25}px) scale(${1 + (1 - eased) * .35})` }}>{step.word}</h3><h4>{step.title}</h4><p>{step.copy}</p></div>
          <div className="method-rules" key={reading.scene}>{step.rows.map(([label, title, copy], index) => {
            const arrival = reading.reduced ? 1 : Math.max(0, Math.min(1, (reading.fraction - index * .055) / .27));
            return <article key={label} style={{ "--rule-reveal": arrival } as CSSProperties}><small>{label}</small><strong>{title}</strong><p>{copy}</p><span className="method-rule-line" aria-hidden="true" /></article>;
          })}</div>
        </div>
        <p className="method-takeaway" style={{ opacity: Math.max(.15, eased) }}>{step.takeaway}</p>
      </div>
    </div>
    <div className="method-source-section"><p className="chapter method-reveal">VÉRIFIER · RETROUVER · RÉUTILISER</p><div className="source-ledger"><h3 className="method-reveal">Revenir<br />aux sources</h3><ol><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Épisodes dépressifs · Baromètre 2024 ↗</a><span>Déclaré</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/trouble-anxieux-generalise-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Trouble anxieux généralisé · Baromètre 2024 ↗</a><span>Déclaré</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/conduites-sucidaires-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Pensées suicidaires · Baromètre 2024 ↗</a><span>Déclaré</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_reg/" target="_blank" rel="noreferrer">Épisodes dépressifs · 2005–2021 ↗</a><span>Historique</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_reg/" target="_blank" rel="noreferrer">Pensées et tentatives · 2005–2021 ↗</a><span>Historique</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-departement/" target="_blank" rel="noreferrer">Séjours hospitaliers · départements ↗</a><span>Territoires</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-france/" target="_blank" rel="noreferrer">Séjours hospitaliers · France ↗</a><span>Référence</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/" target="_blank" rel="noreferrer">Patients hospitalisés · France ↗</a><span>Âge × sexe</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-departement/" target="_blank" rel="noreferrer">Passages aux urgences · départements ↗</a><span>Territoires</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-france/" target="_blank" rel="noreferrer">Passages aux urgences · France ↗</a><span>Référence</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-departement/" target="_blank" rel="noreferrer">Décès par suicide · départements ↗</a><span>Territoires</span></li><li className="method-reveal"><a href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-france/" target="_blank" rel="noreferrer">Décès par suicide · France ↗</a><span>Référence</span></li></ol></div><p className="method-source-note method-reveal">Les séries nationales des Baromètres historiques complètent les séries régionales. Leurs exports sont conservés dans le code source, avec les transformations et les contrôles des intervalles de confiance.</p><div className="method-reuse method-reveal"><h3>Des sources aux graphiques</h3><p>Une application statique, des données servies localement et des calculs reproductibles. React, TypeScript et SVG pour la lecture ; Python pour préparer les données.</p><a href="https://github.com/m4nR3is/odisse-sante-mentale" target="_blank" rel="noreferrer">Ouvrir le code, les données et les analyses ↗</a><p className="generation">Données web régénérées le {data.meta.generated} · Code MIT · Textes et visuels originaux CC-BY 4.0 · Données Odissé Licence Ouverte 2.0.</p></div></div>
  </section>;
}

type StoryScene = 0 | 1 | 2 | 3 | 4;
type StoryPointInfo = { label: string; context: string; value: string; detail: string };

type StoryDrawing = { scene: StoryScene; main: number; mainStart: number; boys: number; boysStart: number; social: number };

function useStoryDrawing(scene: StoryScene, entered: boolean) {
  const [drawing, setDrawing] = useState<StoryDrawing>({ scene, main: 0, mainStart: 0, boys: 0, boysStart: 0, social: 0 });
  const current = useRef(drawing);
  useEffect(() => {
    if (!entered) return;
    let frame = 0;
    const publish = (next: StoryDrawing) => {
      current.current = next;
      setDrawing(next);
    };
    const complete = { scene, main: 1, mainStart: 0, boys: scene === 1 || scene === 3 ? 1 : 0, boysStart: 0, social: scene === 4 ? 1 : 0 };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => { cancelAnimationFrame(frame); publish(complete); };
    if (motion.matches) { finish(); return; }
    const animate = (from: StoryDrawing, to: StoryDrawing, duration: number, done?: () => void) => {
      if (from.main === to.main && from.boys === to.boys && from.social === to.social && from.mainStart === to.mainStart && from.boysStart === to.boysStart) {
        publish(to);
        done?.();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        publish({ scene: to.scene, main: from.main + (to.main - from.main) * eased, mainStart: from.mainStart + (to.mainStart - from.mainStart) * eased, boys: from.boys + (to.boys - from.boys) * eased, boysStart: from.boysStart + (to.boysStart - from.boysStart) * eased, social: from.social + (to.social - from.social) * eased });
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
      const keepGirls = (from.scene === 2 || from.scene === 3) && (scene === 2 || scene === 3);
      // Advance the disappearing edge from 2019 towards 2024.
      const erased = { ...from, mainStart: keepGirls ? from.mainStart : from.main, boysStart: from.boys, social: 0 };
      animate(from, erased, 650, () => {
        const next = { scene, main: keepGirls ? erased.main : 0, mainStart: keepGirls ? erased.mainStart : 0, boys: 0, boysStart: 0, social: 0 };
        publish(next);
        animate(next, complete, scene === 4 ? 1600 : 750);
      });
    }
    motion.addEventListener("change", finish);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", finish); };
  }, [entered, scene]);
  return drawing;
}

function StoryFigure({ data, scene: requestedScene }: { data: ExperienceData; scene: StoryScene }) {
  const maskId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= .25) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: .25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const drawing = useStoryDrawing(requestedScene, entered);
  const scene = drawing.scene;
  const [tooltip, setTooltip] = useState<(StoryPointInfo & { x: number; y: number }) | null>(null);
  useEffect(() => {
    const dismiss = () => setTooltip(null);
    dismiss();
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => { window.removeEventListener("scroll", dismiss); window.removeEventListener("resize", dismiss); };
  }, [requestedScene]);
  const pointEvents = (info: StoryPointInfo, enabled: boolean) => ({
    className: "story-point",
    role: "img" as const,
    tabIndex: enabled ? 0 : -1,
    "aria-label": `${info.label}. ${info.context}. ${info.value}. ${info.detail}`,
    "data-interactive": enabled,
    onPointerMove: (event: ReactPointerEvent<SVGGElement>) => { if (enabled) setTooltip({ ...info, x: event.clientX, y: event.clientY }); },
    onPointerLeave: () => setTooltip(null),
    onFocus: (event: ReactFocusEvent<SVGGElement>) => {
      if (!enabled) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      setTooltip({ ...info, x: bounds.left + bounds.width / 2, y: bounds.top });
    },
    onBlur: () => setTooltip(null),
    onKeyDown: (event: { key: string }) => { if (event.key === "Escape") setTooltip(null); },
  });
  const hospitalInfo = (point: SeriesPoint, label: string): StoryPointInfo => ({ label, context: `${point.year} · Patients hospitalisés en MCO`, value: `${fmt(point.rate)} pour 100 000`, detail: `${fmt(point.patients, 0)} patients · ${scene <= 1 ? "Taux standardisé" : "Taux brut par âge et sexe"}` });
  const national = data.odissePatients.filter((point) => point.age === "Tous" && point.sex === "Hommes et Femmes").sort((a, b) => a.year - b.year);
  const girls = data.odissePatients.filter((point) => point.age === "11–14 ans" && point.sex === "Femmes").sort((a, b) => a.year - b.year);
  const boys = data.odissePatients.filter((point) => point.age === (scene === 1 ? "Tous" : "11–14 ans") && point.sex === "Hommes").sort((a, b) => a.year - b.year);
  const social = FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === "Dépression" && point.financial === financial)!);
  const women = data.odissePatients.filter((point) => point.age === "Tous" && point.sex === "Femmes").sort((a, b) => a.year - b.year);
  const values = scene === 0 ? national : scene === 1 ? women : girls;
  const x = (year: number) => 54 + (year - 2019) / 5 * 480;
  const ceiling = scene <= 1 ? 150 : 500;
  const y = (rate: number) => 260 - rate / ceiling * 206;
  return <div className="story-figure" data-scene={scene}>
    <div className="story-figure-heading has-chart-help"><ChartHelp key={scene} explanation={scene === 4 ? socialExplanation("Dépression") : storyHospitalExplanation(scene)} /><p className="chapter">{scene === 4 ? "ENQUÊTE · BAROMÈTRE 2024" : "MCO · PATIENTS · GESTES AUTO-INFLIGÉS"}</p><h3>{["La vue d’ensemble", "Femmes et hommes · tous âges", "Les filles de 11–14 ans", "Deux trajectoires, un même âge", "La situation financière perçue"][scene]}</h3>{scene === 2 && <p className="story-scale-notice">Nouvelle population · taux brut<br /><b>Nouvelle échelle : 0–500 pour 100 000</b></p>}<p>{scene === 4 ? "Épisode dépressif caractérisé · 12 derniers mois · 18–79 ans" : scene === 0 ? "France · tous âges, tous sexes · taux standardisé pour 100 000 habitants" : scene === 1 ? "France · tous âges · taux standardisés pour 100 000 personnes de chaque sexe" : "France · taux brut pour 100 000 personnes du même âge et sexe"}</p></div>
    <div className="story-visual">
      <svg ref={svgRef} viewBox="0 0 580 320" role="group" aria-label={scene === 4 ? `Dépression déclarée selon la situation financière : ${social.map((point) => `${FINANCIAL_SHORT[point.financial]}, ${fmt(point.estimate)} %`).join(" ; ")}. Intervalles de confiance à 95 %.` : `${scene === 0 ? "Tous âges et sexes" : scene === 1 ? "Femmes · tous âges" : "Filles de 11–14 ans"} : ${fmt(values[0].rate)} en 2019, ${fmt(values.at(-1)!.rate)} en 2024, pour 100 000.${(scene === 1 || scene === 3) ? ` ${scene === 1 ? "Hommes · tous âges" : "Garçons de 11–14 ans"} : ${fmt(boys[0].rate)} à ${fmt(boys.at(-1)!.rate)}.` : ""}`}>
        <defs>{[{ name: "main", points: values, start: drawing.mainStart, end: drawing.main }, { name: "boys", points: boys, start: drawing.boysStart, end: drawing.boys }].map(({ name, points, start, end }) => <mask key={name} id={`${maskId}-${name}`} maskUnits="userSpaceOnUse" x="0" y="0" width="580" height="320"><path d={linePath(points, (point) => x(point.year), (point) => y(point.rate))} fill="none" stroke="white" strokeWidth="16" strokeLinecap="round" pathLength="1" strokeDasharray={`${Math.max(0, end - start)} 1`} strokeDashoffset={-start} opacity={end <= start ? 0 : 1} /></mask>)}</defs>
        {scene === 4 ? <g>
          {[0, 10, 20, 30].map((tick) => <g className="story-gridline" key={tick} opacity={Math.min(1, drawing.social * 4)}><line x1={136 + tick / 32 * 382} x2={136 + tick / 32 * 382} y1="44" y2="258" /><text x={136 + tick / 32 * 382} y="294" textAnchor="middle">{tick} %</text></g>)}
          {social.map((point, index) => {
            const progress = Math.max(0, Math.min(1, (drawing.social - index * .17) / .49));
            const phase = (start: number, duration: number) => Math.max(0, Math.min(1, (progress - start) / duration));
            const labelProgress = phase(0, .25);
            const countProgress = phase(.15, .6);
            const arrival = phase(.75, .25);
            const growth = arrival * arrival * (3 - 2 * arrival);
            const animatedEstimate = point.estimate * countProgress;
            const center = 136 + animatedEstimate / 32 * 382;
            const intervalProgress = growth;
            const intervalScale = intervalProgress;
            return <g className="story-social-row" key={point.financial} data-progress={progress} data-estimate={animatedEstimate} opacity={progress > 0 ? 1 : 0}>
              <text className="story-social-label" x="0" y={68 + index * 60} opacity={labelProgress} transform={`translate(0 ${(1 - labelProgress) * 10})`}>{FINANCIAL_SHORT[point.financial]}</text>
              <line className="story-interval" x1={center + (point.low - point.estimate) / 32 * 382 * intervalScale} x2={center + (point.high - point.estimate) / 32 * 382 * intervalScale} y1={63 + index * 60} y2={63 + index * 60} opacity={intervalProgress} />
              <g {...pointEvents({ label: FINANCIAL_SHORT[point.financial], context: "Dépression déclarée · 2024", value: `${fmt(point.estimate)} %`, detail: `IC à 95 % : ${fmt(point.low)}–${fmt(point.high)} %` }, progress === 1)}>
                <circle className="story-point-hit" cx={center} cy={63 + index * 60} r="12" />
              <circle className="story-dot story-social-dot" cx={center} cy={63 + index * 60} r={2 + 3 * growth} style={{ fill: growth === 0 ? "var(--ink)" : `color-mix(in srgb, var(--ink) ${(1 - growth) * 100}%, var(--accent))` }} />
              </g>
              <text className="story-value" x={center + (point.high - point.estimate) / 32 * 382 * intervalScale + 10} y={68 + index * 60} opacity={phase(0, .12)}>{fmt(animatedEstimate)} %</text>
            </g>;
          })}
        </g> : <>
          {(scene <= 1 ? [0, 50, 100, 150] : [0, 200, 400]).map((tick) => <g className="story-gridline" key={tick}><line x1="54" x2="534" y1={y(tick)} y2={y(tick)} /><text x="42" y={y(tick) + 5} textAnchor="end">{tick}</text></g>)}
          <g className="story-main-reveal" mask={`url(#${maskId}-main)`} data-progress={drawing.main - drawing.mainStart}><path className={scene === 0 ? "story-national" : "story-girls"} d={linePath(values, (point) => x(point.year), (point) => y(point.rate))} />{values.map((point) => <g key={point.year} {...pointEvents(hospitalInfo(point, scene === 0 ? "France · tous âges, tous sexes" : scene === 1 ? "Femmes · tous âges" : "Filles · 11–14 ans"), drawing.main === 1 && drawing.mainStart === 0)}><circle className="story-point-hit" cx={x(point.year)} cy={y(point.rate)} r="12" /><circle className={scene === 0 ? "story-dot-muted" : "story-dot"} cx={x(point.year)} cy={y(point.rate)} r="4" /></g>)}</g>
          {(scene === 1 || scene === 3) && <g className="story-boys-reveal" mask={`url(#${maskId}-boys)`} data-progress={drawing.boys - drawing.boysStart}><path className="story-boys" d={linePath(boys, (point) => x(point.year), (point) => y(point.rate))} />{boys.map((point) => <g key={point.year} {...pointEvents(hospitalInfo(point, scene === 1 ? "Hommes · tous âges" : "Garçons · 11–14 ans"), drawing.boys === 1 && drawing.boysStart === 0)}><circle className="story-point-hit" cx={x(point.year)} cy={y(point.rate)} r="12" /><circle className="story-dot-muted" cx={x(point.year)} cy={y(point.rate)} r="4" /></g>)}</g>}
          {values.map((point) => <text x={x(point.year)} y="301" textAnchor="middle" key={point.year}>{point.year}</text>)}
        </>}
      </svg>
      {scene === 4 ? <><dl className="story-mobile-values">{social.map((point) => <div key={point.financial}><dt>{FINANCIAL_SHORT[point.financial]}</dt><dd>{fmt(point.estimate)} %<small>IC 95 % : {fmt(point.low)}–{fmt(point.high)} %</small></dd></div>)}</dl><p className="story-chart-note">Le point indique le pourcentage estimé ; le trait montre son intervalle de confiance à 95 %, c’est-à-dire l’incertitude de l’enquête.</p></> : <><div className="story-legend"><span className={scene === 0 ? "is-national" : ""}>{scene === 0 ? "Tous âges, tous sexes" : scene === 1 ? "Femmes · tous âges" : "Filles · 11–14 ans"} · {fmt(values.at(-1)!.rate)} en 2024</span>{(scene === 1 || scene === 3) && <span className="is-boys">{scene === 1 ? "Hommes · tous âges" : "Garçons"} · {fmt(boys.at(-1)!.rate)} en 2024</span>}</div><p className="story-chart-note">{scene === 0 ? "MCO : médecine, chirurgie et obstétrique, hors hospitalisations psychiatriques. Taux standardisé pour la comparaison nationale." : scene === 1 ? "Femmes et hommes : taux standardisés, sur la même échelle de 0 à 150 pour 100 000." : scene === 2 ? "Nouvelle population : taux brut par âge et sexe. Nouvelle échelle : de 0 à 500 pour 100 000." : "Les deux courbes partagent la même échelle et la même période."}</p></>}

    </div>
    {tooltip && <ViewportTooltip x={tooltip.x} y={tooltip.y} className="story-tooltip"><span>{tooltip.label}</span><small>{tooltip.context}</small><strong>{tooltip.value}</strong><small>{tooltip.detail}</small></ViewportTooltip>}
    <a className="story-source" href={scene === 4 ? "https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/" : "https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/"} target="_blank" rel="noreferrer">Source : Odissé · {scene === 4 ? "Baromètre 2024" : "Patients hospitalisés"} ↗</a>
  </div>;
}

function StoryNumber({ value, ratio = false, digits = 0 }: { value: number; ratio?: boolean; digits?: number }) {
  const element = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const format = (number: number) => ratio ? `× ${fmt(number)}` : signed(number, digits);
  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= .6), { threshold: .6 });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => { cancelAnimationFrame(frame); setDisplayed(visible ? value : 0); };
    if (!visible || motion.matches) { finish(); return; }
    setDisplayed(0);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1000);
      setDisplayed(value * progress * progress * (3 - 2 * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    motion.addEventListener("change", finish);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", finish); };
  }, [value, visible]);
  return <strong ref={element} aria-label={format(value)} data-value={displayed}><span aria-hidden="true">{format(displayed)}</span></strong>;
}

function GuidedOpening({ data, onExplore }: { data: ExperienceData; onExplore: (view: "declared" | "profiles") => void }) {
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
      setScene((current) => current === activeScene ? current : activeScene);
      const bounds = steps.current[activeScene]?.getBoundingClientRect();
      const fraction = bounds ? Math.max(0, Math.min(1, (readingLine - bounds.top) / Math.max(1, bounds.height))) : 0;
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

  const series = (age: string, sex: string) => data.odissePatients.filter((point) => point.age === age && point.sex === sex).sort((a, b) => a.year - b.year);
  const women = series("Tous", "Femmes"), men = series("Tous", "Hommes");
  const national = series("Tous", "Hommes et Femmes"), girls = series("11–14 ans", "Femmes"), boys = series("11–14 ans", "Hommes");
  const change = (points: SeriesPoint[]) => 100 * (points.at(-1)!.rate / points[0].rate - 1);
  const comfortable = data.social.find((point) => point.indicator === "Dépression" && point.financial === FINANCIAL_ORDER[0])!;
  const difficult = data.social.find((point) => point.indicator === "Dépression" && point.financial === FINANCIAL_ORDER[3])!;
  const scenes = [
    { chapter: "01 · LA PREMIÈRE IMPRESSION", title: "Une hausse modérée, à l’échelle nationale", metric: signed(change(national)), definition: "évolution du taux de patients en MCO pour gestes auto-infligés · 2019 → 2024", copy: `En France, le taux standardisé passe de ${fmt(national[0].rate)} à ${fmt(national.at(-1)!.rate)} pour 100 000 habitants. Cette vue d’ensemble résume des populations aux trajectoires différentes.`, next: "Cette hausse est-elle partagée par les femmes et les hommes ?" },
    { chapter: "02 · DISTINGUER LES SEXES", title: "Une hausse nationale, deux directions", metric: `${signed(change(women), 1)} / ${signed(change(men), 1)}`, definition: "évolutions des taux standardisés · femmes / hommes · tous âges · 2019 → 2024", copy: `Chez les femmes, le taux standardisé passe de ${fmt(women[0].rate)} à ${fmt(women.at(-1)!.rate)} pour 100 000 ; chez les hommes, de ${fmt(men[0].rate)} à ${fmt(men.at(-1)!.rate)}. La hausse nationale rassemble une augmentation chez les femmes et une baisse chez les hommes.`, next: "Les femmes de tous âges suivent-elles la même trajectoire ? Resserrons le regard sur les filles de 11–14 ans." },
    { chapter: "03 · CHANGER DE POPULATION", title: "Chez les filles de 11–14 ans, la trajectoire se détache.", metric: signed(change(girls)), definition: "évolution du taux chez les filles de 11–14 ans · 2019 → 2024", copy: `Le taux passe de ${fmt(girls[0].rate)} à ${fmt(girls.at(-1)!.rate)} pour 100 000 filles du même âge. La hausse observée après 2020 devient visible. Ces données décrivent des prises en charge hospitalières, pas toute la souffrance psychique.`, next: "Les garçons du même âge suivent-ils cette trajectoire ?" },
    { chapter: "04 · COMPARER À ÂGE ÉGAL", title: "Le même âge, une autre trajectoire", metric: `${signed(change(girls))} / ${signed(change(boys))}`, definition: "évolutions des taux · filles / garçons de 11–14 ans · 2019 → 2024", copy: `Chez les garçons, le taux passe de ${fmt(boys[0].rate)} à ${fmt(boys.at(-1)!.rate)} pour 100 000. Les deux courbes montrent une divergence : la progression n’est pas uniforme, même au sein d’une tranche d’âge.`, next: "L’hôpital montre le recours aux soins. Que voit-on en interrogeant directement les personnes ?" },
    { chapter: "05 · CHANGER DE SOURCE", title: "L’enquête révèle une autre inégalité.", metric: `× ${fmt(difficult.estimate / comfortable.estimate)}`, definition: "rapport des prévalences déclarées · difficulté financière / aisance · 2024", copy: `Un épisode dépressif caractérisé dans les 12 derniers mois est déclaré par ${fmt(comfortable.estimate)} % des adultes de 18–79 ans se disant à l’aise financièrement et ${fmt(difficult.estimate)} % de ceux en difficulté. Les quatre situations dessinent un gradient.`, next: "Cette association ne permet pas d’expliquer la trajectoire hospitalière : populations, périodes et mesures diffèrent." },
  ];
  return <section className="guided-opening scroll-story" id="constats" aria-labelledby="observations-title">
    <header className="section-heading"><p className="chapter">COMPRENDRE AVANT D’EXPLORER</p><div><h2 id="observations-title">Un chiffre<br />Plusieurs regards</h2><p>Partons de la vue d’ensemble. Changeons de population, puis de source, pour comprendre ce que chaque mesure rend visible.</p></div></header>
    <div className="story-layout">
      <div className="story-steps">{scenes.map((step, index) => <article className={`story-step${scene === index ? " is-active" : ""}`} id={`scene-${index + 1}`} data-story-step={index} key={step.chapter} ref={(element) => { steps.current[index] = element; }} aria-labelledby={`scene-title-${index}`}>
        <p className="chapter">{step.chapter}</p><h3 id={`scene-title-${index}`}>{step.title.replace("11–14", "11\u2060–\u206014")}</h3><div className="story-stat">{index === 1 || index === 3 ? <div className="story-comparison"><div><StoryNumber value={change(index === 1 ? women : girls)} digits={index === 1 ? 1 : 0} /><span>{index === 1 ? "Femmes" : "Filles"}</span></div><div><StoryNumber value={change(index === 1 ? men : boys)} digits={index === 1 ? 1 : 0} /><span>{index === 1 ? "Hommes" : "Garçons"}</span></div></div> : <StoryNumber value={index === 0 ? change(national) : index === 2 ? change(girls) : difficult.estimate / comfortable.estimate} ratio={index === 4} />}<span>{step.definition}</span></div><p className="story-copy">{step.copy}</p>
        <div className="story-mobile-figure"><StoryFigure data={data} scene={index as StoryScene} /></div>
        <p className="story-next">{index < 4 && <span aria-hidden="true">↓ </span>}{step.next}</p>
        {index === 3 && <button type="button" className="evidence-action" onClick={() => onExplore("profiles")}>Explorer les seize profils <span>↗</span></button>}
        {index === 4 && <button type="button" className="evidence-action" onClick={() => onExplore("declared")}>Explorer les indicateurs déclarés <span>↗</span></button>}
      </article>)}</div>
      <aside className="story-sticky" aria-label="Visualisation du récit"><nav className="story-progress" aria-label="Scènes du récit">{scenes.map((step, index) => <a href={`#scene-${index + 1}`} key={step.chapter} aria-current={scene === index ? "step" : undefined}><span>0{index + 1}</span><span className="sr-only"> {step.title}</span><ScrollIndicator progress={scrollRangeProgress(storyPosition, index)} /></a>)}</nav><StoryFigure data={data} scene={scene} /></aside>
    </div>
    <div className="reading-bridge"><p className="chapter">CE QUE CE RÉCIT RÉVÈLE</p><div className="reading-takeaway"><h3>Une hausse nationale peut réunir des trajectoires opposées.</h3><p>Et changer de source, c’est changer ce que l’on mesure.</p><p className="reading-takeaway-detail">Enquête, urgences, hospitalisations et décès éclairent des dimensions différentes. Ces sources ne sont pas les étapes d’un même parcours individuel : explorez-les en conservant leurs propres populations, unités et périodes.</p></div><a href="#territoires">Explorer les quatre regards ↓</a></div>
  </section>;
}

const INTRO_LEAD = "Enquêtes sur les troubles déclarés, prises en charge pour gestes auto-infligés, décès par suicide : que montrent ces données de la santé mentale ? Chaque source éclaire une dimension différente. Aucune ne suffit à en dresser le portrait.";

function IntroLeadLines({ register }: { register: (element: HTMLSpanElement | null) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState([INTRO_LEAD]);
  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    let signature = "";
    const measure = () => {
      const style = getComputedStyle(parent);
      const next = `${parent.clientWidth}/${style.fontSize}/${style.lineHeight}`;
      if (next === signature) return;
      signature = next;
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;display:block;visibility:hidden;pointer-events:none;white-space:normal;";
      probe.style.width = `${parent.clientWidth}px`;
      probe.textContent = INTRO_LEAD;
      parent.appendChild(probe);
      const node = probe.firstChild!;
      const range = document.createRange();
      const wrapped: string[] = [];
      let previousTop = -Infinity;
      for (const word of INTRO_LEAD.matchAll(/\S+/g)) {
        range.setStart(node, word.index!);
        range.setEnd(node, word.index! + word[0].length);
        const top = range.getBoundingClientRect().top;
        if (Math.abs(top - previousTop) > 1) wrapped.push(word[0]);
        else wrapped[wrapped.length - 1] += ` ${word[0]}`;
        previousTop = top;
      }
      probe.remove();
      setLines(wrapped);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  return <span className="intro-flight intro-lead-flight" ref={(element) => { ref.current = element; register(element); }}><span className="sr-only">{INTRO_LEAD}</span>{lines.map((line, index) => <span className="intro-lead-line" key={`${index}-${line}`} aria-hidden="true">{line}{index < lines.length - 1 ? " " : ""}</span>)}</span>;
}

function IntroOpening() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flights = useRef<Array<HTMLSpanElement | null>>([]);
  const caption = useRef<HTMLParagraphElement>(null);
  const progressLine = useRef<HTMLSpanElement>(null);
  const action = useRef<HTMLAnchorElement>(null);
  const ink = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = track.current, viewport = stage.current;
    if (!root || !viewport) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const starts = [0, .14, .28, .42, .56, .70];
    const flightDuration = .24;
    let inkSize = "";
    const synchronize = () => {
      frame = 0;
      const bounds = root.getBoundingClientRect();
      const stageBounds = viewport.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const distance = Math.max(1, root.offsetHeight - viewport.offsetHeight - inset);
      const progress = motion.matches ? 1 : Math.max(0, Math.min(1, -bounds.top / distance));
      viewport.dataset.introProgress = progress.toFixed(3);
      flights.current.forEach((element, index) => {
        if (!element) return;
        // Measure the untransformed wrapper: animation cannot alter its destination.
        const target = element.parentElement!.getBoundingClientRect();
        if (index === 0 && ink.current) {
          const style = getComputedStyle(element);
          const signature = `${target.width}/${target.height}/${style.fontSize}/${style.letterSpacing}`;
          if (signature !== inkSize) {
            inkSize = signature;
            const text = ink.current.querySelector("text")!;
            const fontSize = parseFloat(style.fontSize);
            const previousTransform = element.style.transform;
            element.style.transform = "none";
            const baseline = element.querySelector<HTMLElement>(".intro-baseline")!;
            const baselineY = baseline.getBoundingClientRect().top - element.getBoundingClientRect().top;
            element.style.transform = previousTransform;
            ink.current.setAttribute("viewBox", `0 0 ${target.width} ${target.height}`);
            text.setAttribute("y", String(baselineY));
            text.style.fontFamily = style.fontFamily;
            text.style.fontSize = style.fontSize;
            text.style.fontWeight = style.fontWeight;
            text.style.letterSpacing = style.letterSpacing;
            text.style.setProperty("--ink-length", String(fontSize * 4));
          }
        }
        const local = Math.max(0, Math.min(1, (progress - starts[index]) / flightDuration));
        const arrival = local * local * (3 - 2 * local);
        if (index === 5) {
          element.style.transform = "none";
          element.style.opacity = "1";
          element.dataset.arrival = arrival.toFixed(3);
          const lines = element.querySelectorAll<HTMLElement>(".intro-lead-line");
          lines.forEach((line, lineIndex) => {
            const delay = lines.length > 1 ? lineIndex / (lines.length - 1) * .4 : 0;
            const phase = Math.max(0, Math.min(1, (local - delay) / .6));
            const eased = phase * phase * (3 - 2 * phase);
            const travel = target.left + line.offsetLeft + line.offsetWidth * 1.09 + 32;
            line.style.transform = eased === 1 ? "none" : `translateX(${-travel * (1 - eased)}px) scale(${1 + .18 * (1 - eased)})`;
            line.style.opacity = String(eased);
          });
          return;
        }
        const dx = stageBounds.left + stageBounds.width / 2 - (target.left + element.offsetLeft + element.offsetWidth / 2);
        const originY = stageBounds.top + stageBounds.height / 2;
        const dy = originY - (target.top + element.offsetTop + element.offsetHeight / 2);
        const large = index === 0 || index === 3 || index === 4
          ? Math.max(1, Math.min(stageBounds.width * .9 / Math.max(1, target.width), stageBounds.height * .7 / Math.max(1, target.height)))
          : Math.max(2.5, Math.min(28, stageBounds.width / Math.max(1, target.width) * 2.2));
        const scale = 1 + (large - 1) * (1 - arrival);
        element.style.transform = arrival === 1 ? "none" : `translate(${dx * (1 - arrival)}px, ${dy * (1 - arrival)}px) scale(${scale})`;
        element.style.opacity = progress >= starts[index] ? String(Math.min(1, local * 10 + (index === 0 ? 1 : 0))) : "0";
        element.dataset.arrival = arrival.toFixed(3);
      });
      viewport.querySelectorAll<HTMLElement>(".intro-topic-divider").forEach((divider, index) => { divider.style.opacity = progress >= starts[index + 1] + flightDuration ? ".6" : "0"; });
      if (caption.current) caption.current.textContent = progress < starts[1] ? "Ce que l’on ressent." : progress < starts[2] ? "Ce que les soins rendent visible." : progress < starts[3] ? "Ce qui diffère selon les vies." : "Une mesure éclaire. Elle laisse aussi une part hors champ.";
      if (progressLine.current) progressLine.current.style.transform = `scaleX(${progress})`;
      if (action.current) {
        const visible = progress >= .9;
        action.current.style.opacity = String(Math.max(0, Math.min(1, (progress - .9) / .08)));
        action.current.style.visibility = visible ? "visible" : "hidden";
        action.current.tabIndex = visible ? 0 : -1;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(synchronize); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(root);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const root = track.current, viewport = stage.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !viewport || motion.matches || window.scrollY > 4 || (location.hash && location.hash !== "#top")) return;
    let frame = 0, stopped = false, running = false, lastScroll = window.scrollY;
    const stop = () => {
      stopped = true;
      running = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    const timer = window.setTimeout(() => {
      if (stopped || document.hidden || motion.matches || window.scrollY > 4) return;
      running = true;
      const from = window.scrollY;
      const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
      const destination = from + root.getBoundingClientRect().top + root.offsetHeight - viewport.offsetHeight - inset;
      const started = performance.now();
      const advance = (now: number) => {
        if (stopped) return;
        const progress = Math.min(1, (now - started) / 6000);
        const eased = progress * progress;
        lastScroll = from + (destination - from) * eased;
        window.scrollTo({ top: lastScroll, behavior: "instant" });
        if (progress < 1) frame = requestAnimationFrame(advance);
        else stop();
      };
      frame = requestAnimationFrame(advance);
    }, 3000);
    const onScroll = () => { if (!running || Math.abs(window.scrollY - lastScroll) > 2) stop(); };
    const interactions = ["wheel", "touchstart", "pointerdown", "pointermove", "keydown", "focusin", "resize"] as const;
    interactions.forEach((event) => window.addEventListener(event, stop, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", stop);
    motion.addEventListener("change", stop);
    return () => {
      stop();
      interactions.forEach((event) => window.removeEventListener(event, stop));
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", stop);
      motion.removeEventListener("change", stop);
    };
  }, []);

  const flight = (text: string, index: number) => <span className="intro-flight-target"><span className="intro-flight" ref={(element) => { flights.current[index] = element; }}>{index === 0 ? <><span className="intro-word-fill">{text}<span className="intro-baseline" aria-hidden="true" /></span><svg className="intro-ink" ref={ink} aria-hidden="true" focusable="false"><text x="0">SANTÉ MENTALE</text></svg></> : text}</span></span>;
  return <section className="intro-scroll-track" id="top" ref={track} aria-labelledby="intro-title">
    <div className="hero meta-hero intro-stage" ref={stage}>
      <div className="hero-copy">
        <p className="overline intro-topics">{flight("Santé mentale", 0)}<span className="intro-topic-divider" aria-hidden="true">·</span>{flight("Recours aux soins", 1)}<span className="intro-topic-divider" aria-hidden="true">·</span>{flight("Inégalités", 2)}</p>
        <h1 id="intro-title">{flight("Quand la souffrance", 3)}{flight("devient visible.", 4)}</h1>
        <div className="intro-lead-target"><IntroLeadLines register={(element) => { flights.current[5] = element; }} /></div>
        <a href="#constats" className="read-data" ref={action}>Comprendre ce que les données révèlent <span>↓</span></a>
      </div>
      <div className="intro-footer"><p ref={caption}>Ce que l’on ressent.</p><a href="#constats">Passer l’introduction ↓</a></div>
      <span className="intro-progress" aria-hidden="true" ref={progressLine} />
    </div>
  </section>;
}

const READING_SECTIONS = [
  { id: "constats", label: "Comprendre" },
  { id: "territoires", label: "Explorer" },
  { id: "methode", label: "Méthode" },
];

function ReadingNavigation() {
  const header = useRef<HTMLElement>(null);
  const [reading, setReading] = useState({ active: -1, progress: 0 });
  useEffect(() => {
    let frame = 0;
    let previousScroll = window.scrollY;
    const synchronize = () => {
      frame = 0;
      const readingLine = (header.current?.getBoundingClientRect().bottom ?? 60) + 17;
      const scrolled = window.scrollY !== previousScroll;
      previousScroll = window.scrollY;
      const observations = document.getElementById("constats");
      let active = -1, progress = 0;
      READING_SECTIONS.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const next = document.getElementById(READING_SECTIONS[index + 1]?.id ?? "");
        const end = next?.getBoundingClientRect().top ?? bounds.bottom;
        if (bounds.top <= readingLine && end > readingLine) {
          active = index;
          progress = Math.round(Math.max(0, Math.min(1, (readingLine - bounds.top) / Math.max(1, end - bounds.top))) * 1000) / 1000;
        }
      });
      if (scrolled && observations) {
        const inIntro = observations.getBoundingClientRect().top > readingLine;
        const hash = inIntro ? "" : `#${READING_SECTIONS[active >= 0 ? active : READING_SECTIONS.length - 1].id}`;
        if (window.location.hash !== hash) {
          window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + hash);
        }
      }
      setReading((current) => current.active === active && current.progress === progress ? current : { active, progress });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(synchronize); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    if (header.current) observer.observe(header.current);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return <header className="topbar" ref={header}>
    <a href="#top" className="brand">ODISSÉ <span>DATAVIZ 2026</span></a>
    <nav aria-label="Rubriques et progression de lecture">{READING_SECTIONS.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={reading.active === index ? "location" : undefined} data-progress={reading.active === index ? reading.progress : 0} style={{ "--section-progress": reading.active === index ? reading.progress : 0 } as CSSProperties}><span className="nav-chapter" aria-hidden="true">0{index + 1}</span>{section.label}<span className="nav-reading-progress" aria-hidden="true" /></a>)}</nav>
    <a href="tel:3114" className="top-help">Besoin d’aide ? 3114</a>
  </header>;
}

export default function Experience({ initialData: data }: { initialData: ExperienceData }) {
  const entrance = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = entrance.current;
    if (!root) return;
    root.classList.add("entrance-pending");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => root.classList.remove("entrance-pending");
    const startScroll = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - startScroll) > 4) finish(); };
    const onMotion = () => { if (motion.matches) finish(); };
    if (motion.matches || window.scrollY > 4 || (window.location.hash && window.location.hash !== "#top")) finish();
    const timer = window.setTimeout(finish, 1700);
    window.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("focusin", finish);
    motion.addEventListener("change", onMotion);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("focusin", finish);
      motion.removeEventListener("change", onMotion);
    };
  }, []);
  const [guidedView, setGuidedView] = useState<GuidedView | null>(null);
  const explore = (view: "declared" | "profiles") => {
    setGuidedView((previous) => ({ view, revision: (previous?.revision ?? 0) + 1 }));
  };
  return <main ref={entrance} className="experience entrance-pending">
    <a className="skip-link" href="#constats">Aller aux observations</a>
    <ReadingNavigation />
    <IntroOpening />
    <GuidedOpening data={data} onExplore={explore} />
    <TerritoryAppendix data={data} guidedView={guidedView} />
    {/* Modules éditoriaux conservés pour une réactivation ultérieure :
        <NationalSignal data={data} />
        <TrajectoryMatrix data={data} />
        <BreakSection data={data} />
        <Decomposition data={data} />
        <SocialSection data={data} />
    */}
    <MethodSection data={data} />
    <section className="help"><div><p className="chapter">DERRIÈRE LES DONNÉES, DES PERSONNES</p><h2>Besoin d’aide pour vous<br />ou pour un proche&nbsp;?</h2></div><div className="help-links"><a href="tel:3114"><span>Numéro national de prévention du suicide</span><strong>31 14</strong><small>Gratuit · 24 h / 24 · 7 j / 7</small></a><a href="https://www.santementale-info-service.fr/" target="_blank" rel="noreferrer"><span>Informer, prévenir, orienter</span><b>Santé mentale<br />Info Service ↗</b></a></div></section>
    <footer><div><strong>Quand la souffrance devient visible.</strong><p>Une proposition pour l’Odissé Dataviz Challenge 2026.</p></div><div><span>SOURCE PRINCIPALE</span><a href="https://odisse.santepubliquefrance.fr/" target="_blank" rel="noreferrer">Odissé — Santé publique France ↗</a></div><a href="#top">Retour en haut ↑</a></footer>
  </main>;
}
