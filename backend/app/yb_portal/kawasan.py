"""Kawasan geo service.

Peninsular 2018 delimitation read from the same parquet files the
citizen intake constituency resolver uses, loaded once and held in
memory. State view returns every feature of a state; kod lookup
returns one feature. Point-in-boundary uses ray-cast so pin flags
stay exact.
"""

import os
import re
from math import floor

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
FILES = {
    "parlimen": os.path.join(DATA_DIR, "peninsular_2018_parlimen.parquet"),
    "dun": os.path.join(DATA_DIR, "peninsular_2018_dun.parquet"),
}

CODE_KEY = {"parlimen": "code_parlimen", "dun": "code_dun"}

_cache = None


def normalize_kod(kod) -> str:
    s = str(kod if kod is not None else "").strip().upper()
    s = re.sub(r"^([PN])\s?0*(\d+)$", r"\1.\2", s)
    s = re.sub(r"^([PN])(\d+)$", r"\1.\2", s)
    return s


def load_geo():
    global _cache
    if _cache is None:
        import geopandas as gpd

        _cache = {level: gpd.read_parquet(path) for level, path in FILES.items()}
    return _cache


def _round_coords(coords):
    # Half-up to 5dp so served boundaries stay stable.
    if isinstance(coords, bool):
        return coords
    if isinstance(coords, (int, float)):
        return floor(coords * 1e5 + 0.5) / 1e5
    return [_round_coords(c) for c in coords]


def _feature(row, level: str) -> dict:
    from shapely.geometry import mapping

    props = {c: row[c] for c in load_geo()[level].columns if c != "geometry"}
    geometry = mapping(row["geometry"])
    geometry["coordinates"] = _round_coords(geometry["coordinates"])
    return {"type": "Feature", "properties": props, "geometry": geometry}


def negeri_view(level: str, state) -> dict | None:
    gdf = load_geo().get(level)
    if gdf is None:
        return None
    want = str(state if state is not None else "").strip().lower()
    rows = gdf[gdf["state"].astype(str).str.lower() == want]
    return {"type": "FeatureCollection", "features": [_feature(r, level) for _, r in rows.iterrows()]}


def kod_feature(level: str, kod, state) -> dict | None:
    gdf = load_geo().get(level)
    if gdf is None:
        return None
    key = CODE_KEY[level]
    want = normalize_kod(kod)
    want_state = str(state if state is not None else "").strip().lower()
    for _, row in gdf.iterrows():
        if normalize_kod(row.get(key)) != want:
            continue
        if want_state and str(row.get("state") or "").strip().lower() != want_state:
            continue
        return _feature(row, level)
    return None


def point_in_ring(lng: float, lat: float, ring) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def feature_contains(feature: dict, lng: float, lat: float) -> bool:
    if not feature or not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        return False
    g = (feature or {}).get("geometry") or {}
    coords = g.get("coordinates")
    if g.get("type") == "Polygon":
        return any(point_in_ring(lng, lat, ring) for ring in coords)
    if g.get("type") == "MultiPolygon":
        return any(point_in_ring(lng, lat, ring) for poly in coords for ring in poly)
    return False
