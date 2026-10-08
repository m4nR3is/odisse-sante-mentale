"""Contours de sélection SVG : IGN/INSEE 2018 via france-geojson."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/geography"


def rings(feature):
    geometry = feature["geometry"]
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    return [ring for polygon in polygons for ring in polygon]


def project(point):
    # Lambert conforme conique, parallèles 44° / 49°, méridien 3°.
    lon, lat = map(math.radians, point[:2])
    phi1, phi2 = map(math.radians, [44, 49])
    n = math.log(math.cos(phi1) / math.cos(phi2)) / math.log(math.tan(math.pi / 4 + phi2 / 2) / math.tan(math.pi / 4 + phi1 / 2))
    f = math.cos(phi1) * math.tan(math.pi / 4 + phi1 / 2) ** n / n
    rho = f / math.tan(math.pi / 4 + lat / 2) ** n
    theta = n * (lon - math.radians(3))
    return rho * math.sin(theta), rho * math.cos(theta)  # SVG : le nord doit avoir un y plus petit.


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    def distance(p):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
        return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
    index = max(range(1, len(points) - 1), key=lambda i: distance(points[i]))
    if distance(points[index]) <= tolerance:
        return [a, b]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def fit(features, box):
    positions = [project(point) for feature in features for ring in rings(feature) for point in ring]
    xmin, ymin = map(min, zip(*positions))
    xmax, ymax = map(max, zip(*positions))
    bx, by, width, height = box
    scale = min(width / (xmax - xmin), height / (ymax - ymin))
    ox, oy = bx + (width - (xmax - xmin) * scale) / 2, by + (height - (ymax - ymin) * scale) / 2
    def position(point):
        x, y = project(point)
        return ox + (x - xmin) * scale, oy + (y - ymin) * scale
    return position


def build_layer(name, regions=False):
    features = json.loads((RAW / name).read_text())["features"]
    is_overseas = lambda feature: int(feature["properties"]["code"]) < 10 if regions else len(feature["properties"]["code"]) > 2
    mainland = [f for f in features if not is_overseas(f)]
    mainland_position = fit(mainland, (5, 4, 229, 228))
    output, insets = [], []
    overseas_index = 0
    for feature in features:
        code, label = feature["properties"]["code"], feature["properties"]["nom"]
        overseas = is_overseas(feature)
        if overseas:
            y = 5 + overseas_index * 45
            position = fit([feature], (248, y, 45, 31))
            insets.append({"label": code, "x": 270, "y": y + 40})
            overseas_index += 1
        else:
            position = mainland_position
        paths = []
        for ring in rings(feature):
            points = simplify([position(point) for point in ring], .25)
            if len(points) >= 4:
                paths.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in points) + "Z")
        output.append({"code": code, "name": label, "path": "".join(paths), "overseas": overseas})
    return {"features": output, "insets": insets}


def main():
    source = json.loads((RAW / "source.json").read_text())
    source["raw_exports"] = [{"path": str(p.relative_to(ROOT)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in [RAW / name for name in source["files"]]]
    source["transformations"] = "Projection Lambert conforme conique (44°/49°, méridien 3°), ajustement des encarts séparément, simplification Douglas-Peucker à 0,25 unité SVG. Évolution comparable encodée en gris par la vue active ; encarts hors échelle. COM non fournies par la source : boutons séparés."
    payload = {"source": source, "departments": build_layer("departements-avec-outre-mer.geojson"), "regions": build_layer("regions-avec-outre-mer.geojson", True)}
    output = ROOT / "public/data/geography.json"
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Contours SVG sourcés : {output.stat().st_size / 1000:.1f} ko")


if __name__ == "__main__":
    main()
