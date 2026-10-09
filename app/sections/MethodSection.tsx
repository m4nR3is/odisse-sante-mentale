import { type ExperienceData } from "../data/experienceTypes";
import { ScrollIndicator } from "../explorer/ScrollIndicator";
import { ReadingConclusion } from "./ReadingConclusion";
import {
  useRef,
  useState,
  useEffect,
  type CSSProperties,
  useLayoutEffect,
} from "react";

const METHOD_SCENES = [
  {
    word: "Distinguer",
    label: "QUATRE REGARDS",
    title: "Des réalités différentes",
    copy: "Interroger une personne, compter un passage aux urgences, un séjour ou un décès : chaque source rend une dimension visible.",
    takeaway:
      "Ces sources ne sont pas les étapes d’un même parcours individuel.",
    rows: [
      [
        "Déclaré",
        "Une expérience rapportée",
        "Épisode dépressif caractérisé, trouble anxieux généralisé et pensées suicidaires déclarés dans les enquêtes.",
      ],
      [
        "Urgences",
        "Un recours aigu",
        "Passages pour gestes auto-infligés dans OSCOUR® ; le périmètre national varie depuis 2022.",
      ],
      [
        "Hôpital",
        "Une prise en charge",
        "Patients et séjours en MCO pour gestes auto-infligés ; hospitalisations en psychiatrie exclues.",
      ],
      [
        "Décès",
        "Une mortalité enregistrée",
        "Décès par suicide, documentés séparément.",
      ],
    ],
  },
  {
    word: "Rapporter",
    label: "LE DÉNOMINATEUR COMPTE",
    title: "Un chiffre, rapporté à quoi ?",
    copy: "Le dénominateur donne son sens à la mesure. Une part de l’activité des urgences et un taux dans la population répondent à des questions différentes.",
    takeaway: "Les niveaux ne se comparent pas d’une source à l’autre.",
    rows: [
      [
        "Déclaré",
        "% des personnes",
        "Prévalence déclarée dans la population couverte par l’enquête.",
      ],
      [
        "Urgences",
        "Pour 100 000 passages",
        "Part des gestes auto-infligés parmi les passages avec au moins un diagnostic renseigné.",
      ],
      [
        "Hôpital",
        "Pour 100 000 habitants",
        "Taux de patients ou de séjours : deux unités de comptage distinctes.",
      ],
      [
        "Décès",
        "Pour 100 000 habitants",
        "Taux de décès par suicide ; évolutions exprimées en points de taux.",
      ],
    ],
  },
  {
    word: "Comparer",
    label: "GARDER LES MÊMES REPÈRES",
    title: "Des comparaisons sous conditions",
    copy: "Avant de rapprocher deux valeurs, vérifier la population, la période et la définition. L’incertitude fait partie de la lecture.",
    takeaway: "Un seuil de prudence n’est pas un test de significativité.",
    rows: [
      [
        "Population",
        "Brut ou standardisé",
        "Les taux hospitaliers et de décès tous âges sont standardisés ; les taux par âge sont bruts. Certaines références nationales regroupées sont approchées à partir de valeurs arrondies.",
      ],
      [
        "Période",
        "2005–2021 ≠ 2024",
        "Les Baromètres historiques restent séparés de 2024, dont le protocole a changé.",
      ],
      [
        "Incertitude",
        "Conserver les intervalles",
        "Les IC à 95 % sont affichés lorsqu’ils sont cohérents. Une borne incohérente dans la source est signalée ; une donnée absente reste absente.",
      ],
      [
        "Petits effectifs",
        "Au moins 10 décès",
        "Pour comparer les évolutions départementales, ce seuil doit être atteint aux deux dates. La courbe disponible reste visible.",
      ],
    ],
  },
  {
    word: "Interpréter",
    label: "SAVOIR OÙ S’ARRÊTER",
    title: "Observer un écart, garder ses limites",
    copy: "Une visualisation permet de repérer des différences et de poser des questions. Elle ne suffit pas à identifier leur cause.",
    takeaway:
      "Derrière les données, des personnes. Aucun indicateur ne résume leur expérience.",
    rows: [
      [
        "Association",
        "Une relation observée",
        "Le gradient financier déclaré ne démontre pas une cause des hospitalisations.",
      ],
      [
        "Prise en charge",
        "Un regard sur les soins",
        "Les données reflètent aussi l’accès, l’offre et le codage, pas toute la souffrance psychique.",
      ],
      [
        "Territoires",
        "Situer, sans classer",
        "Une distribution décrit des écarts de mesure ; elle ne classe pas la souffrance des habitants.",
      ],
      [
        "Traçabilité",
        "Pouvoir vérifier",
        "Les exports, calculs et règles de comparaison sont conservés dans le dépôt public.",
      ],
    ],
  },
];

