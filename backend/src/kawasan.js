// Kawasan geo service: peninsular 2018 delimitation loaded once at boot.
// Negeri view = all features of a state; highlight = single kod feature.
import { readFileSync } from "node:fs";

const FILES = {
  parlimen: new URL("../data/peninsular_2018_parlimen.geojson", import.meta.url),
  dun: new URL("../data/peninsular_2018_dun.geojson", import.meta.url),
};

const CODE_KEY = { parlimen: "code_parlimen", dun: "code_dun" };

export const normalizeKod = (kod) =>
  String(kod ?? "")
    .trim()
    .toUpperCase()
    .replace(/^([PN])\s?0*(\d+)$/, "$1.$2")
    .replace(/^([PN])(\d+)$/, "$1.$2");

let cache = null;

export function loadGeo() {
  if (!cache) {
    cache = Object.fromEntries(
      Object.entries(FILES).map(([level, url]) => [
        level,
        JSON.parse(readFileSync(url, "utf8")),
      ]),
    );
  }
  return cache;
}

export function negeriView(level, state) {
  const fc = loadGeo()[level];
  if (!fc) return null;
  const want = String(state ?? "").trim().toLowerCase();
  const features = fc.features.filter(
    (f) => String(f.properties?.state ?? "").toLowerCase() === want,
  );
  return { type: "FeatureCollection", features };
}

export function kodFeature(level, kod, state) {
  const fc = loadGeo()[level];
  if (!fc) return null;
  const key = CODE_KEY[level];
  const want = normalizeKod(kod);
  const wantState = String(state ?? "").trim().toLowerCase();
  return (
    fc.features.find(
      (f) =>
        normalizeKod(f.properties?.[key]) === want &&
        (!wantState || String(f.properties?.state ?? "").toLowerCase() === wantState),
    ) ?? null
  );
}

// Dependency-free ray-cast. lng = x, lat = y.
export function pointInRing(lng, lat, ring) {
  let inside = false;
  let j = ring.length - 1;
  for (let i = 0; i < ring.length; i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

export function featureContains(feature, lng, lat) {
  const g = feature?.geometry;
  if (!g || typeof lng !== "number" || typeof lat !== "number") return false;
  if (g.type === "Polygon") return g.coordinates.some((ring) => pointInRing(lng, lat, ring));
  if (g.type === "MultiPolygon")
    return g.coordinates.some((poly) => poly.some((ring) => pointInRing(lng, lat, ring)));
  return false;
}
