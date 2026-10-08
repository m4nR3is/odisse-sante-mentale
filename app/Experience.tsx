import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

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
const FOCUS_AGES = ["11–14 ans", "15–17 ans", "18–24 ans"];
const FINANCIAL_ORDER = ["Vous êtes à l’aise", "Ça va", "C’est juste, il faut faire attention", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette"];
const FINANCIAL_SHORT: Record<string, string> = { "Vous êtes à l’aise": "À l’aise", "Ça va": "Ça va", "C’est juste, il faut faire attention": "C’est juste", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette": "En difficulté" };
const fmt = (value: number, digits = 1) => value.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${fmt(Math.abs(value), 0)} %`;
const CHART_TRANSITION_MS = 760;
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHLY_GESTURES: Record<"children" | "adults", Record<string, Array<number | null>>> = {
  children: {
    "2023": [1480, 1230, 1600, 1230, 1530, 1350, 910, 900, 1310, 1260, 1660, 1330],
    "2024": [1680, 1460, 1700, 1570, 1840, 1540, 1190, 1120, 1650, 1570, 2030, 1510],
    "2025": [2010, 1600, 1970, 1680, 1960, 1710, 1250, 1200, 1720, 1500, 1850, 1340],
    "2026": [1730, 1440, 1890, 1620, 1800, 1570, 1160, 1150, null, null, null, null],
  },
  adults: {
    "2023": [5360, 4940, 5670, 5420, 5770, 5870, 5620, 5550, 5700, 5400, 5170, 5020],
    "2024": [5410, 5050, 5370, 5510, 5820, 5910, 5890, 5610, 5530, 5810, 5610, 5400],
    "2025": [5590, 5150, 5880, 5860, 6040, 5970, 6310, 5890, 5820, 5860, 5670, 5400],
    "2026": [5550, 5230, 5740, 5560, 5610, 5890, 6160, 6080, null, null, null, null],
  },
};
const HISTORICAL_ALL_WEEKLY = [
  ["2018-07-02", [1530,1510,1590,1480,1430,1390,1420,1400,1410,1470,1470,1510,1420,1430,1520,1400,1310,1410,1450,1420,1540,1520,1460,1290,1210,1250,1300,1360,1370,1400,1490,1370,1320,1320,1410,1520,1440,1450,1440,1440,1410,1440,1460,1440,1430,1450,1470,1440,1490,1530,1540,1540]],
  ["2019-07-01", [1450,1370,1440,1500,1470,1390,1330,1400,1440,1430,1510,1580,1520,1470,1480,1400,1380,1420,1430,1460,1510,1420,1440,1340,1330,1370,1410,1410,1380,1470,1430,1390,1400,1360,1390,1330,1180,1010,960,1050,1120,1190,1220,1230,1210,1230,1320,1330,1280,1350,1420,1420]],
  ["2020-06-29", [1360,1270,1280,1310,1310,1240,1270,1280,1250,1250,1310,1350,1220,1230,1260,1260,1250,1270,1340,1370,1290,1230,1220,1200,1130,1280,1340,1300,1420,1440,1460,1420,1470,1450,1460,1550,1550,1470,1410,1410,1380,1430,1500,1490,1570,1650,1650,1600,1550,1560,1470,1470]],
  ["2021-07-05", [1380,1390,1420,1420,1280,1280,1330,1330,1410,1500,1460,1450,1410,1400,1410,1330,1340,1490,1550,1490,1390,1390,1400,1180,1320,1470,1570,1470,1490,1550,1510,1490,1370]],
] as const;

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
      <div><h2>Une moyenne.<br />Seize trajectoires.</h2><p>Toutes les séries sont affichées sur la même échelle. La hausse nationale n’est ni générale, ni symétrique.</p></div>
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
    <header className="section-heading light"><p className="chapter">02 · ÉPROUVER</p><div><h2>Une bifurcation,<br />pas une date magique.</h2><p>La série longue permet de comparer les valeurs observées avec la prolongation descriptive de la tendance antérieure. Ce repère n’est pas un scénario causal.</p></div></header>
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
  return <section className="decomposition" id="decomposition"><header className="section-heading"><p className="chapter">03 · DÉCOMPOSER</p><div><h2>Plus de patientes.<br />Pas seulement plus de séjours.</h2><p>Deux quantités évoluent, mais pas du tout dans les mêmes proportions. Base 100 en 2019.</p></div></header><div className="indexed-grid">{FOCUS_AGES.map((age) => <IndexedPair key={age} age={age} data={data} />)}</div><div className="legend"><span className="patients">Nombre de patientes</span><span className="stays">Séjours par patiente</span></div></section>;
}

function SocialPanel({ data, indicator }: { data: ExperienceData; indicator: string }) {
  const points = FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === indicator && point.financial === financial)!).filter(Boolean);
  const ratio = points.at(-1)!.estimate / points[0].estimate;
  return <article className="social-panel"><div className="social-panel__head"><h3>{indicator}</h3><strong>× {fmt(ratio, 1)}</strong></div>{points.map((point) => <div className="social-row" key={point.financial}><span>{FINANCIAL_SHORT[point.financial]}</span><div className="social-axis"><i style={{ left: `${point.low / 32 * 100}%`, width: `${(point.high - point.low) / 32 * 100}%` }} /><b style={{ left: `${point.estimate / 32 * 100}%` }} /><em style={{ left: `${point.estimate / 32 * 100}%` }}>{fmt(point.estimate)} %</em></div></div>)}<div className="social-scale"><span>0</span><span>10</span><span>20</span><span>30 %</span></div></article>;
}

function SocialSection({ data }: { data: ExperienceData }) {
  return <section className="social-section" id="social"><header className="section-heading light"><p className="chapter">04 · CHANGER DE MESURE</p><div><h2>Une autre inégalité,<br />mesurée autrement.</h2><p>Dans le Baromètre 2024, trois indicateurs déclarés suivent le même gradient financier. Ils documentent une autre dimension ; ils n’expliquent pas la rupture hospitalière.</p></div></header><div className="social-grid">{["Dépression", "Anxiété", "Pensées suicidaires"].map((indicator) => <SocialPanel key={indicator} indicator={indicator} data={data} />)}</div><p className="source-note light">Estimations et intervalles de confiance à 95 %. Les quatre situations financières restent visibles simultanément. Source : Baromètre de Santé publique France 2024, Odissé.</p></section>;
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

function distributionFrame(target: { department: Department; change: number | null }[], selectedCode: string): DistributionFrame {
  const min = Math.min(0, ...target.map((row) => row.change!));
  const max = Math.max(0, ...target.map((row) => row.change!));
  const scaleX = (value: number) => 20 + (value - min) / Math.max(0.001, max - min) * 680;
  const normalRadius = 4.1;
  const collisionGap = 0.28;
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
  if (selectedNode) selectedNode.radius = 9;
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

function MonthlyWatch() {
  const [audience, setAudience] = useState<"all" | "children" | "adults">("all");
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; value: number; frequency: string } | null>(null);
  const historical = HISTORICAL_ALL_WEEKLY.flatMap(([start, values]) => {
    const startTime = new Date(`${start}T00:00:00Z`).getTime();
    return values.map((value, index) => ({ date: startTime + index * 7 * 86400000, value, label: `semaine du ${new Date(startTime + index * 7 * 86400000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`, frequency: "hebdomadaire" }));
  });
  const monthly = Object.keys(MONTHLY_GESTURES.children).flatMap((year) => MONTHLY_GESTURES.children[year].map((childValue, monthIndex) => {
    const adultValue = MONTHLY_GESTURES.adults[year][monthIndex];
    const value = audience === "all" ? childValue != null && adultValue != null ? childValue + adultValue : null : MONTHLY_GESTURES[audience][year][monthIndex];
    return { date: Date.UTC(Number(year), monthIndex, 1), value, label: `${MONTHS[monthIndex]} ${year}`, frequency: "mensuelle" };
  })).filter((point): point is { date: number; value: number; label: string; frequency: string } => point.value != null);
  const timeline = audience === "all" ? [...historical, ...monthly] : monthly;
  const values = timeline.map((point) => point.value);
  const min = Math.floor(Math.min(...values) / 500) * 500;
  const max = Math.ceil(Math.max(...values) / 500) * 500;
  const startDate = audience === "all" ? Date.UTC(2018, 6, 1) : Date.UTC(2023, 0, 1);
  const endDate = Date.UTC(2026, 7, 1);
  const x = (date: number) => 42 + (date - startDate) / (endDate - startDate) * 638;
  const y = (value: number) => 226 - (value - min) / Math.max(1, max - min) * 178;
  const makePath = (points: typeof timeline) => points.map((point, index) => `${index ? "L" : "M"}${x(point.date)},${y(point.value)}`).join(" ");
  const segments = audience === "all" ? [historical, monthly] : [monthly];
  const latest = monthly.at(-1)!.value;
  const years = Array.from({ length: 2027 - (audience === "all" ? 2019 : 2023) }, (_, index) => (audience === "all" ? 2019 : 2023) + index);
  return <div className="monthly-watch">
    <div className="monthly-watch-head"><div><p className="chapter">CHRONOLOGIE · OSCOUR®</p><h3>Passages aux urgences<br />pour geste suicidaire</h3><p>France entière · {audience === "all" ? "hebdomadaire 2018–2022, mensuel depuis 2023" : "mensuel depuis 2023"}</p></div><div className="monthly-audience" role="group" aria-label="Population affichée"><button type="button" aria-pressed={audience === "all"} onClick={() => setAudience("all")}>Tous âges</button><button type="button" aria-pressed={audience === "children"} onClick={() => setAudience("children")}>0–17 ans</button><button type="button" aria-pressed={audience === "adults"} onClick={() => setAudience("adults")}>18 ans et plus</button></div><div className="monthly-latest"><strong>{latest.toLocaleString("fr-FR")}</strong><span>passages en août 2026<br />valeur approchée</span></div></div>
    <div className="monthly-chart"><svg viewBox="0 0 720 260" role="img" aria-label="Chronologie des passages aux urgences pour geste suicidaire">{[min, (min + max) / 2, max].map((tick) => <g className="monthly-grid" key={tick}><line x1="42" x2="680" y1={y(tick)} y2={y(tick)} /><text x="38" y={y(tick) + 3} textAnchor="end">{tick.toLocaleString("fr-FR")}</text></g>)}{years.map((year) => <g key={year}><line className="monthly-year-marker" x1={x(Date.UTC(year, 0, 1))} x2={x(Date.UTC(year, 0, 1))} y1="42" y2="232" /><text className="monthly-year" x={x(Date.UTC(year, 0, 1))} y="252" textAnchor="middle">{year}</text></g>)}{audience === "all" && <line className="frequency-break" x1={x(Date.UTC(2023, 0, 1))} x2={x(Date.UTC(2023, 0, 1))} y1="32" y2="232" />}<g className="monthly-series continuous">{segments.map((segment, index) => <path key={index} d={makePath(segment)} />)}{timeline.map((point) => <circle key={`${point.date}-${point.frequency}`} cx={x(point.date)} cy={y(point.value)} r={point.frequency === "hebdomadaire" ? "2.1" : "3.2"} tabIndex={0} onPointerMove={(event) => setHovered({ x: event.clientX, y: event.clientY, label: point.label, value: point.value, frequency: point.frequency })} onPointerLeave={() => setHovered(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHovered({ x: bounds.left + bounds.width / 2, y: bounds.top, label: point.label, value: point.value, frequency: point.frequency }); }} onBlur={() => setHovered(null)}><title>{point.label} : environ {point.value.toLocaleString("fr-FR")} passages</title></circle>)}</g></svg>{hovered && <ViewportTooltip x={hovered.x} y={hovered.y}><span>{hovered.label}</span><small>Point {hovered.frequency} · valeur approchée</small><strong>≈ {hovered.value.toLocaleString("fr-FR")}</strong></ViewportTooltip>}</div>
    <p className="monthly-method"><b>Rupture de lecture en 2023.</b> Les points 2018–février 2022 sont hebdomadaires et la série publique suivante reprend mensuellement en 2023 ; l’absence de trait entre les deux matérialise les mois non documentés. Valeurs arrondies à la dizaine, numérisées depuis les bulletins officiels de Santé publique France.</p>
  </div>;
}

function SocialDeclaredView({ data }: { data: ExperienceData }) {
  const indicators = ["Dépression", "Anxiété", "Pensées suicidaires"];
  const [indicator, setIndicator] = useState(indicators[0]);
  const points = FINANCIAL_ORDER.map((financial) => data.social.find((point) => point.indicator === indicator && point.financial === financial)).filter((point): point is SocialPoint => Boolean(point));
  const max = Math.max(32, ...points.map((point) => point.high));
  const first = points[0], last = points.at(-1);
  const ratio = first && last ? last.estimate / first.estimate : 0;
  const x = (value: number) => 118 + value / max * 562;
  return <div className="declared-explorer">
    <div className="declared-head">
      <p className="chapter">DÉCLARÉ · BAROMÈTRE 2024</p>
      <h3>La souffrance n’apparaît pas<br />d’abord à l’hôpital.</h3>
      <p>Prévalence déclarée en France selon la situation financière. Cette vue décrit un gradient social national ; elle ne permet ni de suivre une trajectoire individuelle ni de comparer les départements.</p>
      <div className="declared-indicators" role="group" aria-label="Indicateur déclaré">
        {indicators.map((item) => <button type="button" key={item} aria-pressed={indicator === item} onClick={() => setIndicator(item)}>{item}</button>)}
      </div>
      {first && last && <div className="declared-ratio"><strong>× {fmt(ratio, 1)}</strong><span>entre les personnes « à l’aise » et celles en difficulté financière</span></div>}
    </div>
    <div className="declared-chart">
      <p><b>{indicator}</b><span>estimation et intervalle de confiance à 95 %</span></p>
      <svg viewBox="0 0 720 260" role="img" aria-label={`${indicator} selon la situation financière en 2024`}>
        {[0, 10, 20, 30].filter((tick) => tick <= max).map((tick) => <g className="declared-grid" key={tick}><line x1={x(tick)} x2={x(tick)} y1="24" y2="220" /><text x={x(tick)} y="244" textAnchor="middle">{tick} %</text></g>)}
        {points.map((point, index) => { const cy = 48 + index * 52; return <g className="declared-row" key={point.financial}><text x="4" y={cy + 4}>{FINANCIAL_SHORT[point.financial]}</text><line x1={x(point.low)} x2={x(point.high)} y1={cy} y2={cy} /><circle cx={x(point.estimate)} cy={cy} r="6"><title>{FINANCIAL_SHORT[point.financial]} : {fmt(point.estimate)} % (IC 95 % : {fmt(point.low)}–{fmt(point.high)} %)</title></circle><text className="declared-value" x={Math.min(692, x(point.estimate) + 12)} y={cy + 4}>{fmt(point.estimate)} %</text></g>; })}
      </svg>
      <div className="declared-caution"><b>Pont avec les inégalités sociales</b><span>Une association observée, pas une explication causale des hospitalisations, urgences ou décès.</span></div>
    </div>
    <p className="monthly-method"><b>Lecture.</b> Il s’agit de données déclaratives issues d’une enquête nationale. Elles rendent visible une souffrance qui ne se confond pas avec le recours aux soins. Source : Baromètre de Santé publique France 2024, Odissé.</p>
  </div>;
}

function HistoricalDeclaredView({ data }: { data: ExperienceData }) {
  const indicators = ["Dépression", "Pensées suicidaires", "Tentatives de suicide"];
  const sexes = ["Hommes et Femmes", "Femmes", "Hommes"];
  const [indicator, setIndicator] = useState(indicators[0]);
  const [sex, setSex] = useState(sexes[0]);
  const [territoryCode, setTerritoryCode] = useState("53");
  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; year: number; estimate: number; low: number; high: number } | null>(null);
  const available = data.declaredHistory.filter((point) => point.indicator === indicator && point.sex === sex);
  const territories = [...new Map(available.filter((point) => point.territoryCode !== "FR").map((point) => [point.territoryCode, point.territory])).entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const selectedCode = territories.some(([code]) => code === territoryCode) ? territoryCode : territories[0]?.[0];
  const selectedName = territories.find(([code]) => code === selectedCode)?.[1] ?? "Région";
  const selected = available.filter((point) => point.territoryCode === selectedCode).sort((a, b) => a.year - b.year);
  const france = available.filter((point) => point.territoryCode === "FR").sort((a, b) => a.year - b.year);
  const regionChanges = territories.map(([code, name]) => {
    const series = available.filter((point) => point.territoryCode === code).sort((a, b) => a.year - b.year);
    const first = series.find((point) => point.year === 2005), last = series.find((point) => point.year === 2021);
    return first && last ? { code, name, change: last.estimate - first.estimate } : null;
  }).filter((point): point is { code: string; name: string; change: number } => Boolean(point)).sort((a, b) => a.change - b.change);
  const first = selected[0], last = selected.at(-1);
  const franceLast = france.at(-1);
  const change = first && last ? last.estimate - first.estimate : 0;
  const gap = last && franceLast ? last.estimate - franceLast.estimate : 0;
  const maxValue = Math.max(1, ...selected.map((point) => point.high), ...france.map((point) => point.high)) * 1.18;
  const x = (year: number) => 50 + (year - 2005) / 16 * 620;
  const y = (value: number) => 218 - value / maxValue * 176;
  const distributionMin = Math.min(0, ...regionChanges.map((point) => point.change));
  const distributionMax = Math.max(0, ...regionChanges.map((point) => point.change));
  const distributionX = (value: number) => 28 + (value - distributionMin) / Math.max(.01, distributionMax - distributionMin) * 664;
  const showTooltip = (event: ReactPointerEvent<SVGGElement>, point: DeclaredHistoryPoint, label: string) => setHovered({ x: event.clientX, y: event.clientY, label, year: point.year, estimate: point.estimate, low: point.low, high: point.high });
  return <div className="declared-history">
    <div className="declared-history-controls">
      <label>Indicateur<select value={indicator} onChange={(event) => setIndicator(event.target.value)}>{indicators.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Région<select value={selectedCode} onChange={(event) => setTerritoryCode(event.target.value)}>{territories.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></label>
      <label>Sexe<select value={sex} onChange={(event) => setSex(event.target.value)}>{sexes.map((item) => <option key={item}>{item === "Hommes et Femmes" ? "Tous les sexes" : item}</option>)}</select></label>
      <div className="declared-history-kpi"><strong>{change >= 0 ? "+" : "−"}{fmt(Math.abs(change), 1)} pt</strong><span>évolution déclarée · 2005 → 2021</span><p className={gap > 0 ? "is-positive" : ""}>{gap >= 0 ? "+" : "−"}{fmt(Math.abs(gap), 1)} pt par rapport à la France en 2021</p></div>
    </div>
    <div className="declared-history-chart"><h3>{selectedName}</h3><p>{indicator} · {sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()} · prévalence déclarée</p><svg viewBox="0 0 720 270" role="img" aria-label={`${indicator} en ${selectedName} et en France de 2005 à 2021`}>
      {[0, maxValue / 2, maxValue].map((tick) => <g className="declared-history-grid" key={tick}><line x1="50" x2="670" y1={y(tick)} y2={y(tick)} /><text x="46" y={y(tick) - 5} textAnchor="end">{fmt(tick, 0)} %</text></g>)}
      <path className="declared-history-france" d={linePath(france, (point) => x(point.year), (point) => y(point.estimate))} />
      <path className="declared-history-region" d={linePath(selected, (point) => x(point.year), (point) => y(point.estimate))} />
      {selected.map((point) => <g className="declared-history-point" key={point.year} tabIndex={0} onPointerMove={(event) => showTooltip(event, point, selectedName)} onPointerLeave={() => setHovered(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHovered({ x: bounds.left + bounds.width / 2, y: bounds.top, label: selectedName, year: point.year, estimate: point.estimate, low: point.low, high: point.high }); }} onBlur={() => setHovered(null)}><line x1={x(point.year)} x2={x(point.year)} y1={y(point.low)} y2={y(point.high)} /><circle cx={x(point.year)} cy={y(point.estimate)} r="5" /></g>)}
      {[2005, 2010, 2017, 2021].map((year) => <text className="declared-history-year" key={year} x={x(year)} y="258" textAnchor="middle">{year}</text>)}
    </svg><div className="legend"><span className="department selected-legend">{selectedName}</span><span className="france">France</span></div>{hovered && <ViewportTooltip x={hovered.x} y={hovered.y}><span>{hovered.label}</span><small>{hovered.year} · IC 95 % {fmt(hovered.low)}–{fmt(hovered.high)} %</small><strong>{fmt(hovered.estimate)} %</strong></ViewportTooltip>}</div>
    <div className="declared-history-distribution"><small>DISTRIBUTION DES ÉVOLUTIONS RÉGIONALES · 2005 → 2021 · EN POINTS</small><svg viewBox="0 0 720 100" role="img" aria-label="Choisir une région dans la distribution de son évolution"><line className="distribution-axis" x1="28" x2="692" y1="54" y2="54" /><line className="zero-marker" x1={distributionX(0)} x2={distributionX(0)} y1="18" y2="86" /><text x={distributionX(0)} y="13" textAnchor="middle">0 pt</text>{regionChanges.map((point, index) => <g key={point.code} className={point.code === selectedCode ? "is-selected" : ""} role="button" tabIndex={0} onClick={() => setTerritoryCode(point.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setTerritoryCode(point.code); }}><circle cx={distributionX(point.change)} cy={46 + index % 3 * 8} r={point.code === selectedCode ? 8 : 5}><title>{point.name} : {point.change >= 0 ? "+" : "−"}{fmt(Math.abs(point.change), 1)} pt</title></circle></g>)}</svg><span>{distributionMin >= 0 ? "+" : "−"}{fmt(Math.abs(distributionMin), 1)} pt</span><span>{distributionMax >= 0 ? "+" : "−"}{fmt(Math.abs(distributionMax), 1)} pt</span></div>
    <p className="monthly-method"><b>Comparabilité.</b> Les quatre vagues utilisent une méthodologie comparable sur les 18–75 ans. Le Baromètre 2024 repose sur un protocole différent et reste volontairement dans l’autre sous-vue. Sources : Baromètres de Santé publique France 2005, 2010, 2017 et 2021, Odissé.</p>
  </div>;
}

function DeclaredExplorer({ data }: { data: ExperienceData }) {
  const [view, setView] = useState<"social" | "history">("social");
  return <div className="declared-shell"><div className="measure-subnav declared-subnav" role="group" aria-label="Lecture des données déclarées"><button type="button" aria-pressed={view === "social"} onClick={() => setView("social")}>Inégalités sociales · 2024</button><button type="button" aria-pressed={view === "history"} onClick={() => setView("history")}>Évolution déclarée · 2005–2021</button></div>{view === "social" ? <SocialDeclaredView data={data} /> : <HistoricalDeclaredView data={data} />}</div>;
}

function useAnimatedDistribution(target: { department: Department; change: number | null }[], selectedCode: string, duration = 650) {
  const [displayed, setDisplayed] = useState(() => distributionFrame(target, selectedCode));
  const current = useRef(displayed);
  useEffect(() => {
    const destination = distributionFrame(target, selectedCode);
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
  }, [duration, selectedCode, target]);
  return displayed;
}

function TerritoryAppendix({ data }: { data: ExperienceData }) {
  const [mode, setMode] = useState<"territories" | "profiles" | "monthly" | "declared">("territories");
  const [territoryDataset, setTerritoryDataset] = useState<"hospitalisations" | "emergency" | "suicides">("hospitalisations");
  const [chartView, setChartView] = useState<"level" | "change">("level");
  const [age, setAge] = useState("Tous");
  const [sex, setSex] = useState("Hommes et Femmes");
  const [profileAge, setProfileAge] = useState("11–14 ans");
  const [profileSex, setProfileSex] = useState("Femmes");
  const territoryConfig = useMemo(() => territoryDataset === "emergency"
    ? { departments: data.emergencyDepartments, national: data.emergencyNational, startYear: 2020, endYear: 2024, label: "Passages aux urgences", shortLabel: "Urgences", unit: "part pour 100 000 passages", description: "Gestes auto-infligés parmi l’activité totale des urgences" }
    : territoryDataset === "suicides"
      ? { departments: data.suicideDepartments, national: data.suicideNational, startYear: 2019, endYear: 2023, label: "Décès par suicide", shortLabel: "Décès", unit: "taux pour 100 000 habitants", description: "Décès enregistrés par suicide" }
      : { departments: data.departments, national: data.national, startYear: 2019, endYear: 2024, label: "Séjours hospitaliers", shortLabel: "Séjours MCO", unit: "taux pour 100 000 habitants", description: "Séjours hospitaliers en MCO pour gestes auto-infligés" }, [data.departments, data.emergencyDepartments, data.emergencyNational, data.national, data.suicideDepartments, data.suicideNational, territoryDataset]);
  const metrics = useMemo(() => territoryConfig.departments.map((department) => {
    const series = department.series.filter((point) => point.age === age && point.sex === sex).sort((a, b) => a.year - b.year);
    const first = series.find((point) => point.year === territoryConfig.startYear), last = series.find((point) => point.year === territoryConfig.endYear);
    const isDeathDataset = territoryDataset === "suicides";
    const change = first && last && (isDeathDataset || (first.rate > 0 && last.rate > 0)) ? (isDeathDataset ? last.rate - first.rate : 100 * (last.rate / first.rate - 1)) : null;
    const comparable = change != null && (!isDeathDataset || ((first?.count ?? 0) >= 10 && (last?.count ?? 0) >= 10));
    return { department, series, change: change != null && Number.isFinite(change) ? change : null, comparable };
  }).filter((row) => row.change != null).sort((a, b) => a.change! - b.change!), [age, sex, territoryConfig.departments, territoryConfig.endYear, territoryConfig.startYear, territoryDataset]);
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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; department: string; region: string; change: number } | null>(null);
  const [chartTooltip, setChartTooltip] = useState<{ x: number; y: number; label: string; year: number; rate: number; count?: number } | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const [chartWidth, setChartWidth] = useState(500);
  const distributionSvgRef = useRef<SVGSVGElement>(null);
  const [distributionWidth, setDistributionWidth] = useState(720);
  useLayoutEffect(() => {
    const element = chartSvgRef.current;
    if (!element) return;
    const updateWidth = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) setChartWidth(260 * bounds.width / bounds.height);
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
      if (bounds.width > 0 && bounds.height > 0) setDistributionWidth(160 * bounds.width / bounds.height);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const selectionMetrics = useMemo(() => mode === "territories" ? metrics : profileMetrics, [metrics, mode, profileMetrics]);
  const activeMetrics = useMemo(() => selectionMetrics.filter((row) => row.comparable), [selectionMetrics]);
  const selectedCode = mode === "territories" ? code : `${profileAge}|${profileSex}`;
  const selected = selectionMetrics.find((row) => row.department.code === selectedCode) ?? selectionMetrics[0];
  const hoveredMetric = hoveredCode && hoveredCode !== selected.department.code ? activeMetrics.find((row) => row.department.code === hoveredCode) : null;
  const reference = useMemo(() => mode === "territories"
    ? territoryConfig.national.filter((point) => point.age === age && point.sex === sex)
    : data.odissePatients.filter((point) => point.age === "Tous" && point.sex === "Hommes et Femmes").sort((a, b) => a.year - b.year), [age, data.odissePatients, mode, sex, territoryConfig.national]);
  const startYear = mode === "territories" ? territoryConfig.startYear : 2019;
  const endYear = mode === "territories" ? territoryConfig.endYear : 2024;
  const chartSeries = useMemo(() => chartView === "level" ? selected.series : indexedSeries(selected.series, startYear), [chartView, selected.series, startYear]);
  const chartReference: { year: number; rate: number }[] = useMemo(() => chartView === "level" ? reference : indexedSeries(reference as { year: number; rate: number }[], startYear), [chartView, reference, startYear]);
  const chartHoveredSeries = useMemo(() => hoveredMetric ? (chartView === "level" ? hoveredMetric.series : indexedSeries(hoveredMetric.series, startYear)) : null, [chartView, hoveredMetric, startYear]);
  const referenceFirst = reference.find((point) => point.year === startYear);
  const referenceLast = reference.find((point) => point.year === endYear);
  const selectedLast = selected.series.find((point) => point.year === endYear);
  const hasNationalReference = Boolean(referenceFirst && referenceLast && referenceFirst.rate > 0 && referenceLast.rate > 0);
  const usesAbsoluteChange = mode === "territories" && territoryDataset === "suicides";
  const nationalChange = hasNationalReference ? (usesAbsoluteChange ? referenceLast!.rate - referenceFirst!.rate : 100 * (referenceLast!.rate / referenceFirst!.rate - 1)) : 0;
  const levelGap = hasNationalReference && selectedLast ? (usesAbsoluteChange ? selectedLast.rate - referenceLast!.rate : 100 * (selectedLast.rate / referenceLast!.rate - 1)) : 0;
  const animatedChange = useAnimatedNumber(selected.change!);
  const animatedNationalChange = useAnimatedNumber(nationalChange);
  const animatedLevelGap = useAnimatedNumber(levelGap);
  const animatedSeries = useAnimatedSeries(chartSeries);
  const animatedReference = useAnimatedSeries(chartReference);
  const animatedDistribution = useAnimatedDistribution(activeMetrics, selectedCode);
  const targetMaxRate = useMemo(() => Math.max(...chartSeries.map((point) => point.rate), ...chartReference.map((point) => point.rate)) * 1.12, [chartReference, chartSeries]);
  const axisScale = useAnimatedAxisScale(targetMaxRate);
  const maxRate = axisScale.domainMax;
  const x = (point: { year: number }) => 4 + ((point.year - startYear) / Math.max(1, endYear - startYear)) * (chartWidth - 8);
  const y = (point: { rate: number }) => 218 - point.rate / maxRate * 180;
  const { min, max, increaseShare } = animatedDistribution;
  const distributionX = (value: number) => 20 + (value - min) / Math.max(0.001, max - min) * (distributionWidth - 40);
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
  const switchMode = (nextMode: "territories" | "profiles" | "monthly" | "declared") => {
    setTooltip(null);
    setChartTooltip(null);
    setHoveredCode(null);
    setMode(nextMode);
  };
  const switchTerritoryDataset = (dataset: "hospitalisations" | "emergency" | "suicides") => {
    setTooltip(null);
    setChartTooltip(null);
    setHoveredCode(null);
    setTerritoryDataset(dataset);
    if (dataset === "suicides") setChartView("level");
    setMode("territories");
  };
  const chooseMeasureFamily = (family: "declared" | "emergency" | "hospital" | "deaths") => {
    if (family === "declared") switchMode("declared");
    else if (family === "emergency") switchTerritoryDataset("emergency");
    else if (family === "hospital") switchTerritoryDataset("hospitalisations");
    else switchTerritoryDataset("suicides");
  };
  const family = mode === "declared" ? "declared" : mode === "monthly" || (mode === "territories" && territoryDataset === "emergency") ? "emergency" : mode === "profiles" || (mode === "territories" && territoryDataset === "hospitalisations") ? "hospital" : "deaths";
  const title = mode === "territories" ? selected.department.name : `${profileAge} · ${profileSex}`;
  const context = mode === "territories"
    ? `${age === "Tous" ? "Tous les âges" : age} · ${sex === "Hommes et Femmes" ? "Tous les sexes" : sex} · ${chartView === "level" ? territoryConfig.unit : `indice, ${startYear} = 100`}`
    : `France entière · ${profileSex === "Femmes" ? "patientes" : "patients"} hospitalisés · ${chartView === "level" ? "taux pour 100 000" : "indice, 2019 = 100"}`;
  const filterLabels = mode === "territories"
    ? [`${selected.department.code} · ${selected.department.name}`, age === "Tous" ? "Tous les âges" : age, sex === "Hommes et Femmes" ? "Tous les sexes" : sex]
    : [profileAge, profileSex];
  const filterWidth = `${Math.max(...filterLabels.map((label) => Array.from(label).length)) + 5}ch`;
  const chartYears = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  return <section className="territory-appendix" id="territoires">
    <header className="section-heading"><p className="chapter data-change" key={`chapter-${mode}-${territoryDataset}`}>{mode === "declared" ? "EXPLORER · SOUFFRANCE DÉCLARÉE" : mode === "territories" ? `EXPLORER · ${territoryConfig.shortLabel.toUpperCase()}` : mode === "monthly" ? "EXPLORER · URGENCES DANS LE TEMPS" : "EXPLORER · PATIENTS"}</p><div className="data-change" key={`heading-${mode}-${territoryDataset}`}>{mode === "declared" ? <><h2>Quand la souffrance<br />devient-elle visible&nbsp;?</h2><p>Avant le soin, les enquêtes documentent une expérience déclarée. La situation financière ouvre ici un pont explicite avec les inégalités sociales de santé.</p></> : mode === "territories" ? <><h2>Explorer sans classer<br />les territoires.</h2><p>{territoryConfig.description}. Chaque mesure conserve son propre dénominateur et ne représente ni toute la souffrance psychique ni un classement des territoires.</p></> : mode === "monthly" ? <><h2>Voir les saisons.<br />Sans inventer la précision.</h2><p>La surveillance OSCOUR® révèle les variations mensuelles des passages aux urgences. Les valeurs présentées sont numérisées et arrondies à partir du bulletin officiel.</p></> : <><h2>Une moyenne.<br />Seize trajectoires.</h2><p>La moyenne nationale masque des évolutions très différentes selon l’âge et le sexe. Les seize profils sont comparés sur une même échelle pour rendre visibles les bifurcations.</p></>}</div></header>
    <div className="territory-lab" id="territory-explorer">
      <div className="explorer-navigation"><div className="explorer-mode data-types" role="tablist" aria-label="Niveau de visibilité de la souffrance psychique"><button type="button" role="tab" aria-selected={family === "declared"} onClick={() => chooseMeasureFamily("declared")}>Déclaré <span>Enquête · expérience rapportée</span></button><button type="button" role="tab" aria-selected={family === "emergency"} onClick={() => chooseMeasureFamily("emergency")}>Urgences <span>Recours aigu · OSCOUR®</span></button><button type="button" role="tab" aria-selected={family === "hospital"} onClick={() => chooseMeasureFamily("hospital")}>Hôpital <span>Patients et séjours · MCO</span></button><button type="button" role="tab" aria-selected={family === "deaths"} onClick={() => chooseMeasureFamily("deaths")}>Décès <span>Suicides enregistrés</span></button></div>
      {family === "emergency" && <div className="measure-subnav" role="group" aria-label="Vue des urgences"><button type="button" aria-pressed={mode === "territories"} onClick={() => switchTerritoryDataset("emergency")}>Territoires · annuel</button><button type="button" aria-pressed={mode === "monthly"} onClick={() => switchMode("monthly")}>Chronologie · semaine / mois</button></div>}
      {family === "hospital" && <div className="measure-subnav" role="group" aria-label="Vue hospitalière"><button type="button" aria-pressed={mode === "territories"} onClick={() => switchTerritoryDataset("hospitalisations")}>Séjours · départements</button><button type="button" aria-pressed={mode === "profiles"} onClick={() => switchMode("profiles")}>Patients · âge × sexe</button></div>}</div>
      {mode === "declared" ? <DeclaredExplorer data={data} /> : mode === "monthly" ? <MonthlyWatch /> : <><div className="territory-selector" style={{ "--filter-width": filterWidth } as CSSProperties}><div className="territory-filters">{mode === "territories" && <label htmlFor="department">Département<select id="department" value={selected.department.code} onChange={(event) => setCode(event.target.value)}>{departmentOptions.map((row) => <option key={row.department.code} value={row.department.code}>{row.department.code} · {row.department.name}</option>)}</select></label>}<label htmlFor="territory-age">Tranche d’âge<select id="territory-age" value={mode === "territories" ? age : profileAge} onChange={(event) => mode === "territories" ? setAge(event.target.value) : setProfileAge(event.target.value)}>{(mode === "territories" ? TERRITORY_AGES : ODISSE_AGES).map((item) => <option key={item} value={item}>{item === "Tous" ? "Tous les âges" : item}</option>)}</select></label><label htmlFor="territory-sex">Sexe<select id="territory-sex" value={mode === "territories" ? sex : profileSex} onChange={(event) => mode === "territories" ? setSex(event.target.value) : setProfileSex(event.target.value)}>{(mode === "territories" ? TERRITORY_SEXES : ["Femmes", "Hommes"]).map((item) => <option key={item} value={item}>{item === "Hommes et Femmes" ? "Tous les sexes" : item}</option>)}</select></label></div>{selected.comparable ? <><strong className="animated-number" aria-hidden="true">{formatEvolution(animatedChange)}</strong><span>{usesAbsoluteChange ? "écart de taux pour 100 000" : `évolution ${mode === "territories" ? "du département" : "du profil"}`} · {startYear} → {endYear}</span></> : <div className="low-sample"><strong>Effectif faible</strong><span>Évolution non interprétable · courbe affichée à titre descriptif</span></div>}{mode === "territories" && (hasNationalReference ? <p className={`relative-level ${Math.abs(animatedLevelGap) < .05 ? "is-neutral" : animatedLevelGap > 0 ? "is-positive" : "is-negative"}`}>{Math.abs(animatedLevelGap) < .05 ? <>Au niveau de la France en {endYear}</> : <><b>{formatEvolution(animatedLevelGap)}</b> {usesAbsoluteChange ? "point de taux pour 100 000" : ""} par rapport à la France en {endYear}</>}</p> : <p className="relative-level is-neutral">Référence nationale indisponible pour ce regroupement</p>)}<span className="sr-only" aria-live="polite">{title}, évolution {formatEvolution(selected.change!)}</span></div>
      <div className="territory-chart"><h3 className="data-change" key={`${mode}-${selected.department.code}`}>{title}</h3><p className="territory-context">{context}</p>{!usesAbsoluteChange && <div className="chart-view-toggle" role="group" aria-label="Mesure affichée"><button type="button" aria-pressed={chartView === "level"} onClick={() => setChartView("level")}>Niveau</button><button type="button" aria-pressed={chartView === "change"} onClick={() => setChartView("change")}>Évolution · base 100</button></div>}<svg ref={chartSvgRef} viewBox={`0 0 ${chartWidth} 260`} role="img" aria-label={`${title}, ${chartView === "level" ? "taux réel" : "évolution en base 100"}, comparé à la référence nationale`}><g className="chart-grid chart-grid-old" opacity={1 - axisScale.progress}>{[axisScale.previousMax / 2, axisScale.previousMax].map((tick, index) => <g key={`old-${index}`}><line x1="4" x2={chartWidth - 4} y1={y({ rate: tick })} y2={y({ rate: tick })} /><text x="4" y={y({ rate: tick }) - 5}>{fmt(tick, 0)}</text></g>)}</g><g className="chart-grid chart-grid-new" opacity={axisScale.progress}>{[targetMaxRate / 2, targetMaxRate].map((tick, index) => <g key={`new-${index}`}><line x1="4" x2={chartWidth - 4} y1={y({ rate: tick })} y2={y({ rate: tick })} /><text x="4" y={y({ rate: tick }) - 5}>{fmt(tick, 0)}</text></g>)}</g><g className="chart-grid chart-grid-zero"><line x1="4" x2={chartWidth - 4} y1={y({ rate: 0 })} y2={y({ rate: 0 })} /><text x="4" y={y({ rate: 0 }) - 5}>0</text></g>{chartView === "change" && <line className="index-baseline" x1="4" x2={chartWidth - 4} y1={y({ rate: 100 })} y2={y({ rate: 100 })} />}<path className="national-line" d={linePath(animatedReference, x, y)} />{chartHoveredSeries && <path key={`${hoveredMetric?.department.code}-${chartView}`} className="hover-line" d={linePath(chartHoveredSeries, x, y)} aria-hidden="true" />}<path className="department-line" d={linePath(animatedSeries, x, y)} />{animatedSeries.map((point) => {
        const targetValue = chartSeries.find((candidate) => candidate.year === point.year)?.rate ?? point.rate;
        const targetPoint = selected.series.find((candidate) => candidate.year === point.year);
        const pointTooltip = { label: selected.department.name, year: point.year, rate: targetValue, count: targetPoint && "count" in targetPoint ? targetPoint.count : undefined };
        const unit = chartView === "level" ? (mode === "territories" ? territoryConfig.unit : "taux pour 100 000") : `indice · ${startYear} = 100`;
        return <g key={point.year} className="chart-point" role="img" tabIndex={0} aria-label={`${selected.department.name}, ${point.year}, ${fmt(targetValue)}, ${unit}`} onPointerMove={(event) => setChartTooltip({ x: event.clientX, y: event.clientY, ...pointTooltip })} onPointerLeave={() => setChartTooltip(null)} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setChartTooltip({ x: bounds.left + bounds.width / 2, y: bounds.top, ...pointTooltip }); }} onBlur={() => setChartTooltip(null)}><circle className="chart-hit" cx={x(point)} cy={y(point)} r="11" /><circle className="chart-dot" cx={x(point)} cy={y(point)} r="3" /></g>;
      })}{chartYears.map((year) => <text key={year} x={x({ year })} y="250" textAnchor={year === startYear ? "start" : year === endYear ? "end" : "middle"}>{year}</text>)}</svg><div className="legend"><span className="department selected-legend" title={selected.department.name}>{selected.department.name}</span><span className="france">{mode === "territories" ? "France" : "Tous âges · tous sexes"}</span><span className={`hovered hovered-slot${hoveredMetric ? "" : " is-empty"}`} title={hoveredMetric?.department.name}>{hoveredMetric?.department.name ?? "Aperçu au survol"}</span></div>{chartTooltip && <ViewportTooltip x={chartTooltip.x} y={chartTooltip.y} className="chart-tooltip"><span>{chartTooltip.label}</span><small>{chartTooltip.year} · {chartView === "level" ? (mode === "territories" ? territoryConfig.unit : "taux pour 100 000") : "indice base 100"}{chartTooltip.count != null ? ` · effectif ≈ ${fmt(chartTooltip.count, 1)}` : ""}</small><strong>{fmt(chartTooltip.rate)}</strong></ViewportTooltip>}</div>
      <div className="distribution"><small className="distribution-kicker">Distribution des {usesAbsoluteChange ? "écarts de taux" : "évolutions"} · {startYear} → {endYear}</small>{activeMetrics.length ? <p><b>{fmt(increaseShare)} %</b> {mode === "territories" ? `des ${activeMetrics.length} départements comparables augmentent pour cette sélection.` : `des ${activeMetrics.length} trajectoires âge × sexe augmentent entre ${startYear} et ${endYear}.`}</p> : <p className="no-comparison">Aucun département ne réunit des effectifs suffisants aux deux dates pour une comparaison robuste.</p>}<svg ref={distributionSvgRef} viewBox={`0 0 ${distributionWidth} 160`} aria-label={mode === "territories" ? "Choisir un département dans la distribution de leurs évolutions. La France est indiquée comme second repère lorsqu’elle est comparable." : "Choisir un profil âge et sexe dans la distribution de leurs évolutions."} onPointerMove={moveAcrossDistribution} onPointerLeave={() => { setHoveredCode(null); setTooltip(null); }} onPointerUp={chooseClosestDistributionItem}><rect className="distribution-interaction" x="0" y="0" width={distributionWidth} height="160" /><line className="distribution-axis" x1="20" x2={distributionWidth - 20} y1="80" y2="80" /><line className="zero-marker" x1={distributionX(0)} x2={distributionX(0)} y1="24" y2="140" /><text className="zero-label" x={distributionX(0)} y="17" textAnchor="middle">0{evolutionUnit || " %"}</text>{mode === "territories" && hasNationalReference && <><line className="national-marker" x1={nationalMarkerX} x2={nationalMarkerX} y1="35" y2="140" /><text className="national-marker-label" x={nationalMarkerX} y="29" textAnchor="middle">France {formatEvolution(animatedNationalChange)}{evolutionUnit}</text></>}{[...animatedDistribution.rows].sort((a, b) => a.department.code === selected.department.code ? 1 : b.department.code === selected.department.code ? -1 : 0).map((row) => {
        const isSelected = row.department.code === selected.department.code;
        const selectItem = () => selectDistributionItem(row.department.code);
        const tooltipData = { department: row.department.name, region: row.department.region, change: row.targetChange };
        return <g key={row.department.code} className={`distribution-point${isSelected ? " selected" : ""}${hoveredCode === row.department.code ? " is-hovered" : ""}`} role="button" tabIndex={0} aria-label={`${row.department.name}, ${row.department.region}, évolution ${formatEvolution(row.targetChange)}${evolutionUnit}. Sélectionner.`} onFocus={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHoveredCode(row.department.code); setTooltip({ x: bounds.left + bounds.width / 2, y: bounds.top, ...tooltipData }); }} onBlur={() => { setHoveredCode(null); setTooltip(null); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectItem(); } }}><circle className="distribution-dot" cx={distributionX(row.change)} cy={row.y} r={row.radius}><title>{row.department.name} · {row.department.region} : {formatEvolution(row.targetChange)}{evolutionUnit}</title></circle></g>;
      })}</svg>{tooltip && <ViewportTooltip x={tooltip.x} y={tooltip.y}><span>{tooltip.department}</span><small>{tooltip.region}</small><strong>{formatEvolution(tooltip.change)}{evolutionUnit}</strong></ViewportTooltip>}<span>{formatEvolution(min)}{evolutionUnit}</span><span>{formatEvolution(max)}{evolutionUnit}</span></div></>}
    </div>
    <p className="source-note"><b>Lecture.</b> Chaque bouton ouvre une mesure distincte. Les séjours MCO, les passages aux urgences, les décès par suicide et les patients hospitalisés ne forment pas un entonnoir individuel et n’ont pas tous le même dénominateur. Pour les taux de population, « Tous les âges » utilise le taux standardisé et les classes d’âge le taux brut. Les urgences expriment une part pour 100 000 passages, pas un taux dans la population. Pour les décès, l’évolution est exprimée en points de taux pour 100 000, et non en pourcentage relatif. Un département dont l’effectif est inférieur à 10 à l’une des deux dates reste visible dans la courbe, mais est exclu de la comparaison et de la distribution. Les effectifs diffusés sont arrondis par la source. Source : Odissé, Santé publique France.</p>
  </section>;
}

function MethodSection({ data }: { data: ExperienceData }) {
  return <section className="method" id="methode"><div className="method-title"><p className="chapter">DIRE CE QUE L’ON MESURE</p><h2>Quatre seuils de visibilité.<br />Aucun entonnoir.</h2></div><div className="measure-grid">{[
    ["01", "Déclaré", "Dépression, anxiété, pensées suicidaires", "Une expérience rapportée dans une enquête."],
    ["02", "Urgences", "Passages pour gestes auto-infligés", "Un recours aigu rapporté à l’activité des urgences."],
    ["03", "Hôpital", "Patients et séjours en MCO", "Une prise en charge codée, pas toute la souffrance."],
    ["04", "Décès", "Suicides enregistrés", "Une issue létale documentée séparément."],
  ].map(([number, label, title, copy]) => <article key={number}><span>{number}</span><small>{label}</small><h3>{title}</h3><p>{copy}</p></article>)}</div><div className="catalog-audit"><div><strong>373</strong><span>jeux du catalogue audités</span></div><div><strong>38</strong><span>jeux repérés autour de la santé mentale</span></div><div><strong>14</strong><span>jeux reliés au méta-explorateur</span></div><p>L’interface rapproche les mesures sans les fusionner. Chaque vue conserve sa population, son dénominateur, sa période et son niveau géographique.</p></div><div className="source-ledger"><h3>Les sources mobilisées</h3><ol><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Épisodes dépressifs · Baromètre 2024 ↗</a><span>Déclaré</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/trouble-anxieux-generalise-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Trouble anxieux généralisé · Baromètre 2024 ↗</a><span>Déclaré</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/conduites-sucidaires-indicateurs-du-barometre-2024/" target="_blank" rel="noreferrer">Pensées suicidaires · Baromètre 2024 ↗</a><span>Déclaré</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_reg/" target="_blank" rel="noreferrer">Épisodes dépressifs · 2005–2021 ↗</a><span>Historique</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_reg/" target="_blank" rel="noreferrer">Pensées et tentatives · 2005–2021 ↗</a><span>Historique</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-departement/" target="_blank" rel="noreferrer">Séjours hospitaliers · départements ↗</a><span>Territoires</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-france/" target="_blank" rel="noreferrer">Séjours hospitaliers · France ↗</a><span>Référence</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/" target="_blank" rel="noreferrer">Patients hospitalisés · France ↗</a><span>Âge × sexe</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-departement/" target="_blank" rel="noreferrer">Passages aux urgences · départements ↗</a><span>Territoires</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-france/" target="_blank" rel="noreferrer">Passages aux urgences · France ↗</a><span>Référence</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-departement/" target="_blank" rel="noreferrer">Décès par suicide · départements ↗</a><span>Territoires</span></li><li><a href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-france/" target="_blank" rel="noreferrer">Décès par suicide · France ↗</a><span>Référence</span></li></ol></div><div className="knowledge"><article><b>Comparer</b><p>Niveaux, évolutions et distributions avec une référence nationale explicite.</p></article><article><b>Distinguer</b><p>Déclaré, recours aigu, hospitalisation et décès restent des réalités différentes.</p></article><article><b>Ne pas conclure</b><p>Ces écarts ne démontrent ni une cause unique ni un classement de la souffrance.</p></article></div><p className="generation">Données web régénérées le {data.meta.generated}. Scripts, sources et transformations sont conservés dans le dépôt.</p></section>;
}

export default function Experience({ initialData: data }: { initialData: ExperienceData }) {
  return <main>
    <header className="topbar"><a href="#top" className="brand">ODISSÉ <span>DATAVIZ 2026</span></a><nav><a href="#territoires">Explorer</a><a href="#methode">Méthode</a></nav><a href="tel:3114" className="top-help">Besoin d’aide ? 3114</a></header>
    <section className="hero meta-hero" id="top"><div className="hero-copy"><p className="overline">Santé mentale · recours aux soins · inégalités</p><h1>Quand la souffrance<br />devient visible.</h1><p className="hero-lead">Une enquête, une urgence, une hospitalisation ou un décès ne montrent ni les mêmes personnes ni la même réalité. Un seul module permet de passer de l’expérience déclarée aux formes les plus visibles du recours aux soins, sans les confondre.</p><a href="#territoires" className="read-data">Explorer les seuils de visibilité <span>↓</span></a></div><p className="hero-question">Ce qui n’arrive pas jusqu’au soin reste souvent hors champ.</p></section>
    <TerritoryAppendix data={data} />
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
