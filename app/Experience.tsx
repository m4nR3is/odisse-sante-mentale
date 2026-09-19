"use client";

import { useMemo, useState } from "react";

type Point = { year: number; sex: string; age: string; patients: number; rate: number };
type NationalPoint = { year: number; sex: string; rate: number; stays: number };
type SocialPoint = { indicator: string; financial: string; estimate: number; low: number; high: number; sample: number };
type Department = { code: string; name: string; region: string; series: { year: number; sex: string; rate: number }[] };
export type ExperienceData = { meta: { generated: string; odisseLatestYear: number; dreesLatestYear: number }; longSeries: Point[]; national: NationalPoint[]; social: SocialPoint[]; departments: Department[] };

const AGES = ["11–14 ans", "15–17 ans", "18–24 ans", "25–44 ans", "45–64 ans", "65 ans et plus"];
const COLORS = ["#ff6647", "#d83a76", "#7c4dff", "#2779e6", "#0d8f82", "#6e776f"];
const FINANCIAL_ORDER = ["Vous êtes à l’aise", "Ça va", "C’est juste, il faut faire attention", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette"];
const SHORT_FINANCIAL: Record<string, string> = { "Vous êtes à l’aise": "À l’aise", "Ça va": "Ça va", "C’est juste, il faut faire attention": "C’est juste", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette": "En difficulté" };
const fmt = (value: number, digits = 1) => value.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

function pathFor(values: { year: number; rate: number }[], width: number, height: number, max: number) {
  const x = (year: number) => 34 + ((year - 2012) / 13) * (width - 56);
  const y = (rate: number) => height - 28 - (rate / max) * (height - 50);
  return values.map((point, index) => `${index ? "L" : "M"}${x(point.year).toFixed(1)},${y(point.rate).toFixed(1)}`).join(" ");
}

function ThreadsChart({ data, activeAge, setActiveAge }: { data: ExperienceData; activeAge: string; setActiveAge: (age: string) => void }) {
  const width = 900, height = 470, max = 760;
  const series = AGES.map((age) => ({ age, values: data.longSeries.filter((d) => d.sex === "Femmes" && d.age === age) }));
  const selected = series.find((d) => d.age === activeAge)!;
  const last = selected.values.at(-1)!;
  const before = selected.values.find((d) => d.year === 2019)!;
  const change = ((last.rate / before.rate) - 1) * 100;

  return <div className="chart-shell">
    <div className="chart-head"><div><p className="eyebrow">Patientes hospitalisées · France entière</p><h3>Une rupture, six trajectoires</h3></div><div className="chart-stat" aria-live="polite"><strong>+{fmt(change, 0)} %</strong><span>{activeAge}, 2019 → 2025</span></div></div>
    <div className="age-controls" aria-label="Choisir une classe d’âge">{AGES.map((age, i) => <button key={age} className={age === activeAge ? "active" : ""} onClick={() => setActiveAge(age)} style={{ "--series": COLORS[i] } as React.CSSProperties}><span />{age}</button>)}</div>
    <div className="chart-wrap"><svg className="threads-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Évolution du taux de patientes hospitalisées pour gestes auto-infligés par âge de 2012 à 2025. Série sélectionnée : ${activeAge}.`}>
      {[0, 200, 400, 600].map((tick) => <g key={tick}><line x1="34" x2="878" y1={height - 28 - (tick / max) * (height - 50)} y2={height - 28 - (tick / max) * (height - 50)} /><text x="4" y={height - 23 - (tick / max) * (height - 50)}>{tick}</text></g>)}
      <rect className="rupture-zone" x="618" y="12" width="260" height="430" rx="12" /><text className="rupture-label" x="635" y="39">APRÈS 2020</text>
      {series.map((line, i) => <path key={line.age} d={pathFor(line.values, width, height, max)} className={line.age === activeAge ? "thread active" : "thread"} style={{ stroke: COLORS[i] }} />)}
      {selected.values.map((point) => { const x = 34 + ((point.year - 2012) / 13) * (width - 56); const y = height - 28 - (point.rate / max) * (height - 50); return <circle key={point.year} cx={x} cy={y} r={point.year === 2025 ? 7 : 3.5} className="selected-dot"><title>{point.year} : {fmt(point.rate)} pour 100 000</title></circle>; })}
      {[2012, 2016, 2020, 2021, 2025].map((year) => <text className="x-label" key={year} x={34 + ((year - 2012) / 13) * (width - 56)} y="466" textAnchor="middle">{year}</text>)}
    </svg></div>
    <p className="chart-note">Taux de patientes hospitalisées pour 100 000 habitantes. Une personne n’est comptée qu’une fois par année. Source : DREES, PMSI-MCO, 2012–2025.</p>
  </div>;
}

function SocialGradient({ data }: { data: ExperienceData }) {
  const [indicator, setIndicator] = useState("Dépression");
  const points = FINANCIAL_ORDER.map((financial) => data.social.find((d) => d.indicator === indicator && d.financial === financial)!).filter(Boolean);
  const max = 32, ratio = points.at(-1)!.estimate / points[0].estimate;
  return <div className="social-card">
    <div className="switch" aria-label="Choisir l’indicateur">{["Dépression", "Anxiété", "Pensées suicidaires"].map((item) => <button key={item} className={indicator === item ? "active" : ""} onClick={() => setIndicator(item)}>{item}</button>)}</div>
    <div className="social-layout"><div className="ratio"><span>écart observé</span><strong>× {fmt(ratio)}</strong><p>entre les personnes à l’aise et celles en difficulté financière.</p></div><div className="dotplot" role="img" aria-label={`${indicator} selon la situation financière`}>
      {points.map((point, i) => <div className="dotrow" key={point.financial}><span className="dotlabel">{SHORT_FINANCIAL[point.financial]}</span><div className="axis"><span className="confidence" style={{ left: `${(point.low / max) * 100}%`, width: `${((point.high - point.low) / max) * 100}%` }} /><span className="dot" style={{ left: `${(point.estimate / max) * 100}%`, background: COLORS[i] }} /><span className="dotvalue" style={{ left: `${(point.estimate / max) * 100}%` }}>{fmt(point.estimate)} %</span></div></div>)}
      <div className="dot-scale"><span>0</span><span>10</span><span>20</span><span>30 %</span></div>
    </div></div>
    <p className="chart-note">Part déclarant l’indicateur au cours des 12 derniers mois ; estimation et intervalle de confiance à 95 %. Source : Baromètre de Santé publique France 2024.</p>
  </div>;
}

function TerritoryExplorer({ data }: { data: ExperienceData }) {
  const [code, setCode] = useState("80");
  const department = data.departments.find((d) => d.code === code) ?? data.departments[0];
  const values = department.series.filter((d) => d.sex === "Hommes et Femmes");
  const national = data.national.filter((d) => d.sex === "Hommes et Femmes");
  const latest = values.find((d) => d.year === 2024)!, natLatest = national.find((d) => d.year === 2024)!;
  const max = Math.max(400, ...values.map((d) => d.rate), ...national.map((d) => d.rate));
  const w = 720, h = 280;
  const localPath = values.map((p, i) => `${i ? "L" : "M"}${42 + i * 126},${h - 35 - (p.rate / max) * 210}`).join(" ");
  const natPath = national.map((p, i) => `${i ? "L" : "M"}${42 + i * 126},${h - 35 - (p.rate / max) * 210}`).join(" ");
  return <div className="territory-card">
    <div className="territory-toolbar"><label>Choisir un département<select value={code} onChange={(e) => setCode(e.target.value)}>{data.departments.map((d) => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}</select></label><div className="territory-stat"><strong>{fmt(latest.rate)}</strong><span>pour 100 000 en 2024<br />France : {fmt(natLatest.rate)}</span></div></div>
    <div className="territory-main"><div><p className="region-label">{department.region}</p><h3>{department.name}</h3><p>Les écarts territoriaux ne mesurent pas seulement la souffrance : offre de soins, recours à l’hôpital et pratiques de codage peuvent aussi varier.</p></div><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Taux d’hospitalisations dans ${department.name} et en France de 2019 à 2024`}>
      {[0, 200, 400].map((tick) => <g key={tick}><line x1="42" x2="672" y1={h - 35 - (tick / max) * 210} y2={h - 35 - (tick / max) * 210} /><text x="4" y={h - 30 - (tick / max) * 210}>{tick}</text></g>)}<path className="national-line" d={natPath} /><path className="local-line" d={localPath} />{values.map((p, i) => <circle key={p.year} cx={42 + i * 126} cy={h - 35 - (p.rate / max) * 210} r="5"><title>{p.year} : {fmt(p.rate)}</title></circle>)}{values.map((p, i) => <text key={p.year} className="x-label" x={42 + i * 126} y="274" textAnchor="middle">{p.year}</text>)}
    </svg></div><div className="legend"><span className="local">Département</span><span className="national">France entière</span></div>
    <p className="chart-note">Taux standardisé d’hospitalisations pour gestes auto-infligés, tous âges et sexes réunis. Source : Odissé, Santé publique France, 2019–2024.</p>
  </div>;
}

export default function Experience({ initialData: data }: { initialData: ExperienceData }) {
  const [activeAge, setActiveAge] = useState("11–14 ans");
  const heroThreads = useMemo(() => [
    { d: "M-40 570 C170 540 260 470 440 260 S760 100 1120 120 S1450 340 1700 80", color: COLORS[0] },
    { d: "M-30 620 C180 610 320 580 480 410 S760 180 1110 240 S1420 510 1700 260", color: COLORS[1] },
    { d: "M-40 640 C200 650 330 620 520 560 S830 450 1100 430 S1390 540 1700 500", color: COLORS[3] },
  ], []);
  return <main>
    <header className="topbar"><a className="wordmark" href="#top">ODISSÉ <span>/ DATAVIZ 2026</span></a><nav><a href="#rupture">La rupture</a><a href="#social">Le gradient social</a><a href="#territoires">Les territoires</a><a href="#methode">Méthode</a></nav><a className="help-link" href="tel:3114">Besoin d’aide ? 3114</a></header>
    <section className="hero" id="top"><svg className="hero-threads" viewBox="0 0 1600 720" preserveAspectRatio="none" aria-hidden="true">{heroThreads.map((thread, i) => <path key={i} d={thread.d} style={{ stroke: thread.color, animationDelay: `${i * 180}ms` }} />)}</svg><div className="hero-copy"><p className="kicker">Santé mentale · France · 2012—2025</p><h1>Ce que la moyenne<br /><em>ne dit pas</em></h1><p className="standfirst">Derrière un chiffre national, certaines trajectoires ont décroché. Suivez les fils de l’âge, du genre, de la situation financière et du territoire.</p><a className="start" href="#rupture">Entrer dans les données <span>↓</span></a></div><aside className="hero-finding"><span>01 / LA RUPTURE</span><strong>× 2</strong><p>Le taux d’hospitalisation des filles de 11 à 14 ans a doublé entre 2019 et 2025.</p></aside><p className="hero-source">Données Odissé · DREES · Baromètre de Santé publique France</p></section>
    <section className="intro section-grid" id="rupture"><div className="chapter"><span>CHAPITRE 01</span><i /></div><div className="section-copy"><p className="eyebrow">Commencer par défaire la moyenne</p><h2>En 2021, les fils se séparent.</h2><p className="lead">À première vue, les hospitalisations progressent modérément. Mais la moyenne rassemble des âges et des sexes dont les trajectoires n’ont plus rien de commun.</p></div></section>
    <section className="visual-section"><ThreadsChart data={data} activeAge={activeAge} setActiveAge={setActiveAge} /></section>
    <section className="counterpoint section-grid"><div className="chapter"><span>CE QUE L’ON VOIT</span><i /></div><div className="counter-copy"><div className="big-number">140<sup>%</sup></div><div><h2>Une hausse portée au-delà de 100 %</h2><p>Entre 2019 et 2024, les séjours supplémentaires des femmes de 11 à 24 ans représentent 140 % de la hausse nette nationale. Ce paradoxe est possible parce que d’autres groupes diminuent et compensent une partie de leur hausse.</p><p className="caveat">Ici, Odissé compte des <strong>séjours</strong>, pas des personnes. La série DREES ci-dessus, qui compte des patientes uniques, confirme néanmoins la rupture.</p></div></div></section>
    <section className="definitions"><div className="definition-title"><p className="eyebrow">Ne pas confondre</p><h2>Quatre mesures.<br />Quatre réalités.</h2><p>Ces indicateurs se répondent, mais ne forment pas un entonnoir : les populations et les définitions diffèrent.</p></div>{[["RESSENTI", "Symptômes déclarés", "Une expérience rapportée dans une enquête."], ["URGENCES", "Passages aux urgences", "Un recours aux soins en situation aiguë."], ["HÔPITAL", "Gestes auto-infligés", "Des séjours codés après tentative de suicide ou auto-agression non suicidaire."], ["DÉCÈS", "Suicides", "Une issue létale, documentée séparément."]].map((item, i) => <article key={item[0]}><span>0{i + 1}</span><small>{item[0]}</small><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</section>
    <section className="dark-section" id="social"><div className="section-grid"><div className="chapter"><span>CHAPITRE 02</span><i /></div><div className="section-copy"><p className="eyebrow">Relier santé mentale et inégalités</p><h2>Le poids invisible du quotidien.</h2><p className="lead">La situation financière ne raconte pas toute une vie. Pourtant, elle dessine un gradient net dans trois dimensions de la santé mentale.</p></div></div><SocialGradient data={data} /></section>
    <section className="territory-section" id="territoires"><div className="section-grid"><div className="chapter"><span>CHAPITRE 03</span><i /></div><div className="section-copy"><p className="eyebrow">Changer d’échelle</p><h2>Un pays, cent trajectoires locales.</h2><p className="lead">Explorez un département, comparez-le à la France, puis gardez en tête ce que la donnée ne peut pas trancher.</p></div></div><TerritoryExplorer data={data} /></section>
    <section className="method" id="methode"><div><p className="eyebrow">Méthode & limites</p><h2>Montrer sans surinterpréter.</h2></div><div className="method-list"><details open><summary>Que mesure-t-on ?</summary><p>Les données hospitalières portent sur les gestes auto-infligés : tentatives de suicide et auto-agressions sans intention suicidaire documentée. Elles ne décrivent pas toute la santé mentale.</p></details><details><summary>Peut-on parler de causalité ?</summary><p>Non. Les rapprochements entre âge, sexe et situation financière sont descriptifs. Ils signalent des écarts ; ils n’en démontrent pas les causes.</p></details><details><summary>Pourquoi deux sources hospitalières ?</summary><p>Odissé fournit les séjours et le détail territorial jusqu’en 2024. La DREES fournit le nombre de personnes hospitalisées jusqu’en 2025, évitant de confondre personnes et réhospitalisations.</p></details><details><summary>Données et reproductibilité</summary><p>Les traitements sont documentés dans le dépôt : données sources, script de préparation, définitions et limites. Dernière génération : {data.meta.generated}.</p></details></div></section>
    <section className="help"><div><p className="eyebrow">Parce que derrière les données, il y a des personnes</p><h2>Si vous êtes en détresse ou inquiet·ète pour un proche.</h2></div><a href="tel:3114"><span>Numéro national de prévention du suicide</span><strong>31 14</strong><small>Gratuit · 24 h / 24 · 7 j / 7</small></a></section>
    <footer><div><strong>Ce que la moyenne ne dit pas</strong><p>Une proposition pour l’Odissé Dataviz Challenge 2026.</p></div><div><span>SOURCES</span><a href="https://odisse.santepubliquefrance.fr/" target="_blank" rel="noreferrer">Odissé — Santé publique France ↗</a><a href="https://drees.solidarites-sante.gouv.fr/240516_ERHospiGestesAutoInfliges" target="_blank" rel="noreferrer">DREES — Gestes auto-infligés ↗</a></div><a href="#top">Retour en haut ↑</a></footer>
  </main>;
}
