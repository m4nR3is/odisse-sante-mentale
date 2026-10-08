#!/usr/bin/env python3
"""Assemble les fichiers de remise sans publier sur un service distant."""
from datetime import datetime, timezone
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "tmp" / "publication" / "defi-1_Manuel_Reismann"


def main():
    dist = ROOT / "dist"
    if not (dist / "index.html").is_file():
        raise SystemExit("Construire le site avec npm run build avant de préparer la remise.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    production = OUTPUT / "production"
    if production.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup = ROOT.parent / "tmp" / "publication-backups" / stamp
        backup.mkdir(parents=True)
        shutil.move(str(production), str(backup / "production"))
    shutil.copytree(dist, production)
    doc = (ROOT / "docs" / "DEPOT_GITLAB.md").read_text()
    (OUTPUT / "README.md").write_text(doc)
    links = "\n".join(line for line in doc.splitlines() if line.startswith(("**Visualisation interactive", "**Code source public")))
    (production / "LIENS.md").write_text("# Accès au projet\n\n" + links + "\n\nCe dossier contient directement le site compilé : index.html, assets/, data/, favicon.svg et les notices de licence. Conserver toute sa structure et le servir par HTTP(S). Le code source complet, les exports sources et les scripts de préparation sont accessibles dans le dépôt GitHub public ci-dessus.\n")
    for name in ["LICENSE", "LICENSES.md"]:
        shutil.copy2(ROOT / name, OUTPUT / name)
    print(f"Dossier préparé : {OUTPUT}")
    print("Site compilé copié directement dans production/, sans ZIP. Code source : dépôt GitHub public.")
    if "[À COMPLÉTER" in doc:
        print("À finaliser avant remise : les champs signalés dans docs/DEPOT_GITLAB.md, puis relancer ce script.")


if __name__ == "__main__":
    main()
