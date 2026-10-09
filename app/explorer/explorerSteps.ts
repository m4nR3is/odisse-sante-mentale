export const EXPLORER_STEPS = [
  {
    id: "social-depression",
    label: "Dépression · 2024",
    mode: "declared",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    id: "social-anxiety",
    label: "Anxiété · 2024",
    mode: "declared",
    view: "social",
    indicator: "Anxiété",
    dataset: "hospitalisations",
  },
  {
    id: "social-suicidal-thoughts",
    label: "Pensées suicidaires · 2024",
    mode: "declared",
    view: "social",
    indicator: "Pensées suicidaires",
    dataset: "hospitalisations",
  },
  {
    id: "history-depression",
    label: "Dépression · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    id: "history-suicidal-thoughts",
    label: "Pensées suicidaires · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Pensées suicidaires",
    dataset: "hospitalisations",
  },
  {
    id: "history-suicide-attempts",
    label: "Tentatives de suicide · 2005–2021",
    mode: "declared",
    view: "history",
    indicator: "Tentatives de suicide",
    dataset: "hospitalisations",
  },
  {
    id: "emergency-territories",
    label: "Urgences · départements",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "emergency",
  },
  {
    id: "hospital-territories",
    label: "Hôpital · séjours départementaux",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    id: "hospital-profiles",
    label: "Hôpital · patients par âge et sexe",
    mode: "profiles",
    view: "social",
    indicator: "Dépression",
    dataset: "hospitalisations",
  },
  {
    id: "death-territories",
    label: "Décès · départements",
    mode: "territories",
    view: "social",
    indicator: "Dépression",
    dataset: "suicides",
  },
] as const;

export type GuidedView = { view: "declared" | "profiles"; revision: number };

export type ExplorerStep = (typeof EXPLORER_STEPS)[number];
export type ExplorerMode = ExplorerStep["mode"];
export type DeclaredView = ExplorerStep["view"];
export type MeasureFamily = "declared" | "emergency" | "hospital" | "deaths";
type StepId = ExplorerStep["id"];

const MODE_ENTRIES = {
  declared: "social-depression",
  territories: "hospital-territories",
  profiles: "hospital-profiles",
} as const satisfies Record<ExplorerMode, StepId>;
const DATASET_ENTRIES = {
  hospitalisations: "hospital-territories",
  emergency: "emergency-territories",
  suicides: "death-territories",
} as const satisfies Record<ExplorerStep["dataset"], StepId>;
const FAMILY_ENTRIES = {
  declared: "social-depression",
  emergency: "emergency-territories",
  hospital: "hospital-territories",
  deaths: "death-territories",
} as const satisfies Record<MeasureFamily, StepId>;

// Buttons and guided links resolve their destinations from the ordered scroll steps.
function stepIndex(id: StepId) {
  return EXPLORER_STEPS.findIndex((step) => step.id === id);
}
export function entryStepForMode(mode: ExplorerMode) {
  return stepIndex(MODE_ENTRIES[mode]);
}
export function entryStepForDataset(dataset: ExplorerStep["dataset"]) {
  return stepIndex(DATASET_ENTRIES[dataset]);
}
export function entryStepForFamily(family: MeasureFamily) {
  return stepIndex(FAMILY_ENTRIES[family]);
}
export function declaredStepIndex(view: DeclaredView, indicator: string) {
  return EXPLORER_STEPS.findIndex(
    (step) => step.view === view && step.indicator === indicator,
  );
}
export function declaredScrollRange(view: DeclaredView) {
  const steps = EXPLORER_STEPS.filter(
    (step) => step.mode === "declared" && step.view === view,
  );
  return { start: stepIndex(steps[0].id), count: steps.length };
}

export function measureFamilyFor(
  mode: ExplorerMode,
  dataset: ExplorerStep["dataset"],
): MeasureFamily {
  if (mode === "declared") return "declared";
  if (mode === "profiles") return "hospital";
  if (dataset === "emergency") return "emergency";
  return dataset === "hospitalisations" ? "hospital" : "deaths";
}

export function familyScrollRange(family: MeasureFamily) {
  const steps = EXPLORER_STEPS.filter(
    (step) => measureFamilyFor(step.mode, step.dataset) === family,
  );
  return { start: stepIndex(steps[0].id), count: steps.length };
}
