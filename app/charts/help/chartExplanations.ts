export type ChartExplanation = {
  title: string;
  measure: string;
  population: string;
  reading: string;
  limits: string;
  sources: { label: string; dataset?: string; url?: string }[];
};

const hospitalScope =
  "MCO signifie médecine, chirurgie et obstétrique. Les hospitalisations en psychiatrie, enregistrées dans une autre base, sont exclues. Les gestes auto-infligés comprennent les tentatives de suicide et les automutilations, sans pouvoir les distinguer ici. Ces données reflètent aussi l’accès aux soins et le codage ; elles ne mesurent pas toute la souffrance psychique.";
const rateReading =
  "Un taux pour 100 000 rapporte les événements à la population concernée. Tous âges confondus, le taux est standardisé sur la population France 2023 pour limiter l’effet de la structure démographique. Par tranche d’âge, le taux est brut.";
const percentChange =
  "L’évolution en % se calcule ainsi : (taux final / taux initial − 1) × 100. Une hausse de 10 % du taux n’est pas une hausse de 10 points de pourcentage.";
const indexReading =
  "En base 100, chaque courbe vaut 100 à l’année de départ : 110 indique une hausse du taux de 10 %. Cette vue compare les évolutions, pas les niveaux.";
const socialSources: Record<string, string> = {
  Dépression: "episodes-depressif-indicateurs-du-barometre-2024",
  Anxiété: "trouble-anxieux-generalise-indicateurs-du-barometre-2024",
  "Pensées suicidaires": "conduites-sucidaires-indicateurs-du-barometre-2024",
};
export const declaredMeasure = (indicator: string) =>
  indicator === "Dépression"
    ? "Épisode dépressif caractérisé"
    : indicator === "Anxiété"
      ? "Trouble anxieux généralisé"
      : indicator;

export function socialExplanation(indicator: string): ChartExplanation {
  return {
    title: `${declaredMeasure(indicator)} · Baromètre 2024`,
    measure: `Pourcentage estimé de personnes déclarant ${indicator === "Dépression" ? "un épisode dépressif caractérisé" : indicator === "Anxiété" ? "un trouble anxieux généralisé" : "des pensées suicidaires"} dans les 12 derniers mois, à partir des réponses au questionnaire. Il ne s’agit pas du nombre de diagnostics posés par un médecin.`,
    population:
      "Adultes de 18–79 ans, France hexagonale et DROM hors Mayotte, regroupés selon leur situation financière perçue. Les estimations sont pondérées pour représenter la population couverte par l’enquête.",
    reading:
      "Le point représente la prévalence estimée ; le trait représente son intervalle de confiance à 95 %, qui décrit l’incertitude de l’estimation. Le chiffre × compare la prévalence des personnes « en difficulté » à celle des personnes « à l’aise » : ce rapport n’est pas un écart en points.",
    limits:
      "Il s’agit d’une association entre situation financière perçue et indicateur déclaré, sans conclusion causale. Les réponses peuvent être affectées par la mémoire et la sous-déclaration. Le protocole 2024 diffère de celui des enquêtes 2005–2021 : leurs valeurs ne sont pas raccordées.",
    sources: [
      {
        label: "Santé publique France · Baromètre 2024",
        dataset: socialSources[indicator],
      },
    ],
  };
}

export function historyExplanation(
  indicator: string,
  territory: string,
  sex: string,
): ChartExplanation {
  return {
    title: `${declaredMeasure(indicator)} · Baromètres 2005–2021`,
    measure: `Prévalence déclarée de ${indicator === "Dépression" ? "l’épisode dépressif caractérisé" : indicator.toLowerCase()} dans les 12 derniers mois. Les points correspondent aux vagues d’enquête disponibles : 2005, 2010, 2017 et 2021.`,
    population: `Personnes de 18–75 ans en France hexagonale. Sélection : ${territory} · ${sex === "Hommes et Femmes" ? "tous les sexes" : sex.toLowerCase()}. La référence France correspond à la France hexagonale.`,
    reading:
      "Les courbes relient les estimations des enquêtes ; elles ne donnent pas de mesures pour les années intermédiaires. Les traits verticaux montrent les intervalles de confiance à 95 %. L’évolution en points est la prévalence de 2021 moins celle de 2005 : passer de 5 % à 6 % représente +1 point, soit +20 % en relatif. Un point de la frise représente une région.",
    limits:
      "Les réponses sont déclaratives et certains échantillons régionaux sont petits. Les intervalles incohérents dans la source sont signalés et ne sont pas dessinés ; l’estimation est conservée. Les écarts visibles ne constituent pas, à eux seuls, des différences statistiquement significatives. Les données 2024 restent séparées à cause du changement de protocole.",
    sources: ["reg", "fra"].map((scope) => ({
      label: `Santé publique France · Baromètres historiques · ${scope === "reg" ? "régions" : "France hexagonale"}`,
      dataset: `${indicator === "Dépression" ? "sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois" : "sante-mentale-pensees-suicidaires-et-tentatives-de-suicide"}_${scope}`,
    })),
  };
}

