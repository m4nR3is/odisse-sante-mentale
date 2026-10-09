import { formatSignedPercent, formatNumber } from "../charts/format";
import { createLinePath } from "../charts/paths";
import {
  type ExperienceData,
  type NationalPoint,
  type SeriesPoint,
} from "../data/experienceTypes";
import {
  ODISSE_AGES,
  FINANCIAL_ORDER,
  FINANCIAL_SHORT,
} from "../data/indicatorDefinitions";
import {
  type GroupAnalysis,
  type ArchivedExperienceData,
} from "./archiveTypes";

const FOCUS_AGES = ["11–14 ans", "15–17 ans", "18–24 ans"];

export function NationalSignal({ data }: { data: ExperienceData }) {
  const series = data.national.filter(
    (point) => point.age === "Tous" && point.sex === "Hommes et Femmes",
  );
  const first = series[0];
  const last = series.at(-1)!;
  const change = (last.rate / first.rate - 1) * 100;
  const x = (_: NationalPoint, index: number) => 24 + index * 58;
  const y = (point: NationalPoint) => 134 - ((point.rate - 108) / 42) * 96;
  return (
    <div className="national-signal">
      <div className="national-signal__head">
        <span>France entière</span>
        <strong>{formatSignedPercent(change)}</strong>
      </div>
      <svg
        viewBox="0 0 340 164"
        role="img"
        aria-label={`Taux standardisé national : ${formatNumber(first.rate)} en ${first.year}, ${formatNumber(last.rate)} en ${last.year}`}
      >
        <line
          x1="24"
          x2="314"
          y1={y({ ...first, rate: 130 })}
          y2={y({ ...first, rate: 130 })}
        />
        <path d={createLinePath(series, x, y)} />
        {series.map((point, index) => (
          <circle key={point.year} cx={x(point, index)} cy={y(point)} r="3">
            <title>
              {point.year} : {formatNumber(point.rate)} pour 100 000
            </title>
          </circle>
        ))}
        <text x="24" y="158">
          2019
        </text>
        <text x="314" y="158" textAnchor="end">
          2024
        </text>
      </svg>
      <p>Taux standardisé de séjours pour 100 000 · Odissé</p>
    </div>
  );
}

function TrajectoryCell({
  values,
  focus,
}: {
  values: SeriesPoint[];
  focus: boolean;
}) {
  const first = values[0];
  const last = values.at(-1)!;
  const change = (last.rate / first.rate - 1) * 100;
  const x = (_: SeriesPoint, index: number) => 6 + index * 37.6;
  const y = (point: SeriesPoint) => 62 - (point.rate / 700) * 54;
  return (
    <div className={`trajectory-cell${focus ? " is-focus" : ""}`}>
      <svg
        viewBox="0 0 206 68"
        role="img"
        aria-label={`${first.sex}, ${first.age} : taux de ${formatNumber(first.rate)} en 2019 à ${formatNumber(last.rate)} en 2024`}
      >
        <line x1="6" x2="194" y1="62" y2="62" />
        <path d={createLinePath(values, x, y)} />
        {values.map((point, index) => (
          <circle
            key={point.year}
            cx={x(point, index)}
            cy={y(point)}
            r={index === values.length - 1 ? 3.2 : 1.8}
          >
            <title>
              {point.year} : {formatNumber(point.rate)}
            </title>
          </circle>
        ))}
      </svg>
      <div>
        <span>
          {formatNumber(first.rate)} → {formatNumber(last.rate)}
        </span>
        <strong>{formatSignedPercent(change)}</strong>
      </div>
    </div>
  );
}

export function TrajectoryMatrix({ data }: { data: ExperienceData }) {
  const get = (age: string, sex: string) =>
    data.odissePatients
      .filter((point) => point.age === age && point.sex === sex)
      .sort((a, b) => a.year - b.year);
  return (
    <section className="matrix-section" id="trajectoires">
      <header className="section-heading">
        <p className="chapter">01 · DÉCOMPOSER</p>
        <div>
          <h2>
            Une moyenne
            <br />
            Seize trajectoires
          </h2>
          <p>
            Toutes les séries sont affichées sur la même échelle. La hausse
            nationale n’est ni générale, ni symétrique.
          </p>
        </div>
      </header>
      <div
        className="matrix"
        role="table"
        aria-label="Évolution des patients hospitalisés par âge et sexe entre 2019 et 2024"
      >
        <div className="matrix-head" role="row">
          <span>Âge</span>
          <span>Femmes · taux pour 100 000</span>
          <span>Hommes · taux pour 100 000</span>
        </div>
        {ODISSE_AGES.map((age) => (
          <div
            className={`matrix-row${FOCUS_AGES.includes(age) ? " is-focus" : ""}`}
            role="row"
            key={age}
          >
            <div className="age-label" role="rowheader">
              <strong>{age}</strong>
              {FOCUS_AGES.includes(age) && <span>signal focal</span>}
            </div>
            <TrajectoryCell
              values={get(age, "Femmes")}
              focus={FOCUS_AGES.includes(age)}
            />
            <TrajectoryCell values={get(age, "Hommes")} focus={false} />
          </div>
        ))}
      </div>
      <p className="source-note">
        <b>Lecture.</b> Entre 2019 et 2024, le taux augmente de 93 % chez les
        filles de 11–14 ans, de 65 % chez les 15–17 ans et de 42 % chez les
        femmes de 18–24 ans. Il recule dans la plupart des groupes plus âgés.
        Source : Odissé, patients hospitalisés en MCO pour gestes auto-infligés.
      </p>
    </section>
  );
}

