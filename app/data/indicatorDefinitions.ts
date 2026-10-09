export const ODISSE_AGES = [
  "00–10 ans",
  "11–14 ans",
  "15–17 ans",
  "18–24 ans",
  "25–44 ans",
  "45–64 ans",
  "65–84 ans",
  "85 ans et plus",
];

export const TERRITORY_AGES = [
  "Tous",
  "00–17 ans",
  "18–24 ans",
  "25–44 ans",
  "45–64 ans",
  "65 ans et plus",
];

export const TERRITORY_SEXES = ["Hommes et Femmes", "Femmes", "Hommes"];

export const EMERGENCY_CODING_BREAK = new Set([
  "04",
  "05",
  "06",
  "13",
  "83",
  "84",
  "2A",
  "2B",
]);

export const FINANCIAL_ORDER = [
  "Vous êtes à l’aise",
  "Ça va",
  "C’est juste, il faut faire attention",
  "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette",
];

export const FINANCIAL_SHORT: Record<string, string> = {
  "Vous êtes à l’aise": "À l’aise",
  "Ça va": "Ça va",
  "C’est juste, il faut faire attention": "C’est juste",
  "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette":
    "En difficulté",
};