export function hospitalExplanation(
  patients: boolean,
  population: string,
  standardized: boolean,
  indexed = false,
): ChartExplanation {
  return {
    title: `${patients ? "Patients" : "Séjours"} en MCO · gestes auto-infligés`,
    measure: patients
      ? "Personnes hospitalisées au moins une fois dans l’année en MCO pour un geste auto-infligé. Une personne peut avoir plusieurs séjours ; le nombre de patients et le nombre de séjours sont deux mesures distinctes."
      : "Séjours en MCO pour un geste auto-infligé. Une même personne peut être hospitalisée plusieurs fois dans l’année : ces séjours ne correspondent pas à autant de personnes différentes.",
    population: `${population} · 2019–2024. Les taux sont rapportés aux habitants du territoire, de l’âge et du sexe sélectionnés. La référence nationale couvre la France hexagonale et les DROM ; Saint-Martin et Saint-Barthélemy sont exclus de cette référence.`,
    reading: `${rateReading} Ici : ${standardized ? "taux standardisé" : "taux brut pour l’âge et le sexe sélectionnés"}. ${indexed ? indexReading : percentChange} ${patients ? "Dans la vue âge × sexe, les pointillés représentent l’autre sexe au même âge." : "La courbe orange représente le département sélectionné, les pointillés la référence nationale ; le survol de la frise révèle un autre département."} Un écart à la France compare les taux à la dernière année, et non leurs évolutions.`,
    limits: `${hospitalScope} Les effectifs diffusés et les taux sont arrondis. Certaines références nationales regroupées par âge sont approchées à partir de ces valeurs arrondies.`,
    sources: patients
      ? [
          {
            label: "Santé publique France · PMSI-MCO · patients",
            dataset: "gestes-auto-infliges-patients-hospitalises-france",
          },
        ]
      : [
          {
            label: "Santé publique France · PMSI-MCO · départements",
            dataset: "gestes-auto-infliges-hospitalisations-departement",
          },
          {
            label: "Référence nationale · séjours",
            dataset: "gestes-auto-infliges-hospitalisations-france",
          },
        ],
  };
}

export function storyHospitalExplanation(scene: number): ChartExplanation {
  const population =
    scene === 0
      ? "France · tous âges, tous sexes"
      : scene === 1
        ? "France · femmes et hommes de tous âges"
        : scene === 2
          ? "France · filles de 11–14 ans"
          : "France · filles et garçons de 11–14 ans";
  const explanation = hospitalExplanation(true, population, scene <= 1);
  return {
    ...explanation,
    reading: `${rateReading} Ici : ${scene <= 1 ? "taux standardisés, sur une échelle de 0 à 150" : "taux bruts des 11–14 ans, sur une échelle de 0 à 500"} pour 100 000. ${percentChange} ${scene === 1 || scene === 3 ? "Les deux courbes partagent la même échelle : orange pour les femmes ou les filles, pointillés pour les hommes ou les garçons." : "Chaque point donne le taux de patients hospitalisés pour l’année correspondante."}`,
  };
}

export function emergencyExplanation(
  population: string,
  indexed: boolean,
): ChartExplanation {
  return {
    title: "Passages pour gestes auto-infligés · OSCOUR®",
    measure:
      "Part des passages aux urgences pour gestes auto-infligés parmi les passages comportant au moins un diagnostic médical renseigné. Un passage est un recours aux urgences, et non une personne unique.",
    population: `${population} · 2020–2024 · services participant au réseau OSCOUR®. Le dénominateur est l’activité codée des urgences pour les filtres retenus, et non la population du territoire.`,
    reading: `Une valeur de 500 pour 100 000 passages codés équivaut à 0,5 % de ces passages. ${indexed ? indexReading : percentChange} Un point de la frise représente un département avec des valeurs comparables aux deux dates.`,
    limits:
      "Cette part dépend aussi du volume total d’activité et du codage des urgences. PACA et Corse sont exclues de la référence nationale depuis 2022 ; la Martinique est couverte depuis 2023. Les ruptures sont indiquées sur la courbe nationale, dont l’évolution et l’indice base 100 ne sont pas calculés. Les départements de PACA et Corse ne sont pas comparés après la rupture de codage de 2022. Une donnée absente ne vaut pas zéro.",
    sources: [
      {
        label: "Santé publique France · OSCOUR® · départements",
        dataset: "gestes-auto-infliges-passages-aux-urgences-departement",
      },
      {
        label: "Référence nationale · périmètre variable",
        dataset: "gestes-auto-infliges-passages-aux-urgences-france",
      },
    ],
  };
}

export function deathExplanation(population: string): ChartExplanation {
  return {
    title: "Décès enregistrés par suicide · CépiDc",
    measure:
      "Décès dont la cause médicale initiale est identifiée comme un suicide dans les certificats de décès recueillis par le CépiDc.",
    population: `${population} · 2019–2023 · France hexagonale et DROM. La référence nationale exclut Saint-Martin et Saint-Barthélemy.`,
    reading: `${rateReading} L’évolution présentée est une différence entre le taux de 2023 et celui de 2019, en points de taux pour 100 000 habitants. Passer de 10 à 12 décès pour 100 000 représente +2 points de taux. La frise ne retient que les départements ayant au moins 10 décès à chacune des deux dates.`,
    limits:
      "Le seuil de 10 décès est un choix de prudence du projet, pas un test de significativité. Les effectifs diffusés sont arrondis. Les décès de cause inconnue ou d’intention indéterminée ne sont pas inclus : une sous-estimation est possible. Les valeurs des enfants sont à lire avec précaution. La référence nationale des 0–17 ans n’est pas calculable à partir des taux arrondis disponibles ; d’autres regroupements nationaux sont approchés.",
    sources: [
      {
        label: "Santé publique France · CépiDc · départements",
        dataset: "suicides-deces-departement",
      },
      {
        label: "Référence nationale · décès",
        dataset: "suicides-deces-france",
      },
    ],
  };
}
