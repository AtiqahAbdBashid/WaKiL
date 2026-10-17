// Analytics: Charts tab (mix, trend, aging) and Map tab (Kawasan boundary with pins).
// Map section keeps the former standalone map view; charts reuse the dashboard widgets.
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import Sheet from "../../components/ui/Sheet";
import { formatDate, formatDisplayRef } from "../../data/ybSample";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import { ybApi } from "../../lib/ybApi";
import { AduanMixChart, AduanTrendChart } from "../../components/yb/AduanCharts";
import AduanAging from "../../components/yb/AduanAging";
import AduanAgingTable from "../../components/yb/AduanAgingTable";

const KawasanMap = lazy(() => import("../../components/yb/KawasanMap"));

// Complaints have no locality column yet, so the area list stays empty until one exists.
const groupByArea = (complaints) =>
  [...new Set(complaints.map((c) => c.locality).filter(Boolean))]
    .map((locality) => {
      const items = complaints.filter((c) => c.locality === locality);
      return { area: locality, items, open: items.filter((c) => c.status !== "Resolved").length };
    })
    .sort((a, b) => b.open - a.open);

const TABS = [
  { id: "charts", label: "Charts" },
  { id: "map", label: "Map" },
];

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "map" ? "map" : "charts";
  const setTab = (next) => setSearchParams(next === "map" ? { tab: "map" } : {}, { replace: true });

  return (
    <div className="w-full space-y-8">
      <PageTitle
        title="Analytics"
        subtitle="Complaint patterns and the constituency map."
        action={
          <div className="flex gap-1" role="tablist" aria-label="Analytics sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-11 rounded px-3 text-sm font-bold ${
                  tab === t.id ? "bg-brand text-white" : "text-ink hover:bg-canvas"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {tab === "charts" ? (
        <div role="tabpanel" aria-label="Charts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AduanMixChart hideAnalyticsLink />
            <AduanTrendChart />
          </div>
          <AduanAging />
          <AduanAgingTable />
        </div>
      ) : (
        <div role="tabpanel" aria-label="Map">
          <MapSection />
        </div>
      )}
    </div>
  );
}

function MapSection() {
  const { complaints, kawasan } = useYbComplaints();
  const areas = useMemo(() => groupByArea(complaints), [complaints]);
  const [selected, setSelected] = useState("");
  const [level, setLevel] = useState("dun");
  const LEVELS = useMemo(() => [{ level: "dun", kod: kawasan?.kod, codeKey: "code_dun" }], [kawasan]);
  const [geo, setGeo] = useState({});
  const [pinsByLevel, setPinsByLevel] = useState({});
  const current = areas.find((a) => a.area === (selected || areas[0]?.area));
  const cfg = LEVELS.find((l) => l.level === level);
  const negeri = geo[level]?.fc ?? null;
  const mapError = geo[level]?.error ?? null;

  useEffect(() => {
    if (!kawasan || geo[level]) return;
    let live = true;
    ybApi
      .kawasanGeojson({ level, state: kawasan.state })
      .then((fc) => {
        if (live) setGeo((g) => ({ ...g, [level]: { fc } }));
      })
      .catch(() => {
        if (live) setGeo((g) => ({ ...g, [level]: { error: "Kawasan map unavailable. Start the backend, or set VITE_API_URL." } }));
      });
    return () => {
      live = false;
    };
  }, [level, geo, kawasan]);

  useEffect(() => {
    if (!kawasan || pinsByLevel[level]) return;
    let live = true;
    const levelCfg = LEVELS.find((l) => l.level === level);
    ybApi
      .pins({ level, state: kawasan.state, kod: levelCfg.kod })
      .then((p) => {
        if (live) setPinsByLevel((m) => ({ ...m, [level]: p }));
      })
      .catch(() => {
        if (live) setPinsByLevel((m) => ({ ...m, [level]: [] }));
      });
    return () => {
      live = false;
    };
  }, [level, pinsByLevel, kawasan, LEVELS]);

  return (
    <div className="w-full space-y-8">
      <p className="text-base text-ink-soft">{kawasan ? `${kawasan.state} with ${kawasan.kod} ${kawasan.name} highlighted.` : ""}</p>

      <Sheet
        title={`${cfg?.kod} boundary`}
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
                <KawasanMap negeri={negeri} highlightKod={cfg?.kod} codeKey={cfg.codeKey} label={cfg?.kod} pins={pinsByLevel[level] ?? []} />
              </Suspense>
              <p className="mt-2 text-sm text-ink-soft">
                Level: {level} · {negeri.features.length} boundaries · {kawasan?.dun} · Peninsular 2018
              </p>
            </>
          )}
        </div>
      </Sheet>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Sheet title="Areas">
          {areas.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">No complaint areas yet.</p>
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
                  <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatDisplayRef(c)}</p>
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
