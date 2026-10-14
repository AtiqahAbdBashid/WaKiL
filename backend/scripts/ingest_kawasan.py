"""One-off ingest: download peninsular delimitation GeoJSON from
lake.electiondata.my, round coords to 5dp, write app/data/ parquet.
Usage: python scripts/ingest_kawasan.py (run from backend/)
"""

import json
import os
import urllib.request
from math import floor

SOURCES = {
    "peninsular_2018_parlimen.parquet":
        "https://lake.electiondata.my/maps/delimitations/peninsular_2018_parlimen.geojson",
    "peninsular_2018_dun.parquet":
        "https://lake.electiondata.my/maps/delimitations/peninsular_2018_dun.geojson",
}

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "data"))


def round_coord(n):
    return floor(n * 1e5 + 0.5) / 1e5


def round_coords(c):
    if isinstance(c, bool):
        return c
    if isinstance(c, (int, float)):
        return round_coord(c)
    if isinstance(c, (list, tuple)):
        return [round_coords(v) for v in c]
    return c


def fetch(url):
    req = urllib.request.Request(url, headers={"user-agent": "wakil-ingest/0.1"})
    with urllib.request.urlopen(req) as res:
        if res.status != 200:
            raise RuntimeError(f"{url}: {res.status}")
        return json.load(res)


def main():
    import geopandas as gpd

    os.makedirs(OUT_DIR, exist_ok=True)
    for filename, url in SOURCES.items():
        fc = fetch(url)
        for feature in fc["features"]:
            geom = feature.get("geometry") or {}
            if "coordinates" in geom:
                geom["coordinates"] = round_coords(geom["coordinates"])
        gdf = gpd.GeoDataFrame.from_features(fc["features"], crs="EPSG:4326")
        gdf = gdf[[c for c in gdf.columns if c != "geometry"] + ["geometry"]]
        out = os.path.join(OUT_DIR, filename)
        gdf.to_parquet(out, index=False)
        print(filename, len(fc["features"]), "features")


if __name__ == "__main__":
    main()
