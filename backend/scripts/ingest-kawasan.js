// One-off ingest: download peninsular delimitation GeoJSON from
// lake.electiondata.my, round coords to 5dp, write backend/data/.
// Usage: npm run data:kawasan
const SOURCES = {
  "peninsular_2018_parlimen.geojson":
    "https://lake.electiondata.my/maps/delimitations/peninsular_2018_parlimen.geojson",
  "peninsular_2018_dun.geojson":
    "https://lake.electiondata.my/maps/delimitations/peninsular_2018_dun.geojson",
};

const round = (n) => Math.round(n * 1e5) / 1e5;
const roundCoords = (c) =>
  Array.isArray(c) ? (typeof c[0] === "number" ? c.map(round) : c.map(roundCoords)) : c;

for (const [file, url] of Object.entries(SOURCES)) {
  const res = await fetch(url, { headers: { "user-agent": "wakil-ingest/0.1" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const fc = await res.json();
  for (const f of fc.features) f.geometry.coordinates = roundCoords(f.geometry.coordinates);
  const out = new URL(`../data/${file}`, import.meta.url);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(out, JSON.stringify(fc)),
  );
  console.log(file, fc.features.length, "features");
}