function BreakChart({
  age,
  analysis,
}: {
  age: string;
  analysis: GroupAnalysis;
}) {
  const values = analysis.series;
  const projection = analysis.counterfactual;
  const x = (year: number) => 34 + ((year - 2012) / 13) * 330;
  const y = (rate: number) => 244 - (rate / 780) * 214;
  const actual = createLinePath(
    values,
    (point) => x(point.year),
    (point) => y(point.rate),
  );
  const fitted2012 =
    projection.expected_rate - projection.pre_slope_per_year * 13;
  const fitted2019 =
    projection.expected_rate - projection.pre_slope_per_year * 6;
  const projected = `M${x(2012)},${y(fitted2012)} L${x(2025)},${y(projection.expected_rate)}`;
  const interval = `${x(2019)},${y(fitted2019)} ${x(2025)},${y(projection.forecast_interval_95_approx[1])} ${x(2025)},${y(projection.forecast_interval_95_approx[0])}`;
  const stability =
    analysis.break_audit.leave_one_year_out[
      String(analysis.break_audit.best_breakpoint)
    ] ?? 0;
  return (
    <article className="break-card">
      <div className="break-card__title">
        <span>Femmes</span>
        <h3>{age}</h3>
      </div>
      <svg
        viewBox="0 0 390 282"
        role="img"
        aria-label={`${age} : ${formatNumber(projection.observed_rate)} observé en 2025 contre ${formatNumber(projection.expected_rate)} selon la projection de la tendance 2012 à 2019`}
      >
        {[0, 200, 400, 600].map((tick) => (
          <g key={tick}>
            <line x1="34" x2="364" y1={y(tick)} y2={y(tick)} />
            <text x="2" y={y(tick) + 4}>
              {tick}
            </text>
          </g>
        ))}
        <rect x={x(2020)} y="30" width={x(2021) - x(2020)} height="214" />
        <polygon points={interval} />
        <path className="projection" d={projected} />
        <path className="observed" d={actual} />
        <circle
          className="observed-dot"
          cx={x(2025)}
          cy={y(projection.observed_rate)}
          r="4"
        />
        <circle
          className="projection-dot"
          cx={x(2025)}
          cy={y(projection.expected_rate)}
          r="4"
        />
        <text x={x(2012)} y="270" textAnchor="middle">
          2012
        </text>
        <text x={x(2019)} y="270" textAnchor="middle">
          2019
        </text>
        <text x={x(2021)} y="270" textAnchor="middle">
          2021
        </text>
        <text x={x(2025)} y="270" textAnchor="middle">
          2025
        </text>
      </svg>
      <div className="break-values">
        <div>
          <strong>{formatNumber(projection.observed_rate)}</strong>
          <span>observé</span>
        </div>
        <div>
          <strong>{formatNumber(projection.expected_rate)}</strong>
          <span>projection</span>
        </div>
        <div>
          <strong>{stability}/14</strong>
          <span>tests → 2021</span>
        </div>
      </div>
    </article>
  );
}

export function BreakSection({ data }: { data: ArchivedExperienceData }) {
  return (
    <section className="break-section" id="rupture">
      <header className="section-heading light">
        <p className="chapter">02 · ÉPROUVER</p>
        <div>
          <h2>
            Une bifurcation,
            <br />
            pas une date magique
          </h2>
          <p>
            La série longue permet de comparer les valeurs observées avec la
            prolongation descriptive de la tendance antérieure. Ce repère n’est
            pas un scénario causal.
          </p>
        </div>
      </header>
      <div className="break-grid">
        {FOCUS_AGES.map((age) => (
          <BreakChart
            key={age}
            age={age}
            analysis={data.storyAnalysis.groups[`Femmes · ${age}`]}
          />
        ))}
      </div>
      <p className="source-note light">
        <b>Méthode.</b> Patientes uniques hospitalisées pour gestes
        auto-infligés, taux pour 100 000. Rupture sélectionnée par AICc et
        testée en retirant successivement chaque année. Source : DREES,
        2012–2025.
      </p>
    </section>
  );
}

