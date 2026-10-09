import type { ExperienceData, ReferencePoint } from "./experienceTypes";
import { EMERGENCY_CODING_BREAK, ODISSE_AGES } from "./indicatorDefinitions";

export type TerritoryDataset = "hospitalisations" | "emergency" | "suicides";
export type TerritoryConfiguration = ReturnType<
  typeof getTerritoryConfiguration
>;

export function getTerritoryConfiguration(
  data: ExperienceData,
  territoryDataset: TerritoryDataset,
) {
  switch (territoryDataset) {
    case "emergency":
      return {
        departments: data.emergencyDepartments,
        national: data.emergencyNational,
        startYear: 2020,
        endYear: 2024,
        label: "Passages aux urgences pour gestes auto-infligés",
        shortLabel: "Urgences",
        unit: "part pour 100 000 passages codés",
        description:
          "Gestes auto-infligés parmi les passages avec un diagnostic renseigné",
      };
    case "suicides":
      return {
        departments: data.suicideDepartments,
        national: data.suicideNational,
        startYear: 2019,
        endYear: 2023,
        label: "Décès par suicide",
        shortLabel: "Décès",
        unit: "taux pour 100 000 habitants",
        description: "Décès enregistrés par suicide",
      };
    default:
      return {
        departments: data.departments,
        national: data.national,
        startYear: 2019,
        endYear: 2024,
        label: "Séjours en MCO pour gestes auto-infligés",
        shortLabel: "Séjours MCO",
        unit: "taux pour 100 000 habitants",
        description: "Séjours hospitaliers en MCO pour gestes auto-infligés",
      };
  }
}

export function calculateTerritoryMetrics(
  territoryConfig: TerritoryConfiguration,
  territoryDataset: TerritoryDataset,
  age: string,
  sex: string,
) {
  return territoryConfig.departments
    .map((department) => {
      const series = department.series
        .filter(
          (point) =>
            point.age === age &&
            point.sex === sex &&
            !(
              territoryDataset === "emergency" &&
              EMERGENCY_CODING_BREAK.has(department.code) &&
              point.year >= 2022
            ),
        )
        .sort((a, b) => a.year - b.year);
      const first = series.find(
        (point) => point.year === territoryConfig.startYear,
      );
      const last = series.find(
        (point) => point.year === territoryConfig.endYear,
      );
      // Les décès évoluent en points de taux ; les autres mesures en pourcentage.
      const isDeathDataset = territoryDataset === "suicides";
      const change =
        first && last && (isDeathDataset || first.rate > 0)
          ? isDeathDataset
            ? last.rate - first.rate
            : 100 * (last.rate / first.rate - 1)
          : null;
      // Le seuil de prudence filtre les comparaisons, sans retirer la courbe.
      const comparable =
        change != null &&
        (!isDeathDataset ||
          ((first?.count ?? 0) >= 10 && (last?.count ?? 0) >= 10));
      return {
        department,
        series,
        change: change != null && Number.isFinite(change) ? change : null,
        comparable,
      };
    })
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0));
}

export function calculateProfileMetrics(
  data: Pick<ExperienceData, "odissePatients">,
) {
  return ODISSE_AGES.flatMap((profileAgeValue) =>
    ["Femmes", "Hommes"].map((profileSexValue) => {
      const series = data.odissePatients
        .filter(
          (point) =>
            point.age === profileAgeValue && point.sex === profileSexValue,
        )
        .sort((a, b) => a.year - b.year);
      const first = series[0];
      const last = series.at(-1)!;
      return {
        department: {
          code: `${profileAgeValue}|${profileSexValue}`,
          name: `${profileAgeValue} · ${profileSexValue}`,
          region: "France entière",
          series: [],
        },
        series,
        change: 100 * (last.rate / first.rate - 1),
        comparable: true,
      };
    }),
  ).sort((a, b) => a.change - b.change);
}

export function calculateNationalSelection(
  reference: ReferencePoint[],
  startYear: number,
  endYear: number,
  territoryDataset: TerritoryDataset,
) {
  const first = reference.find((point) => point.year === startYear);
  const last = reference.find((point) => point.year === endYear);
  const isDeath = territoryDataset === "suicides";
  // Le périmètre national des urgences varie : conserver le niveau seul.
  const change =
    first &&
    last &&
    (isDeath || first.rate > 0) &&
    territoryDataset !== "emergency"
      ? isDeath
        ? last.rate - first.rate
        : 100 * (last.rate / first.rate - 1)
      : null;
  return {
    department: {
      code: "FR",
      name:
        territoryDataset === "emergency"
          ? "France · référence couverte"
          : "France entière",
      region: "Référence nationale",
      series: [],
    },
    series: reference,
    change,
    comparable: change != null && Number.isFinite(change),
  };
}
