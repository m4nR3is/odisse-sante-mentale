#!/usr/bin/env python3
"""Audit statistique reproductible du récit santé mentale.

Bibliothèque standard uniquement. Les modèles de rupture sont descriptifs :
régression linéaire segmentée, sélection AICc et stabilité leave-one-year-out.
"""

from __future__ import annotations

import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from statistics import fmean

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
ODISSE = RAW / "odisse"
OUT = ROOT / "analysis" / "mental_health"
DREES = RAW / "drees-patients-hospitalises-gestes-auto-infliges-2012-2025.csv"

AGE_BANDS = {
    "11–14 ans": range(11, 15),
    "15–17 ans": range(15, 18),
    "18–24 ans": range(18, 25),
    "25–44 ans": range(25, 45),
    "45–64 ans": range(45, 65),
    "65 ans et plus": range(65, 96),
}
SEX_LABEL = {"F": "Femmes", "M": "Hommes"}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter=";"))


def invert(matrix: list[list[float]]) -> list[list[float]]:
    n = len(matrix)
    augmented = [row[:] + [float(i == j) for j in range(n)] for i, row in enumerate(matrix)]
    for column in range(n):
        pivot = max(range(column, n), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            raise ValueError("Matrice singulière")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(n):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [a - factor * b for a, b in zip(augmented[row], augmented[column])]
    return [row[n:] for row in augmented]


def ols(x: list[list[float]], y: list[float]) -> dict:
    n, k = len(y), len(x[0])
    xtx = [[sum(x[r][i] * x[r][j] for r in range(n)) for j in range(k)] for i in range(k)]
    xty = [sum(x[r][i] * y[r] for r in range(n)) for i in range(k)]
    inv = invert(xtx)
    beta = [sum(inv[i][j] * xty[j] for j in range(k)) for i in range(k)]
    fitted = [sum(beta[j] * x[i][j] for j in range(k)) for i in range(n)]
    residuals = [actual - predicted for actual, predicted in zip(y, fitted)]
    sse = sum(value * value for value in residuals)
    sigma2 = sse / max(n - k, 1)
    se = [math.sqrt(max(inv[i][i] * sigma2, 0)) for i in range(k)]
    aic = n * math.log(max(sse / n, 1e-12)) + 2 * k
    aicc = aic + (2 * k * (k + 1) / (n - k - 1)) if n > k + 1 else math.inf
    return {"beta": beta, "se": se, "fitted": fitted, "residuals": residuals, "sse": sse, "aicc": aicc, "inverse_xtx": inv, "sigma2": sigma2}


def aggregate_drees() -> dict[tuple[int, str, str, str], dict[str, float]]:
    grouped: dict[tuple[int, str, str, str], dict[str, float]] = defaultdict(lambda: {"count": 0.0, "population": 0.0})
    for row in read_csv(DREES):
        if row["champ"] != "mco":
            continue
        age = int(row["age"])
        band = next((label for label, ages in AGE_BANDS.items() if age in ages), None)
        if not band:
            continue
        key = (int(row["annee"]), SEX_LABEL[row["sexe"]], band, row["unite"])
        grouped[key]["count"] += float(row["nombre"])
        grouped[key]["population"] += float(row["population"])
    for values in grouped.values():
        values["rate"] = 100_000 * values["count"] / values["population"]
    return grouped


def patient_series(grouped: dict, sex: str, age: str) -> list[dict]:
    return [
        {"year": year, "rate": grouped[(year, sex, age, "patient")]["rate"], "patients": grouped[(year, sex, age, "patient")]["count"], "population": grouped[(year, sex, age, "patient")]["population"]}
        for year in range(2012, 2026)
    ]


def segmented_fit(series: list[dict], breakpoint: int) -> dict:
    origin = min(row["year"] for row in series)
    x, y = [], []
    for row in series:
        t = row["year"] - origin
        post = 1.0 if row["year"] >= breakpoint else 0.0
        x.append([1.0, t, post, max(row["year"] - breakpoint, 0)])
        y.append(row["rate"])
    model = ols(x, y)
    return {
        "breakpoint": breakpoint,
        "aicc": model["aicc"],
        "level_change": model["beta"][2],
        "level_change_se": model["se"][2],
        "pre_slope": model["beta"][1],
        "post_slope": model["beta"][1] + model["beta"][3],
    }


def break_audit(series: list[dict]) -> dict:
    candidates = list(range(2017, 2024))
    fits = [segmented_fit(series, candidate) for candidate in candidates]
    best = min(fits, key=lambda row: row["aicc"])
    base_x = [[1.0, row["year"] - 2012] for row in series]
    base = ols(base_x, [row["rate"] for row in series])
    stability = Counter()
    for omitted in [row["year"] for row in series]:
        reduced = [row for row in series if row["year"] != omitted]
        choice = min((segmented_fit(reduced, candidate) for candidate in candidates), key=lambda row: row["aicc"])
        stability[choice["breakpoint"]] += 1
    return {
        "best_breakpoint": best["breakpoint"],
        "delta_aicc_vs_linear": round(base["aicc"] - best["aicc"], 2),
        "best_model": {key: round(value, 2) if isinstance(value, float) else value for key, value in best.items()},
        "candidate_models": [{key: round(value, 2) if isinstance(value, float) else value for key, value in fit.items()} for fit in fits],
        "leave_one_year_out": dict(sorted(stability.items())),
    }


def counterfactual(series: list[dict], last_pre_year: int = 2019, target_year: int = 2025) -> dict:
    pre = [row for row in series if row["year"] <= last_pre_year]
    origin = pre[0]["year"]
    x = [[1.0, row["year"] - origin] for row in pre]
    model = ols(x, [row["rate"] for row in pre])
    target = next(row for row in series if row["year"] == target_year)
    vector = [1.0, target_year - origin]
    expected = sum(a * b for a, b in zip(model["beta"], vector))
    leverage = sum(vector[i] * model["inverse_xtx"][i][j] * vector[j] for i in range(2) for j in range(2))
    forecast_se = math.sqrt(model["sigma2"] * (1 + leverage))
    excess_rate = target["rate"] - expected
    return {
        "pre_period": f"{origin}–{last_pre_year}",
        "target_year": target_year,
        "pre_slope_per_year": round(model["beta"][1], 2),
        "expected_rate": round(expected, 1),
        "forecast_interval_95_approx": [round(expected - 1.96 * forecast_se, 1), round(expected + 1.96 * forecast_se, 1)],
        "observed_rate": round(target["rate"], 1),
        "excess_rate": round(excess_rate, 1),
        "observed_over_expected": round(target["rate"] / expected, 2) if expected > 0 else None,
        "excess_patients_approx": round(excess_rate * target["population"] / 100_000),
    }


def sex_specificity(grouped: dict, age: str) -> dict:
    f19, f25 = (grouped[(year, "Femmes", age, "patient")]["rate"] for year in (2019, 2025))
    h19, h25 = (grouped[(year, "Hommes", age, "patient")]["rate"] for year in (2019, 2025))
    return {
        "age": age,
        "female_change_percent": round((f25 / f19 - 1) * 100, 1),
        "male_change_percent": round((h25 / h19 - 1) * 100, 1),
        "ratio_of_rate_ratios": round((f25 / f19) / (h25 / h19), 2),
        "female_male_rate_ratio_2019": round(f19 / h19, 2),
        "female_male_rate_ratio_2025": round(f25 / h25, 2),
    }


def rehospitalisation(grouped: dict, sex: str, age: str) -> dict:
    points = []
    for year in range(2012, 2026):
        patients = grouped[(year, sex, age, "patient")]["count"]
        stays = grouped[(year, sex, age, "sejours")]["count"]
        points.append({"year": year, "stays_per_patient": stays / patients})
    before = fmean(row["stays_per_patient"] for row in points if row["year"] <= 2019)
    after = fmean(row["stays_per_patient"] for row in points if row["year"] >= 2021)
    return {
        "sex": sex,
        "age": age,
        "mean_2012_2019": round(before, 3),
        "mean_2021_2025": round(after, 3),
        "change_percent": round((after / before - 1) * 100, 1),
        "value_2025": round(points[-1]["stays_per_patient"], 3),
        "series": [{"year": row["year"], "stays_per_patient": round(row["stays_per_patient"], 3)} for row in points],
    }


def social_gradient() -> list[dict]:
    sources = [
        ("Dépression", "episodes-depressif-indicateurs-du-barometre-2024.csv", None),
        ("Anxiété", "trouble-anxieux-generalise-indicateurs-du-barometre-2024.csv", None),
        ("Pensées suicidaires", "conduites-sucidaires-indicateurs-du-barometre-2024.csv", "Pensées suicidaires au cours des 12 derniers mois"),
    ]
    order = ["Vous êtes à l’aise", "Ça va", "C’est juste, il faut faire attention", "Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette"]
    output = []
    for label, filename, indicator_filter in sources:
        eligible = []
        for row in read_csv(ODISSE / filename):
            if indicator_filter and row["indicateur"] != indicator_filter:
                continue
            if row.get("situation_financiere_percue") not in order:
                continue
            dimensions = ["sexe", "classe_d_age", "nouvelles_regions", "pcs", "diplome", "type_de_menage", "situation_professionnelle"]
            if any(row.get(field, "Tous") not in ("", "Tous") for field in dimensions):
                continue
            eligible.append(row)
        points = []
        for category in order:
            row = next(item for item in eligible if item["situation_financiere_percue"] == category)
            points.append({"category": category, "estimate": float(row["estimation"]), "low": float(row["ic_inf"]), "high": float(row["ic_sup"])})
        output.append({
            "indicator": label,
            "monotonic": all(points[i]["estimate"] < points[i + 1]["estimate"] for i in range(3)),
            "absolute_gap_points": round(points[-1]["estimate"] - points[0]["estimate"], 1),
            "prevalence_ratio": round(points[-1]["estimate"] / points[0]["estimate"], 2),
            "extreme_intervals_overlap": not (points[0]["high"] < points[-1]["low"] or points[-1]["high"] < points[0]["low"]),
            "points": points,
        })
    return output


def territory_audit() -> dict:
    rows = read_csv(ODISSE / "gestes-auto-infliges-hospitalisations-departement.csv")
    grouped: dict[str, dict] = defaultdict(lambda: {"name": "", "region": "", "rates": {}})
    for row in rows:
        if row["classe_d_age"] != "Tous" or row["sexe"] != "Hommes et Femmes" or not row["taux_standardise"]:
            continue
        dep = row["num_departement"]
        grouped[dep]["name"] = row["libgeo"]
        grouped[dep]["region"] = row["reglib"]
        grouped[dep]["rates"][int(row["annee"])] = float(row["taux_standardise"])
    results = []
    for dep, item in grouped.items():
        rates = item["rates"]
        if not all(year in rates for year in range(2019, 2025)):
            continue
        early = fmean(rates[year] for year in (2019, 2020))
        late = fmean(rates[year] for year in (2023, 2024))
        annual_changes = [rates[year] - rates[year - 1] for year in range(2020, 2025)]
        results.append({"code": dep, "name": item["name"], "region": item["region"], "early_mean": early, "late_mean": late, "change": late - early, "positive_years": sum(change > 0 for change in annual_changes)})
    ordered = sorted(results, key=lambda row: row["change"], reverse=True)
    return {
        "n_departments": len(results),
        "increase_share_percent": round(100 * sum(row["change"] > 0 for row in results) / len(results), 1),
        "persistent_increase_share_percent": round(100 * sum(row["positive_years"] >= 4 for row in results) / len(results), 1),
        "top_increases": [{**row, "early_mean": round(row["early_mean"], 1), "late_mean": round(row["late_mean"], 1), "change": round(row["change"], 1)} for row in ordered[:10]],
        "top_decreases": [{**row, "early_mean": round(row["early_mean"], 1), "late_mean": round(row["late_mean"], 1), "change": round(row["change"], 1)} for row in ordered[-10:]],
    }


def write_report(result: dict) -> None:
    lines = [
        "# Audit analytique — Santé mentale", "",
        "## Verdict", "",
        result["verdict"], "",
        "## Périmètre vérifié", "",
        "- La série longue DREES compte des patients uniques hospitalisés au moins une fois dans l’année en MCO, en France entière.",
        "- Les gestes auto-infligés sont repérés par les codes CIM-10 X60 à X84. Ils couvrent tentatives de suicide et automutilations non suicidaires.",
        "- Le codage du diagnostic n’est pas obligatoire : l’indicateur mesure des prises en charge hospitalières codées, pas l’ensemble des gestes survenus.",
        "- Le taux est rapporté à la population du même âge et du même sexe. Les regroupements 11–14, 15–17 et 18–24 ans sont recalculés à partir des âges détaillés.",
        "- La série Odissé utilisée pour la géographie porte sur les séjours MCO, avec des taux standardisés tous âges.", "",
        "## 1. Rupture temporelle", "",
    ]
    for key, item in result["groups"].items():
        audit, counter = item["break_audit"], item["counterfactual"]
        stability = ", ".join(f"{year}: {count}/14" for year, count in audit["leave_one_year_out"].items())
        lines += [
            f"### {key}", "",
            f"- Meilleure année de rupture selon l’AICc : **{audit['best_breakpoint']}** (gain d’AICc face à une droite simple : {audit['delta_aicc_vs_linear']}).",
            f"- Stabilité en retirant une année : {stability}.",
            f"- Tendance 2012–2019 : {counter['pre_slope_per_year']:+.1f} points de taux par an.",
            f"- En 2025 : {counter['observed_rate']:.1f} observé contre {counter['expected_rate']:.1f} attendu par prolongation linéaire, soit ×{counter['observed_over_expected']:.2f} et environ {counter['excess_patients_approx']} patientes au-dessus de cette projection.",
            "",
        ]
    lines += ["## 2. Spécificité féminine", ""]
    for row in result["sex_specificity"]:
        lines.append(f"- **{row['age']}** : femmes {row['female_change_percent']:+.1f} %, hommes {row['male_change_percent']:+.1f} % ; ratio des évolutions ×{row['ratio_of_rate_ratios']:.2f}.")
    lines += ["", "## 3. Séjours et patientes", ""]
    for row in result["rehospitalisation"]:
        lines.append(f"- **{row['age']}** : {row['mean_2012_2019']:.2f} séjour/patiente avant 2020, {row['mean_2021_2025']:.2f} depuis 2021 ({row['change_percent']:+.1f} %).")
    lines += ["", "## 4. Gradient financier", ""]
    for row in result["social_gradient"]:
        lines.append(f"- **{row['indicator']}** : gradient monotone = {'oui' if row['monotonic'] else 'non'} ; écart {row['absolute_gap_points']:.1f} points ; rapport ×{row['prevalence_ratio']:.2f} ; IC des extrêmes se chevauchent = {'oui' if row['extreme_intervals_overlap'] else 'non'}.")
    territory = result["territory"]
    lines += [
        "", "## 5. Territoires", "",
        f"- {territory['n_departments']} départements comparables ; {territory['increase_share_percent']:.1f} % augmentent entre les moyennes 2019–2020 et 2023–2024.",
        f"- Seulement {territory['persistent_increase_share_percent']:.1f} % augmentent lors d’au moins quatre des cinq transitions annuelles : la géographie est donc instable et doit rester secondaire.",
        "", "## 6. Affirmations autorisées", "",
    ]
    lines.extend(f"- {claim}" for claim in result["claims_allowed"])
    lines += ["", "## 7. Affirmations interdites ou non démontrées", ""]
    lines.extend(f"- {claim}" for claim in result["claims_forbidden"])
    lines += ["", "## Décision éditoriale", "", result["editorial_decision"], "", "## Sources officielles vérifiées", ""]
    lines.extend(f"- {url}" for url in result["official_sources"])
    lines.append("")
    (OUT / "AUDIT_ANALYTIQUE.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    grouped = aggregate_drees()
    focus = ["11–14 ans", "15–17 ans", "18–24 ans"]
    groups = {}
    for age in focus:
        series = patient_series(grouped, "Femmes", age)
        groups[f"Femmes · {age}"] = {"series": [{**row, "rate": round(row["rate"], 2)} for row in series], "break_audit": break_audit(series), "counterfactual": counterfactual(series)}
    result = {
        "verdict": "Le signal est robuste comme rupture descriptive et spécifique aux adolescentes et jeunes femmes. L’année exacte de rupture varie légèrement selon l’âge et le modèle ; il faut donc raconter une bifurcation située autour de 2020–2021, pas un effet causal ponctuel attribué à 2021.",
        "groups": groups,
        "sex_specificity": [sex_specificity(grouped, age) for age in focus],
        "rehospitalisation": [rehospitalisation(grouped, "Femmes", age) for age in focus],
        "social_gradient": social_gradient(),
        "territory": territory_audit(),
        "claims_allowed": [
            "Une bifurcation majeure des hospitalisations pour gestes auto-infligés apparaît autour de 2020–2021 chez les adolescentes et jeunes femmes.",
            "La hausse concerne davantage de patientes, et ne s’explique donc pas uniquement par une répétition accrue des séjours.",
            "Entre 2019 et 2025, l’augmentation est nettement plus forte chez les femmes de 11 à 24 ans que chez les hommes du même âge.",
            "En 2024, les indicateurs déclarés de santé mentale suivent un gradient régulier selon la situation financière perçue.",
            "Les trajectoires départementales diffèrent fortement et peuvent refléter à la fois morbidité, recours, offre de soins et codage.",
        ],
        "claims_forbidden": [
            "La pandémie a causé à elle seule la hausse observée.",
            "Les difficultés financières causent directement les hospitalisations observées chez les adolescentes.",
            "Un département affichant un taux élevé possède nécessairement une santé mentale plus dégradée.",
            "Les gestes auto-infligés sont tous des tentatives de suicide.",
            "Les passages aux urgences, hospitalisations, pensées suicidaires et décès constituent les étapes d’un même entonnoir individuel.",
            "La projection de tendance pré-2020 représente le nombre de cas qui aurait réellement été observé sans pandémie.",
        ],
        "editorial_decision": "Conserver l’âge et le genre comme colonne vertébrale. Utiliser le gradient financier comme second acte autonome, sans prétendre expliquer le premier. Réduire le territoire à un mode d’exploration et à une leçon de prudence sur les indicateurs de recours aux soins.",
        "official_sources": [
            "https://data.drees.solidarites-sante.gouv.fr/explore/dataset/patients_hospitalises_pour_gestes_auto_infliges_depuis_2012/",
            "https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/jeux-de-donnees/250511_hospitalisations-pour-tentatives-de-suicide",
            "https://www.santepubliquefrance.fr/sante-mentale/suicides-et-tentatives-de-suicide/bulletin-national/conduites-suicidaires-en-france-bilan-2024",
        ],
    }
    (OUT / "results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    write_report(result)
    print(f"Écrit : {(OUT / 'AUDIT_ANALYTIQUE.md').relative_to(ROOT)}")
    print(f"Écrit : {(OUT / 'results.json').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