function IndexedPair({
  data,
  age,
}: {
  data: ArchivedExperienceData;
  age: string;
}) {
  const patients = data.longSeries.filter(
    (point) =>
      point.sex === "Femmes" && point.age === age && point.year >= 2019,
  );
  const stays = data.storyAnalysis.rehospitalisation
    .find((row) => row.age === age)!
    .series.filter((point) => point.year >= 2019);
  const patientBase = patients[0].patients;
  const stayBase = stays[0].stays_per_patient;
  const patientIndex = patients.map((point) => ({
    year: point.year,
    value: (100 * point.patients) / patientBase,
  }));
  const stayIndex = stays.map((point) => ({
    year: point.year,
    value: (100 * point.stays_per_patient) / stayBase,
  }));
  const x = (_: { year: number; value: number }, index: number) =>
    25 + index * 48;
  const y = (point: { value: number }) =>
    170 - ((point.value - 80) / 130) * 138;
  return (
    <article className="indexed-card">
      <h3>{age}</h3>
      <svg
        viewBox="0 0 346 205"
        role="img"
        aria-label={`${age}, évolution comparée du nombre de patientes et des séjours par patiente, indice 100 en 2019`}
      >
        {[100, 150, 200].map((tick) => (
          <g key={tick}>
            <line
              x1="25"
              x2="313"
              y1={y({ value: tick })}
              y2={y({ value: tick })}
            />
            <text x="0" y={y({ value: tick }) + 4}>
              {tick}
            </text>
          </g>
        ))}
        <path
          className="patients-line"
          d={createLinePath(patientIndex, x, y)}
        />
        <path className="stays-line" d={createLinePath(stayIndex, x, y)} />
        <text x="25" y="198">
          2019
        </text>
        <text x="313" y="198" textAnchor="end">
          2025
        </text>
      </svg>
      <div className="indexed-result">
        <strong>{formatSignedPercent(patientIndex.at(-1)!.value - 100)}</strong>
        <span>patientes</span>
        <strong>{formatSignedPercent(stayIndex.at(-1)!.value - 100)}</strong>
        <span>séjours / patiente</span>
      </div>
    </article>
  );
}

export function Decomposition({ data }: { data: ArchivedExperienceData }) {
  return (
    <section className="decomposition" id="decomposition">
      <header className="section-heading">
        <p className="chapter">03 · DÉCOMPOSER</p>
        <div>
          <h2>
            Plus de patientes
            <br />
            Pas seulement plus de séjours
          </h2>
          <p>
            Deux quantités évoluent, mais pas du tout dans les mêmes
            proportions. Base 100 en 2019.
          </p>
        </div>
      </header>
      <div className="indexed-grid">
        {FOCUS_AGES.map((age) => (
          <IndexedPair key={age} age={age} data={data} />
        ))}
      </div>
      <div className="legend">
        <span className="patients">Nombre de patientes</span>
        <span className="stays">Séjours par patiente</span>
      </div>
    </section>
  );
}

function SocialPanel({
  data,
  indicator,
}: {
  data: ExperienceData;
  indicator: string;
}) {
  const points = FINANCIAL_ORDER.map(
    (financial) =>
      data.social.find(
        (point) =>
          point.indicator === indicator && point.financial === financial,
      )!,
  ).filter(Boolean);
  const ratio = points.at(-1)!.estimate / points[0].estimate;
  return (
    <article className="social-panel">
      <div className="social-panel__head">
        <h3>{indicator}</h3>
        <strong>× {formatNumber(ratio, 1)}</strong>
      </div>
      {points.map((point) => (
        <div className="social-row" key={point.financial}>
          <span>{FINANCIAL_SHORT[point.financial]}</span>
          <div className="social-axis">
            <i
              style={{
                left: `${(point.low / 32) * 100}%`,
                width: `${((point.high - point.low) / 32) * 100}%`,
              }}
            />
            <b style={{ left: `${(point.estimate / 32) * 100}%` }} />
            <em style={{ left: `${(point.estimate / 32) * 100}%` }}>
              {formatNumber(point.estimate)} %
            </em>
          </div>
        </div>
      ))}
      <div className="social-scale">
        <span>0</span>
        <span>10</span>
        <span>20</span>
        <span>30 %</span>
      </div>
    </article>
  );
}

export function SocialSection({ data }: { data: ExperienceData }) {
  return (
    <section className="social-section" id="social">
      <header className="section-heading light">
        <p className="chapter">04 · CHANGER DE MESURE</p>
        <div>
          <h2>
            Une autre inégalité,
            <br />
            mesurée autrement
          </h2>
          <p>
            Dans le Baromètre 2024, trois indicateurs déclarés suivent le même
            gradient financier. Ils documentent une autre dimension ; ils
            n’expliquent pas la rupture hospitalière.
          </p>
        </div>
      </header>
      <div className="social-grid">
        {["Dépression", "Anxiété", "Pensées suicidaires"].map((indicator) => (
          <SocialPanel key={indicator} indicator={indicator} data={data} />
        ))}
      </div>
      <p className="source-note light">
        Estimations et intervalles de confiance à 95 %. Les quatre situations
        financières restent visibles simultanément. Source : Baromètre de Santé
        publique France 2024, Odissé.
      </p>
    </section>
  );
}

function average(values: { rate: number }[]) {
  return values.reduce((sum, point) => sum + point.rate, 0) / values.length;
}
