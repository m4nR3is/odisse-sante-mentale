// Contrat du JSON produit par scripts/build_web_data.py.
export type SeriesPoint = {
  year: number;
  sex: string;
  age: string;
  patients: number;
  rate: number;
};

export type NationalPoint = {
  year: number;
  sex: string;
  age: string;
  rate: number;
  stays: number;
};

export type ReferencePoint = {
  year: number;
  sex: string;
  age: string;
  rate: number;
  count?: number;
};

export type SocialPoint = {
  indicator: string;
  financial: string;
  estimate: number;
  low: number;
  high: number;
  sample: number;
};

export type DeclaredHistoryPoint = {
  indicator: string;
  territoryCode: string;
  territory: string;
  year: number;
  sex: string;
  estimate: number;
  low: number;
  high: number;
};

export type Department = {
  code: string;
  name: string;
  region: string;
  series: ReferencePoint[];
};

export type ExperienceData = {
  meta: { generated: string; odisseLatestYear: number; unit: string };
  odissePatients: SeriesPoint[];
  national: NationalPoint[];
  social: SocialPoint[];
  socialRegions: {
    territoryCode: string;
    territory: string;
    indicator: string;
    estimate: number;
    low: number;
    high: number;
    sample: number;
  }[];
  regionalSocial: (SocialPoint & {
    territoryCode: string;
    territory: string;
    source: string;
    sourcePage: number;
  })[];
  declaredHistory: DeclaredHistoryPoint[];
  departments: Department[];
  emergencyDepartments: Department[];
  emergencyNational: ReferencePoint[];
  suicideDepartments: Department[];
  suicideNational: ReferencePoint[];
};
