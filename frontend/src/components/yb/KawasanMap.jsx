// Kawasan map: negeri FeatureCollection with the office kod highlighted.
// Pins = Aduan points, colored by status (grey when outside Kawasan).
// Pins never refit the map; negeri bounds set once at construction.
// Blank style, no tile tokens. Expects WebGL; falls back to text.
import { useEffect, useRef, useState } from "react";
import { Map, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PIN_COLORS, pinColor } from "../../data/aduanPins";

const norm = (kod) =>
  String(kod ?? "").trim().toUpperCase().replace(/^([PN])\s?0*(\d+)$/, "$1.$2").replace(/^([PN])(\d+)$/, "$1.$2");

function bboxOf(fc) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]);
      x1 = Math.max(x1, c[0]); y1 = Math.max(y1, c[1]);
    } else c.forEach(walk);
  };
  fc.features.forEach((f) => walk(f.geometry.coordinates));
  return [[x0, y0], [x1, y1]];
}

function counts(pins) {
  const c = { Pending: 0, "In Progress": 0, Resolved: 0, Outside: 0 };
  for (const p of pins ?? []) {
    if (p.inside === false) c.Outside += 1;
    else if (c[p.status] !== undefined) c[p.status] += 1;
  }
  return c;
}

export default function KawasanMap({ negeri, highlightKod, codeKey = "code_parlimen", label, pins = [] }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const legend = counts(pins);

  useEffect(() => {
    if (!negeri?.features?.length || !ref.current) return;
    let map;
    try {
      map = new Map({
        container: ref.current,
        style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#f5f1e8" } }] },
        bounds: bboxOf(negeri),
        fitBoundsOptions: { padding: 24 },
        attributionControl: false,
      });
      map.scrollZoom.disable();
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    } catch {
      // Map constructor throws synchronously when WebGL is unavailable;
      // no async subscription point exists, so flag it here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return undefined;
    }
    const highlight = {
      type: "FeatureCollection",
      features: negeri.features.filter((f) => norm(f.properties?.[codeKey]) === norm(highlightKod)),
    };
    const pinFc = {
      type: "FeatureCollection",
      features: (pins ?? []).map((p) => ({
        type: "Feature",
        properties: { id: p.id, title: p.title, status: p.status, color: pinColor(p) },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    };
    map.on("load", () => {
      map.addSource("negeri", { type: "geojson", data: negeri });
      map.addSource("highlight", { type: "geojson", data: highlight });
      map.addSource("pins", { type: "geojson", data: pinFc });
      map.addLayer({ id: "negeri-fill", type: "fill", source: "negeri", paint: { "fill-color": "#e3ddcc", "fill-opacity": 1 } });
      map.addLayer({ id: "negeri-line", type: "line", source: "negeri", paint: { "line-color": "#a8a29e", "line-width": 1 } });
      map.addLayer({ id: "hl-fill", type: "fill", source: "highlight", paint: { "fill-color": "#2563eb", "fill-opacity": 0.22 } });
      map.addLayer({ id: "hl-line", type: "line", source: "highlight", paint: { "line-color": "#1d4ed8", "line-width": 2.5 } });
      map.addLayer({
        id: "pins",
        type: "circle",
        source: "pins",
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });
      map.on("click", "pins", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new Popup({ closeButton: false })
          .setLngLat(f.geometry.coordinates)
          .setHTML(`<strong>${f.properties.title}</strong><br/>${f.properties.status}`)
          .addTo(map);
      });
    });
    return () => map.remove();
  }, [negeri, highlightKod, codeKey, pins]);

  if (failed) {
    return (
      <div className="mx-auto flex aspect-[9/10] w-full max-w-[560px] items-center justify-center rounded bg-canvas p-6 text-center text-sm text-ink-soft">
        Map needs WebGL. {label ?? highlightKod} boundary unavailable on this device.
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* 9/10 matches Selangor negeri bounds (~0.9 w/h); 560px caps height on wide sheets. */}
      <div ref={ref} role="img" aria-label={`${highlightKod} boundary highlighted`} className="aspect-[9/10] w-full overflow-hidden rounded" />
      {pins?.length > 0 ? (
        <>
          <ul aria-label="Aduan pins by status" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            {Object.entries({ ...PIN_COLORS }).map(([status, color]) => {
              const n = status === "Outside" ? legend.Outside : legend[status] ?? 0;
              return (
                <li key={status} className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  {status} ({n})
                </li>
              );
            })}
          </ul>
          <ul className="sr-only">
            {pins.map((p) => (
              <li key={p.id}>{p.title}, {p.inside === false ? "outside Kawasan" : p.status}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">No Aduan pins in this Kawasan yet.</p>
      )}
    </div>
  );
}