export function MethodSection({ data }: { data: ExperienceData }) {
  const root = useRef<HTMLDivElement>(null);
  const landmarks = useRef<Array<HTMLLIElement | null>>([]);
  const [reading, setReading] = useState({
    scene: 0,
    fraction: 0,
    reduced: false,
  });
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const synchronize = () => {
      frame = 0;
      const line =
        (document.querySelector(".topbar")?.getBoundingClientRect().bottom ??
          60) + 18;
      let scene = 0;
      landmarks.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= line)
          scene = index;
      });
      const bounds = landmarks.current[scene]?.getBoundingClientRect();
      const fraction = bounds
        ? Math.max(0, Math.min(1, (line - bounds.top) / bounds.height))
        : 0;
      setReading((current) =>
        current.scene === scene &&
        Math.abs(current.fraction - fraction) < 0.001 &&
        current.reduced === motion.matches
          ? current
          : { scene, fraction, reduced: motion.matches },
      );
      root.current
        ?.querySelectorAll<HTMLElement>(".method-reveal")
        .forEach((element) => {
          const reveal = motion.matches
            ? 1
            : Math.max(
                0,
                Math.min(
                  1,
                  (window.innerHeight * 0.9 -
                    element.getBoundingClientRect().top) /
                    (window.innerHeight * 0.25),
                ),
              );
          element.style.setProperty("--method-reveal", String(reveal));
        });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(synchronize);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    if (root.current) observer.observe(root.current);
    synchronize();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  const [clickRevision, setClickRevision] = useState(0);
  const [clickProgress, setClickProgress] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!clickRevision || reading.reduced) return;
    let frame = 0;
    const start = performance.now();
    const advance = (now: number) => {
      const elapsed = Math.min(1, (now - start) / 1050);
      setClickProgress(elapsed < 1 ? elapsed * 0.55 : null);
      if (elapsed < 1) frame = requestAnimationFrame(advance);
    };
    const cancel = () => {
      cancelAnimationFrame(frame);
      setClickProgress(null);
    };
    frame = requestAnimationFrame(advance);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, [clickRevision, reading.reduced]);
  const step = METHOD_SCENES[reading.scene];
  const fraction = clickProgress ?? reading.fraction;
  const phase = (start: number, duration: number) => {
    const value = Math.max(0, Math.min(1, (fraction - start) / duration));
    return value * value * (3 - 2 * value);
  };
  const arrival = reading.reduced ? 1 : phase(0.02, 0.26);
  const keepLastScene = reading.scene === METHOD_SCENES.length - 1;
  const departure = reading.reduced || keepLastScene ? 0 : phase(0.78, 0.16);
  const reveal = reading.reduced ? 1 : phase(0.18, 0.23);
  const contentStyle = (start: number, exitStart = 0.77): CSSProperties => {
    const enter = reading.reduced ? 1 : phase(start, 0.2);
    const leave = reading.reduced || keepLastScene ? 0 : phase(exitStart, 0.16);
    return {
      opacity: enter * (1 - leave),
      transform:
        enter === 1 && leave === 0
          ? "none"
          : `translateY(${(1 - enter) * 24 - leave * 38}px)`,
    };
  };
  useLayoutEffect(() => {
    const element = title.current;
    const viewport =
      stage.current?.querySelector<HTMLElement>(".method-stage-body");
    if (!element || !viewport) return;
    const draw = () => {
      const target = element.parentElement!;
      const bounds = viewport.getBoundingClientRect();
      const baseSize = parseFloat(
        getComputedStyle(target.parentElement!).fontSize,
      );
      // Draw glyphs at their actual size instead of scaling a composited bitmap.
      element.style.fontSize = `${baseSize}px`;
      const baseWidth = element.offsetWidth;
      const baseHeight = element.offsetHeight;
      target.style.width = `${baseWidth}px`;
      target.style.height = `${baseHeight}px`;
      const destination = target.getBoundingClientRect();
      const large = Math.max(
        1,
        Math.min(
          5,
          (bounds.width * 0.88) / baseWidth,
          (bounds.height * 0.55) / baseHeight,
        ),
      );
      element.style.fontSize = `${baseSize * (1 + (large - 1) * (1 - arrival))}px`;
      const centerX =
        (bounds.left + bounds.width / 2) * (1 - arrival) +
        (destination.left + baseWidth / 2) * arrival;
      const centerY =
        (bounds.top + bounds.height / 2) * (1 - arrival) +
        (destination.top + baseHeight / 2) * arrival;
      const dx = centerX - destination.left - element.offsetWidth / 2;
      const dy =
        centerY - destination.top - element.offsetHeight / 2 - departure * 60;
      element.style.transform =
        arrival === 1 && departure === 0
          ? "none"
          : `translate(${dx}px, ${dy}px)`;
      const titleVisibility = reading.scene === 0 ? 1 : phase(0, 0.025);
      element.style.opacity = String(
        reading.reduced ? 1 : titleVisibility * (1 - departure),
      );
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [arrival, departure, reading.scene, reading.reduced, fraction]);
  return (
    <div className="method-chapter-group" ref={root}>
      <section
        className="method method-narrative"
        id="methode"
        aria-labelledby="method-heading"
      >
        <header className="method-heading method-reveal">
          <p className="chapter">MÉTHODE · UNE AUTRE FAÇON DE LIRE</p>
          <h2 id="method-heading">
            Lire les données
            <br />
            Garder leurs limites
          </h2>
          <p>
            Quatre gestes pour comprendre ce que les chiffres permettent de
            dire.
          </p>
        </header>
        <div className="method-scroll-track">
          <ol className="method-landmarks" aria-label="Étapes de la méthode">
            {METHOD_SCENES.map((scene, index) => (
              <li
                key={scene.word}
                id={`method-step-${index + 1}`}
                ref={(element) => {
                  landmarks.current[index] = element;
                }}
              >
                <span className="sr-only">
                  {scene.word} {scene.title}
                </span>
              </li>
            ))}
          </ol>
          <div
            className="method-stage"
            ref={stage}
            data-method-progress={fraction.toFixed(3)}
            data-method-scene={reading.scene}
            data-method-reveal={reveal.toFixed(3)}
            style={{ "--method-scene-reveal": reveal } as CSSProperties}
          >
            <nav className="method-steps" aria-label="Parcourir la méthode">
              {METHOD_SCENES.map((scene, index) => (
                <a
                  key={scene.word}
                  href={`#method-step-${index + 1}`}
                  aria-current={reading.scene === index ? "step" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    const element = landmarks.current[index];
                    if (!element) return;
                    const bounds = element.getBoundingClientRect();
                    const line =
                      (document
                        .querySelector(".topbar")
                        ?.getBoundingClientRect().bottom ?? 60) + 18;
                    window.scrollTo({
                      top:
                        window.scrollY +
                        bounds.top -
                        line +
                        bounds.height * 0.55,
                      behavior: "instant",
                    });
                    setClickProgress(reading.reduced ? null : 0);
                    setClickRevision((revision) => revision + 1);
                  }}
                >
                  <span>0{index + 1}</span>
                  {scene.word}
                  <ScrollIndicator
                    progress={reading.scene === index ? reading.fraction : 0}
                  />
                </a>
              ))}
            </nav>
            <div className="method-stage-body" key={`method-${reading.scene}`}>
              <div className="method-reading">
                <p className="chapter" style={contentStyle(0.17)}>
                  {step.label}
                </p>
                <h3>
                  <span className="method-title-target">
                    <span className="method-title-flight" ref={title}>
                      {step.word}
                    </span>
                  </span>
                </h3>
                <h4 style={contentStyle(0.2)}>{step.title}</h4>
                <p style={contentStyle(0.23)}>{step.copy}</p>
              </div>
              <div className="method-rules">
                {step.rows.map(([label, title, copy], index) => {
                  const ruleReveal = reading.reduced
                    ? 1
                    : phase(0.24 + index * 0.035, 0.18);
                  return (
                    <article
                      key={label}
                      style={
                        {
                          ...contentStyle(
                            0.24 + index * 0.035,
                            0.75 + index * 0.012,
                          ),
                          "--rule-reveal": ruleReveal,
                        } as CSSProperties
                      }
                    >
                      <small>{label}</small>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                      <span className="method-rule-line" aria-hidden="true" />
                    </article>
                  );
                })}
              </div>
            </div>
            <p className="method-takeaway" style={contentStyle(0.34, 0.76)}>
              {step.takeaway}
            </p>
          </div>
        </div>
      </section>
      <ReadingConclusion />
      <div className="method-source-section" id="sources">
        <p className="chapter method-reveal">
          VÉRIFIER · RETROUVER · RÉUTILISER
        </p>
        <div className="source-ledger">
          <h3 className="method-reveal">
            Revenir
            <br />
            aux sources
          </h3>
          <ol>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/episodes-depressif-indicateurs-du-barometre-2024/"
                target="_blank"
                rel="noreferrer"
              >
                Épisodes dépressifs · Baromètre 2024 ↗
              </a>
              <span>Déclaré</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/trouble-anxieux-generalise-indicateurs-du-barometre-2024/"
                target="_blank"
                rel="noreferrer"
              >
                Trouble anxieux généralisé · Baromètre 2024 ↗
              </a>
              <span>Déclaré</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/conduites-sucidaires-indicateurs-du-barometre-2024/"
                target="_blank"
                rel="noreferrer"
              >
                Pensées suicidaires · Baromètre 2024 ↗
              </a>
              <span>Déclaré</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_reg/"
                target="_blank"
                rel="noreferrer"
              >
                Épisodes dépressifs · régions · 2005–2021 ↗
              </a>
              <span>Historique</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_reg/"
                target="_blank"
                rel="noreferrer"
              >
                Pensées et tentatives · régions · 2005–2021 ↗
              </a>
              <span>Historique</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_fra/"
                target="_blank"
                rel="noreferrer"
              >
                Épisodes dépressifs · France hexagonale · 2005–2021 ↗
              </a>
              <span>Historique · référence</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_fra/"
                target="_blank"
                rel="noreferrer"
              >
                Pensées et tentatives · France hexagonale · 2005–2021 ↗
              </a>
              <span>Historique · référence</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-departement/"
                target="_blank"
                rel="noreferrer"
              >
                Séjours hospitaliers · départements ↗
              </a>
              <span>Territoires</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-hospitalisations-france/"
                target="_blank"
                rel="noreferrer"
              >
                Séjours hospitaliers · France ↗
              </a>
              <span>Référence</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-patients-hospitalises-france/"
                target="_blank"
                rel="noreferrer"
              >
                Patients hospitalisés · France ↗
              </a>
              <span>Âge × sexe</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-departement/"
                target="_blank"
                rel="noreferrer"
              >
                Passages aux urgences · départements ↗
              </a>
              <span>Territoires</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/gestes-auto-infliges-passages-aux-urgences-france/"
                target="_blank"
                rel="noreferrer"
              >
                Passages aux urgences · France ↗
              </a>
              <span>Référence</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-departement/"
                target="_blank"
                rel="noreferrer"
              >
                Décès par suicide · départements ↗
              </a>
              <span>Territoires</span>
            </li>
            <li className="method-reveal">
              <a
                href="https://odisse.santepubliquefrance.fr/explore/dataset/suicides-deces-france/"
                target="_blank"
                rel="noreferrer"
              >
                Décès par suicide · France ↗
              </a>
              <span>Référence</span>
            </li>
          </ol>
        </div>
        <p className="method-source-note method-reveal">
          Les séries nationales des Baromètres historiques complètent les séries
          régionales. Les 14 jeux Odissé et les 17 rapports régionaux du
          Baromètre 2024 sont reliés à leurs exports et à leurs transformations
          dans le registre de provenance, avec les contrôles des intervalles de
          confiance. Les contours de sélection proviennent de l’IGN / Admin
          Express COG et des codes INSEE 2018, via France GeoJSON, sous Licence
          Ouverte ; les gris représentent les évolutions comparables de la frise
          ou, dans Inégalités sociales 2024, les prévalences régionales tous
          profils confondus.
        </p>
        <a
          className="method-source-manifest method-reveal"
          href="./data/sources.json"
          target="_blank"
          rel="noreferrer"
        >
          Consulter le registre des sources et des exports ↗
        </a>
        <div className="method-reuse method-reveal">
          <h3>Des sources aux graphiques</h3>
          <p>
            Une application statique, des données servies localement et des
            calculs reproductibles. React, TypeScript et SVG pour la lecture ;
            Python pour préparer les données.
          </p>
          <a
            href="https://github.com/m4nR3is/odisse-sante-mentale"
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir le code, les données et les analyses ↗
          </a>
          <p className="generation">
            Données web régénérées le {data.meta.generated} · Code MIT · Textes
            et visuels originaux CC-BY 4.0 · Données Odissé Licence Ouverte 2.0.
          </p>
        </div>
      </div>
    </div>
  );
}
