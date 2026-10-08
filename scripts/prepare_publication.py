#!/usr/bin/env python3
"""Assemble les fichiers de remise sans publier sur un service distant."""
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "tmp" / "publication" / "defi-1_nom-equipe"


def main():
    dist = ROOT / "dist"
    if not (dist / "index.html").is_file():
        raise SystemExit("Construire le site avec npm run build avant de préparer la remise.")
    production = OUTPUT / "production"
    production.mkdir(parents=True, exist_ok=True)
    doc = (ROOT / "docs" / "DEPOT_GITLAB.md").read_text()
    (OUTPUT / "README.md").write_text(doc)
    links = "\n".join(line for line in doc.splitlines() if line.startswith(("**Visualisation interactive", "**Code source public")))
    (production / "LIENS.md").write_text("# Accès au projet\n\n" + links + "\n\nLe code est également fourni dans `code-source.zip`. Extraire `visualisation.zip` et servir son contenu par HTTP(S) pour consulter la copie compilée.\n")
    filenames = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT
    ).decode().split("\0")
    with zipfile.ZipFile(production / "code-source.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(set(filenames) - {""}):
            path = ROOT / name
            if path.is_file() and not path.is_symlink():
                archive.write(path, name)
    with zipfile.ZipFile(production / "visualisation.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(dist.rglob("*")):
            if path.is_file() and not path.is_symlink():
                archive.write(path, path.relative_to(dist))
    print(f"Dossier préparé : {OUTPUT}")
    if "[À COMPLÉTER" in doc:
        print("À finaliser avant remise : identité, contact et URL publiques dans docs/DEPOT_GITLAB.md, puis relancer ce script.")


if __name__ == "__main__":
    main()
