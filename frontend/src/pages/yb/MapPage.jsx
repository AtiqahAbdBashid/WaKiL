// Kawasan map: negeri view with office boundary highlighted. Live geojson.
import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import Sheet from "../../components/ui/Sheet";
import { formatDate, formatRef, ybComplaints } from "../../data/ybSample";
import { ybKawasan } from "../../data/ybKawasan";
import { aduanPins } from "../../data/aduanPins";
import { ybApi } from "../../lib/ybApi";

const KawasanMap = lazy(() => import("../../components/yb/KawasanMap"));

const LEVELS = [
  { level: "parlimen", kod: ybKawasan.kod, codeKey: "code_parlimen" },
  { level: "dun", kod: ybKawasan.dun.split(" ")[0], codeKey: "code_dun" },
];

const areas = [...new Set(ybComplaints.map((c) => c.area))]
  .map((area) => {
    const items = ybComplaints.filter((c) => c.area === area);
    return { area, items, open: items.filter((c) => c.status !== "Resolved").length };
  })
  .sort((a, b) => b.open - a.open);

export default function MapPage() {
  const [selected, setSelected] = useState(areas[0]?.area ?? "");
  const [level, setLevel] = useState("parlimen");
  const [geo, setGeo] = useState({});
  const [pinsByLevel, setPinsByLevel] = useState({});
  const current = areas.find((a) => a.area === selected);
  const cfg = LEVELS.find((l) => l.level === level);
  const negeri = geo[level]?.fc ?? null;
  const mapError = geo[level]?.error ?? null;

  useEffect(() => {
    if (geo[level]) return;
    let live = true;
    ybApi
      .kawasanGeojson({ level, state: ybKawasan.state })
      .then((fc) => {
        if (live) setGeo((g) => ({ ...g, [level]: { fc } }));
      })
      .catch(() => {
        if (live) setGeo((g) => ({ ...g, [level]: { error: "Kawasan map unavailable. Start the backend, or set VITE_API_URL." } }));
      });
    return () => {
      live = false;
    };
  }, [level, geo]);

  useEffect(() => {
    if (pinsByLevel[level]) return;
    let live = true;
    const cfg = LEVELS.find((l) => l.level === level);
    ybApi
      .pins({ level, state: ybKawasan.state, kod: cfg.kod })
      .then((p) => {
        if (live && p?.length) setPinsByLevel((m) => ({ ...m, [level]: p }));
      })
      .catch(() => {
        if (live) setPinsByLevel((m) => ({ ...m, [level]: aduanPins }));
      });
    return () => {
      live = false;
    };
  }, [level, pinsByLevel]);

  return (
    <div className="w-full space-y-8">
      <PageTitle title="Map" subtitle={`${ybKawasan.state} with ${ybKawasan.kod} ${ybKawasan.name} highlighted.`} />

      <Sheet
        title={`${cfg.kod} boundary`}
        action={
          <div className="flex gap-1" role="group" aria-label="Boundary level">
            {LEVELS.map((l) => (
              <button
                key={l.level}
                onClick={() => setLevel(l.level)}
                aria-pressed={level === l.level}
                className={`min-h-11 rounded px-3 text-sm font-bold ${
                  level === l.level ? "bg-brand text-white" : "text-ink hover:bg-canvas"
                }`}
              >
                {l.level === "parlimen" ? "Parlimen" : "DUN"}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-4 md:px-5">
          {mapError ? (
            <p className="py-10 text-center text-sm text-ink-soft">{mapError}</p>
          ) : !negeri ? (
            <p className="py-10 text-center text-sm text-ink-soft">Loading Kawasan boundaries…</p>
          ) : (
            <>
              <Suspense fallback={<p className="py-10 text-center text-sm text-ink-soft">Loading map…</p>}>
                <KawasanMap negeri={negeri} highlightKod={cfg.kod} codeKey={cfg.codeKey} label={cfg.kod} pins={pinsByLevel[level] ?? aduanPins} />
              </Suspense>
              <p className="mt-2 text-sm text-ink-soft">
                Level: {level} · {negeri.features.length} boundaries · {ybKawasan.dun} · Peninsular 2018
              </p>
            </>
          )}
        </div>
      </Sheet>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Sheet title="Areas">
          {areas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">No areas in this sample yet.</p>
          ) : (
          <ul className="divide-y divide-line">
            {areas.map((a) => (
              <li key={a.area}>
                <button
                  onClick={() => setSelected(a.area)}
                  aria-pressed={selected === a.area}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left transition-colors md:px-5 ${
                    selected === a.area ? "bg-brand text-white" : "text-ink hover:bg-canvas"
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <MapPin className="h-4 w-4" /> {a.area}
                  </span>
                  <span className="tabular text-sm">{a.open} open</span>
                </button>
              </li>
            ))}
          </ul>
          )}
        </Sheet>

        {current ? (
        <Sheet title={`${current.area} · ${current.items.length} complaints`}>
          <ul className="divide-y divide-line">
            {current.items.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-4 md:px-5">
                <div className="min-w-0">
                  <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatRef(c.id)}</p>
                  <p className="mt-0.5 font-bold text-ink">{c.title}</p>
                  <p className="text-sm text-ink-soft">{c.category} · {formatDate(c.date)}</p>
                </div>
                <Badge>{c.status}</Badge>
              </li>
            ))}
          </ul>
        </Sheet>
        ) : (
        <Sheet title="No area selected">
          <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Pick an area once data loads.</p>
        </Sheet>
        )}
      </div>
    </div>
  );
}
