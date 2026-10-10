import { type ExperienceData } from "../data/experienceTypes";
import { ReadingConclusion } from "./ReadingConclusion";
import { MethodStage } from "./MethodStage";
import { useScrollReveals } from "../animation/useScrollReveals";
import { useRef } from "react";

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
  useScrollReveals(root);
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
        <MethodStage scenes={METHOD_SCENES} />
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
