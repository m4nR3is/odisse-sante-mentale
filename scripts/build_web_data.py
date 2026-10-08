#!/usr/bin/env python3
"""Construit le jeu compact consommé par l'expérience web."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
ODISSE = RAW / "odisse"
WEB_ROOT = ROOT if (ROOT / "public").is_dir() else ROOT / "web"
OUTPUT = WEB_ROOT / "public" / "data" / "experience-data.json"


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle, delimiter=";"))


def num(value: str | None) -> float | None:
    if value is None or not value or str(value).lower() == "none":
        return None
    value_number = float(str(value).replace(",", "."))
    return None if value_number < 0 else value_number


def build_drees() -> list[dict]:
    source = rows(RAW / "drees-patients-hospitalises-gestes-auto-infliges-2012-2025.csv")
    bands = {
        "11–14 ans": range(11, 15),
        "15–17 ans": range(15, 18),
        "18–24 ans": range(18, 25),
        "25–44 ans": range(25, 45),
        "45–64 ans": range(45, 65),
        "65 ans et plus": range(65, 96),
    }
    grouped: dict[tuple[int, str, str], dict[str, float]] = defaultdict(lambda: {"count": 0, "population": 0})
    for row in source:
        if row["champ"] != "mco" or row["unite"] != "patient":
            continue
        age = int(row["age"])
        band = next((label for label, ages in bands.items() if age in ages), None)
        if band is None:
            continue
        key = (int(row["annee"]), row["sexe"], band)
        grouped[key]["count"] += float(row["nombre"])
        grouped[key]["population"] += float(row["population"])
    return [
        {
            "year": year,
            "sex": "Femmes" if sex == "F" else "Hommes",
            "age": age,
            "patients": round(values["count"]),
            "rate": round(100000 * values["count"] / values["population"], 1),
        }
        for (year, sex, age), values in sorted(grouped.items())
    ]


def build_departments() -> dict:
    source = rows(ODISSE / "gestes-auto-infliges-hospitalisations-departement.csv")
    departments: dict[str, dict] = {}
    for row in source:
        code = row["num_departement"]
        department = departments.setdefault(
            code,
            {"code": code, "name": row["libgeo"], "region": row["reglib"], "series": []},
        )
        age = row["classe_d_age"].replace("-", "–")
        rate = num(row["taux_standardise"] if row["classe_d_age"] == "Tous" else row["taux_brut"])
        if rate is None:
            continue
        department["series"].append(
            {"year": int(row["annee"]), "sex": row["sexe"], "age": age, "rate": round(rate, 1)}
        )
    for department in departments.values():
        department["series"].sort(key=lambda point: (point["age"], point["sex"], point["year"]))
    return {"departments": sorted(departments.values(), key=lambda item: item["name"])}


def build_emergency() -> dict:
    departments: dict[str, dict] = {}
    for row in rows(ODISSE / "gestes-auto-infliges-passages-aux-urgences-departement.csv"):
        rate = num(row["part_activite"])
        if rate is None:
            continue
        code = row["new_dpt"]
        department = departments.setdefault(code, {"code": code, "name": row["libgeo"], "region": row["reglib"], "series": []})
        department["series"].append({"year": int(row["annee"]), "sex": row["sexe"], "age": row["classe_d_age"].replace("-", "–"), "rate": round(rate, 1)})
    national = [
        {"year": int(row["annee"]), "sex": row["sexe"], "age": row["classe_d_age"].replace("-", "–"), "rate": round(rate, 1)}
        for row in rows(ODISSE / "gestes-auto-infliges-passages-aux-urgences-france.csv")
        if (rate := num(row["part_activite"])) is not None
    ]
    return {"emergencyDepartments": sorted(departments.values(), key=lambda item: item["name"]), "emergencyNational": sorted(national, key=lambda point: (point["age"], point["sex"], point["year"]))}


def build_suicides() -> dict:
    departments: dict[str, dict] = {}
    for row in rows(ODISSE / "suicides-deces-departement.csv"):
        rate = num(row["taux_standardise"] if row["classe_d_age"] == "Tous" else row["taux_brut"])
        if rate is None:
            continue
        code = row["num_departement"]
        department = departments.setdefault(code, {"code": code, "name": row["libgeo"], "region": row["reglib"], "series": []})
        department["series"].append({"year": int(row["annee"]), "sex": row["sexe"], "age": row["classe_d_age"].replace("-", "–"), "rate": round(rate, 1), "count": num(row["nombre_de_deces"])})
    national = []
    grouped: dict[tuple[int, str, str], dict[str, float]] = defaultdict(lambda: {"deaths": 0, "population": 0})
    parts: dict[tuple[int, str, str], set[str]] = defaultdict(set)
    age_groups = {
        "00-10 ans": "00–17 ans", "11-14 ans": "00–17 ans", "15-17 ans": "00–17 ans",
        "18-24 ans": "18–24 ans", "25-44 ans": "25–44 ans", "45-64 ans": "45–64 ans",
        "65-84 ans": "65 ans et plus", "85 ans et plus": "65 ans et plus",
    }
    for row in rows(ODISSE / "suicides-deces-france.csv"):
        if row["classe_d_age"] == "Tous":
            rate = num(row["taux_standardise"])
            if rate is not None:
                national.append({"year": int(row["annee"]), "sex": row["sexe"], "age": "Tous", "rate": round(rate, 1), "count": num(row["nombre_de_deces"])})
            continue
        rate = num(row["taux_brut"])
        deaths = num(row["nombre_de_deces"])
        if rate is None or deaths is None or rate <= 0:
            continue
        key = (int(row["annee"]), row["sexe"], age_groups[row["classe_d_age"]])
        parts[key].add(row["classe_d_age"])
        grouped[key]["deaths"] += deaths
        grouped[key]["population"] += deaths / rate * 100000
    for (year, sex, age), values in grouped.items():
        expected_parts = sum(label == age for label in age_groups.values())
        # Near-zero rounded rates for ages 0–10 cannot provide a reliable
        # population denominator for a national 0–17 reference.
        if age == "00–17 ans":
            continue
        if values["population"] > 0 and len(parts[(year, sex, age)]) == expected_parts:
            national.append({"year": year, "sex": sex, "age": age, "rate": round(100000 * values["deaths"] / values["population"], 1), "count": round(values["deaths"], 1)})
    return {"suicideDepartments": sorted(departments.values(), key=lambda item: item["name"]), "suicideNational": sorted(national, key=lambda point: (point["age"], point["sex"], point["year"]))}


def build_national() -> list[dict]:
    source = rows(ODISSE / "gestes-auto-infliges-hospitalisations-france.csv")
    result = []
    grouped: dict[tuple[int, str, str], dict[str, float]] = defaultdict(lambda: {"stays": 0, "population": 0})
    parts: dict[tuple[int, str, str], set[str]] = defaultdict(set)
    age_groups = {
        "00-10 ans": "00–17 ans",
        "11-14 ans": "00–17 ans",
        "15-17 ans": "00–17 ans",
        "18-24 ans": "18–24 ans",
        "25-44 ans": "25–44 ans",
        "45-64 ans": "45–64 ans",
        "65-84 ans": "65 ans et plus",
        "85 ans et plus": "65 ans et plus",
    }
    for row in source:
        if row["classe_d_age"] == "Tous":
            rate = num(row["taux_standardise"])
            if rate is not None:
                result.append(
                    {
                        "year": int(row["annee"]),
                        "sex": row["sexe"],
                        "age": "Tous",
                        "rate": round(rate, 1),
                        "stays": num(row["nombre_de_sejours"]),
                    }
                )
            continue

        rate = num(row["taux_brut"])
        stays = num(row["nombre_de_sejours"])
        if rate is None or stays is None or rate == 0:
            continue
        key = (int(row["annee"]), row["sexe"], age_groups[row["classe_d_age"]])
        parts[key].add(row["classe_d_age"])
        grouped[key]["stays"] += stays
        grouped[key]["population"] += stays / rate * 100000

    for (year, sex, age), values in grouped.items():
        expected_parts = sum(label == age for label in age_groups.values())
        if len(parts[(year, sex, age)]) != expected_parts:
            continue
        result.append(
            {
                "year": year,
                "sex": sex,
                "age": age,
                "rate": round(100000 * values["stays"] / values["population"], 1),
                "stays": round(values["stays"]),
            }
        )
    return sorted(result, key=lambda point: (point["age"], point["sex"], point["year"]))


def build_odisse_patients() -> list[dict]:
    """Série Odissé native, utilisée comme vue principale 2019-2024."""
    source = rows(ODISSE / "gestes-auto-infliges-patients-hospitalises-france.csv")
    result = []
    for row in source:
        rate = num(row["taux_standardise"] if row["classe_d_age"] == "Tous" else row["taux_brut"])
        patients = num(row["nombre_de_patients"])
        if rate is None or patients is None:
            continue
        result.append(
            {
                "year": int(row["annee"]),
                "sex": row["sexe"],
                "age": row["classe_d_age"].replace("-", "–"),
                "patients": round(patients),
                "rate": round(rate, 1),
            }
        )
    return sorted(result, key=lambda point: (point["age"], point["sex"], point["year"]))


def build_social() -> list[dict]:
    sources = [
        ("Dépression", "episodes-depressif-indicateurs-du-barometre-2024.csv"),
        ("Anxiété", "trouble-anxieux-generalise-indicateurs-du-barometre-2024.csv"),
        ("Pensées suicidaires", "conduites-sucidaires-indicateurs-du-barometre-2024.csv"),
    ]
    output = []
    for short_label, filename in sources:
        for row in rows(ODISSE / filename):
            if short_label == "Pensées suicidaires" and row["indicateur"] != "Pensées suicidaires au cours des 12 derniers mois":
                continue
            financial = row.get("situation_financiere_percue", "Tous")
            if financial in ("", "Tous"):
                continue
            other_dimensions = ["sexe", "classe_d_age", "nouvelles_regions", "pcs", "diplome", "type_de_menage", "situation_professionnelle"]
            if any(row.get(dimension, "Tous") not in ("", "Tous") for dimension in other_dimensions):
                continue
            estimate = num(row["estimation"])
            if estimate is None:
                continue
            output.append(
                {
                    "indicator": short_label,
                    "financial": financial,
                    "estimate": estimate,
                    "low": num(row["ic_inf"]),
                    "high": num(row["ic_sup"]),
                    "sample": num(row["effectif_brut"]),
                }
            )
    return output


def json_results(*filenames: str) -> list[dict]:
    output = []
    for filename in filenames:
        payload = json.loads((ODISSE / filename).read_text(encoding="utf-8"))
        output.extend(payload["results"])
    return output


def build_declared_history() -> list[dict]:
    """Vagues comparables du Baromètre 2005, 2010, 2017 et 2021."""
    output = []
    depression_sources = [
        (*json_results("depression-historique-france.json"),),
        (*json_results("depression-historique-region-page1.json", "depression-historique-region-page2.json"),),
    ]
    for source_index, source in enumerate(depression_sources):
        for row in source:
            estimate = num(str(row.get("taux_depisodes_depressifs_12_derniers_mois", "")))
            low = num(str(row.get("borne_inferieure_de_lintervalle_de_confiance_du_taux_depisodes_depressifs_au_cours_des_12_derniers_m", "")))
            high = num(str(row.get("borne_superieure_de_lintervalle_de_confiance_du_taux_depisodes_depressifs_au_cours_des_12_derniers_m", "")))
            if estimate is None or low is None or high is None:
                continue
            output.append({
                "indicator": "Dépression",
                "territoryCode": "FR" if source_index == 0 else row["reg"],
                "territory": "France" if source_index == 0 else row["reglib"],
                "year": int(row["annee"]),
                "sex": row["sexe"],
                "estimate": round(estimate, 3),
                "low": round(low, 3),
                "high": round(high, 3),
            })

    suicide_sources = [
        (*json_results("conduites-suicidaires-historique-france.json"),),
        (*json_results("conduites-suicidaires-historique-region-page1.json", "conduites-suicidaires-historique-region-page2.json"),),
    ]
    suicide_indicators = [
        ("Pensées suicidaires", "ps_12m_v", "ps_12m_icb", "ps_12m_ich"),
        ("Tentatives de suicide", "ts_12m_v", "ts_12m_icb", "ts_12m_ich"),
    ]
    for source_index, source in enumerate(suicide_sources):
        for row in source:
            for label, estimate_key, low_key, high_key in suicide_indicators:
                estimate = num(str(row.get(estimate_key, "")))
                low = num(str(row.get(low_key, "")))
                high = num(str(row.get(high_key, "")))
                if estimate is None or low is None or high is None:
                    continue
                output.append({
                    "indicator": label,
                    "territoryCode": "FR" if source_index == 0 else row["reg"],
                    "territory": "France" if source_index == 0 else row["reglib"],
                    "year": int(row["annee"]),
                    "sex": row["sexe"],
                    "estimate": round(estimate, 3),
                    "low": round(low, 3),
                    "high": round(high, 3),
                })
    return sorted(output, key=lambda point: (point["indicator"], point["territory"], point["sex"], point["year"]))


def main() -> None:
    analysis_path = ROOT / "analysis" / "mental_health" / "results.json"
    story_analysis = json.loads(analysis_path.read_text(encoding="utf-8")) if analysis_path.exists() else None
    payload = {
        "meta": {
            "generated": "2026-10-01",
            "odisseLatestYear": 2024,
            "dreesLatestYear": 2025,
            "unit": "taux pour 100 000 habitants",
        },
        "longSeries": build_drees(),
        "odissePatients": build_odisse_patients(),
        "national": build_national(),
        "social": build_social(),
        "declaredHistory": build_declared_history(),
        "storyAnalysis": story_analysis,
        **build_departments(),
        **build_emergency(),
        **build_suicides(),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Écrit : {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
