"""Provenance des seules données utilisées par les graphiques publiés."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

SOURCE_DEFINITIONS = [{'dataset': 'episodes-depressif-indicateurs-du-barometre-2024',
  'title': 'Épisodes dépressifs : Indicateurs du Baromètre de Santé publique France 2024',
  'published_period': '2024',
  'output_field': 'social',
  'exports': ['episodes-depressif-indicateurs-du-barometre-2024.csv']},
 {'dataset': 'gestes-auto-infliges-passages-aux-urgences-departement',
  'title': 'Gestes auto-infligés : Passages aux urgences (Département)',
  'published_period': '2020–2024',
  'output_field': 'emergencyDepartments',
  'exports': ['gestes-auto-infliges-passages-aux-urgences-departement.csv']},
 {'dataset': 'gestes-auto-infliges-patients-hospitalises-france',
  'title': 'Gestes auto-infligés : Patients hospitalisés (France)',
  'published_period': '2019–2024',
  'output_field': 'odissePatients',
  'exports': ['gestes-auto-infliges-patients-hospitalises-france.csv']},
 {'dataset': 'suicides-deces-departement',
  'title': 'Suicides : Décès (Département)',
  'published_period': '2019–2023',
  'output_field': 'suicideDepartments',
  'exports': ['suicides-deces-departement.csv']},
 {'dataset': 'trouble-anxieux-generalise-indicateurs-du-barometre-2024',
  'title': 'Trouble anxieux généralisé : Indicateurs du Baromètre de Santé publique France 2024',
  'published_period': '2024',
  'output_field': 'social',
  'exports': ['trouble-anxieux-generalise-indicateurs-du-barometre-2024.csv']},
 {'dataset': 'gestes-auto-infliges-passages-aux-urgences-france',
  'title': 'Gestes auto-infligés : Passages aux urgences (France)',
  'published_period': '2020–2024',
  'output_field': 'emergencyNational',
  'exports': ['gestes-auto-infliges-passages-aux-urgences-france.csv']},
 {'dataset': 'gestes-auto-infliges-hospitalisations-departement',
  'title': 'Gestes auto-infligés : Hospitalisations (Département)',
  'published_period': '2019–2024',
  'output_field': 'departments',
  'exports': ['gestes-auto-infliges-hospitalisations-departement.csv']},
 {'dataset': 'suicides-deces-france',
  'title': 'Suicides : Décès (France)',
  'published_period': '2019–2023',
  'output_field': 'suicideNational',
  'exports': ['suicides-deces-france.csv']},
 {'dataset': 'gestes-auto-infliges-hospitalisations-france',
  'title': 'Gestes auto-infligés : Hospitalisations (France)',
  'published_period': '2019–2024',
  'output_field': 'national',
  'exports': ['gestes-auto-infliges-hospitalisations-france.csv']},
 {'dataset': 'conduites-sucidaires-indicateurs-du-barometre-2024',
  'title': 'Conduites suicidaires : Indicateurs du Baromètre de Santé publique France 2024',
  'published_period': '2024',
  'output_field': 'social',
  'exports': ['conduites-sucidaires-indicateurs-du-barometre-2024.csv']},
 {'dataset': 'sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_reg',
  'title': 'Santé mentale : Episodes dépressifs caractérisés dans les 12 derniers mois (Région)',
  'published_period': '2005, 2010, 2017, 2021',
  'output_field': 'declaredHistory',
  'exports': ['depression-historique-region-page1.json',
              'depression-historique-region-page2.json']},
 {'dataset': 'sante-mentale-episodes-depressifs-caracterises-dans-les-12-derniers-mois_fra',
  'title': 'Santé mentale : Episodes dépressifs caractérisés dans les 12 derniers mois (France)',
  'published_period': '2005, 2010, 2017, 2021',
  'output_field': 'declaredHistory',
  'exports': ['depression-historique-france.json']},
 {'dataset': 'sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_reg',
  'title': 'Santé mentale : Pensées suicidaires et tentatives de suicide (Région)',
  'published_period': '2005, 2010, 2017, 2021',
  'output_field': 'declaredHistory',
  'exports': ['conduites-suicidaires-historique-region-page1.json',
              'conduites-suicidaires-historique-region-page2.json']},
 {'dataset': 'sante-mentale-pensees-suicidaires-et-tentatives-de-suicide_fra',
  'title': 'Santé mentale : Pensées suicidaires et tentatives de suicide (France)',
  'published_period': '2005, 2010, 2017, 2021',
  'output_field': 'declaredHistory',
  'exports': ['conduites-suicidaires-historique-france.json']}]

def write_source_registry(root: Path, payload_path: Path) -> None:
    sources = []
    for definition in SOURCE_DEFINITIONS:
        source = {key: value for key, value in definition.items() if key != "exports"}
        source.update({"publisher": "Santé publique France", "platform": "Odissé", "license": "Licence Ouverte 2.0", "url": f"https://odisse.santepubliquefrance.fr/explore/dataset/{definition['dataset']}/", "raw_exports": []})
        for name in definition["exports"]:
            path = root / "data" / "raw" / "odisse" / name
            source["raw_exports"].append({"path": str(path.relative_to(root)), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "url": "https://github.com/m4nR3is/odisse-sante-mentale/blob/main/" + str(path.relative_to(root))})
        sources.append(source)
    registry = {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "scope": "14 jeux Odissé utilisés par les graphiques, complétés par les contours IGN/INSEE documentés pour la carte de sélection. Archives DREES et ancien fichier géographique non sourcé exclus de la livraison web.", "data_file": payload_path.name, "data_sha256": hashlib.sha256(payload_path.read_bytes()).hexdigest(), "transformations": "https://github.com/m4nR3is/odisse-sante-mentale/blob/main/scripts/build_web_data.py", "notes": ["Les taux et effectifs diffusés peuvent être arrondis. Les références regroupées par âge sont approchées ; la référence décès des 0–17 ans n’est pas reconstruite.", "Les évolutions et rapports présentés sont calculés à partir des données préparées, sans inférence causale.", "Les empreintes identifient les exports effectivement utilisés ; la date generated est celle de préparation du fichier web, pas celle de collecte de l’enquête."], "sources": sources}
    geography_path = payload_path.with_name("geography.json")
    if geography_path.exists():
        geography = json.loads(geography_path.read_text())
        registry["geography"] = {**geography["source"], "file": "geography.json", "sha256": hashlib.sha256(geography_path.read_bytes()).hexdigest(), "script": "https://github.com/m4nR3is/odisse-sante-mentale/blob/main/scripts/build_geography.py"}
    payload_path.with_name("sources.json").write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
