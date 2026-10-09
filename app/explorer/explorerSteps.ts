export const EXPLORER_STEPS = [
  {
    label: "Dépression · 2024",
    mode: "declared",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    label: "Anxiété · 2024",
    mode: "declared",
    view: "social",
    indicator: "Anxiété",
    dataset: "hospitalisations",
  },
  {
    label: "Pensées suicidaires · 2024",
    mode: "declared",
    view: "social",
    indicator: "Pensées suicidaires",
    dataset: "hospitalisations",
  },
  {
    label: "Dépression · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    label: "Pensées suicidaires · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Pensées suicidaires",
    dataset: "hospitalisations",
  },
  {
    label: "Tentatives de suicide · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Tentatives de suicide",
    dataset: "hospitalisations",
  },
  {
    label: "Urgences · départements",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "emergency",
  },
  {
    label: "Hôpital · séjours départementaux",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    label: "Hôpital · patients par âge et sexe",
    mode: "profiles",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    label: "Décès · départements",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "suicides",
  },
] as const;

export type GuidedView = { view: "declared" | "profiles"; revision: number };
