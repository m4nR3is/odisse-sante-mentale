import { type ExperienceData, type SeriesPoint } from "../data/experienceTypes";

type Projection = {
  pre_slope_per_year: number;
  expected_rate: number;
  forecast_interval_95_approx: number[];
  observed_rate: number;
  excess_patients_approx: number;
};

export type GroupAnalysis = {
  series: {
    year: number;
    rate: number;
    patients: number;
    population: number;
  }[];
  break_audit: {
    best_breakpoint: number;
    leave_one_year_out: Record<string, number>;
  };
  counterfactual: Projection;
};

type Rehospitalisation = {
  age: string;
  mean_2012_2019: number;
  mean_2021_2025: number;
  change_percent: number;
  series: { year: number; stays_per_patient: number }[];
};

type StoryAnalysis = {
  groups: Record<string, GroupAnalysis>;
  rehospitalisation: Rehospitalisation[];
  territory: {
    n_departments: number;
    increase_share_percent: number;
    persistent_increase_share_percent: number;
  };
};

// Anciennes explorations : conservées dans le code, exclues des données publiées.
export type ArchivedExperienceData = ExperienceData & {
  longSeries: SeriesPoint[];
  storyAnalysis: StoryAnalysis;
};
