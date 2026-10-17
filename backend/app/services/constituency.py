import os
import re
from typing import Tuple, Optional
import geopandas as gpd
from shapely.geometry import Point

_dun_gdf: Optional[gpd.GeoDataFrame] = None
_parlimen_gdf: Optional[gpd.GeoDataFrame] = None

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
DUN_PARQUET = os.path.join(DATA_DIR, "peninsular_2018_dun.parquet")
PARLIMEN_PARQUET = os.path.join(DATA_DIR, "peninsular_2018_parlimen.parquet")


def _get_gdfs():
    global _dun_gdf, _parlimen_gdf
    if _dun_gdf is None and os.path.exists(DUN_PARQUET):
        try:
            _dun_gdf = gpd.read_parquet(DUN_PARQUET)
        except Exception as e:
            print(f"Warning: Failed to load DUN parquet: {e}")

    if _parlimen_gdf is None and os.path.exists(PARLIMEN_PARQUET):
        try:
            _parlimen_gdf = gpd.read_parquet(PARLIMEN_PARQUET)
        except Exception as e:
            print(f"Warning: Failed to load Parlimen parquet: {e}")

    return _dun_gdf, _parlimen_gdf


def resolve_constituency_from_coords(
    lat: float, lng: float
) -> Tuple[Optional[str], Optional[str]]:
    """Given (lat, lng), return (parliament, dun)."""
    dun_gdf, parlimen_gdf = _get_gdfs()
    point = Point(lng, lat)  # x=lng, y=lat

    # 1. First check DUN boundary (covers peninsular states, contains both parliament & dun)
    if dun_gdf is not None:
        try:
            matched = dun_gdf[dun_gdf.contains(point)]
            if not matched.empty:
                row = matched.iloc[0]
                parliament_name = str(row["parlimen"]) if "parlimen" in row else None
                dun_name = str(row["dun"]) if "dun" in row else None
                return parliament_name, dun_name
        except Exception as e:
            print(f"Error querying DUN spatial boundary: {e}")

    # 2. Check Parlimen boundary (covers Federal Territories like KL, Putrajaya, Labuan which have no DUNs)
    if parlimen_gdf is not None:
        try:
            matched = parlimen_gdf[parlimen_gdf.contains(point)]
            if not matched.empty:
                row = matched.iloc[0]
                parliament_name = str(row["parlimen"]) if "parlimen" in row else None
                return parliament_name, None
        except Exception as e:
            print(f"Error querying Parlimen spatial boundary: {e}")

    return None, None


_COORDS = re.compile(r"\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)")


def parse_coordinates(location_str: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """Extract (lat, lng) from a location string like 'Taman Mawar (3.1209, 101.6738)'.

    Returns (None, None) when there is no pair or it is outside valid ranges.
    """
    if not location_str:
        return None, None
    m = _COORDS.search(location_str)
    if not m:
        return None, None
    lat, lng = float(m.group(1)), float(m.group(2))
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None, None
    return lat, lng


def resolve_constituency(
    location_str: Optional[str],
) -> Tuple[Optional[str], Optional[str]]:
    """Extract coordinates from the location string and resolve (parliament, dun)."""
    lat, lng = parse_coordinates(location_str)
    if lat is None:
        return None, None
    return resolve_constituency_from_coords(lat, lng)

