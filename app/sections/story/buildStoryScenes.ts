import {
  type SeriesPoint,
  type ExperienceData,
} from "../../data/experienceTypes";
import { FINANCIAL_ORDER } from "../../data/indicatorDefinitions";
import { formatSignedPercent, formatNumber } from "../../charts/format";

export function buildStoryScenes(data: ExperienceData) {
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
  const social = FINANCIAL_ORDER.map(
    (financial) =>
      data.social.find(
        (point) =>
          point.indicator === "Dépression" && point.financial === financial,
      )!,
  );
  const comfortable = social[0];
  const difficult = social[3];
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
  return {
    scenes,
    women,
    men,
    national,
    girls,
    boys,
    social,
    change,
    comfortable,
    difficult,
  };
}
export type StoryData = ReturnType<typeof buildStoryScenes>;
