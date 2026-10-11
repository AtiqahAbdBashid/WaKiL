// YB home: office overview for Representative, personal queue for Aide and Intern.
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Eye, EyeOff, MapPin, Pencil, RotateCcw } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import { primaryButton, secondaryButton, textLink } from "../../components/ui/styles";
import { ybKawasan } from "../../data/ybKawasan";
import { aduanPins } from "../../data/aduanPins";
import { ybApi } from "../../lib/ybApi";
import { formatDate, formatDisplayRef } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import { AduanMixChart, AduanTrendChart } from "../../components/yb/AduanCharts";
import AduanAging from "../../components/yb/AduanAging";
import AduanAgingTable from "../../components/yb/AduanAgingTable";
import SortableWidget from "../../components/yb/SortableWidget";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_ORDER,
  layoutKey,
  loadDashboardLayout,
  moveId,
  resolveSpans,
  resolveRowSpans,
  saveDashboardLayout,
} from "../../components/yb/dashboardLayout";

const KawasanMap = lazy(() => import("../../components/yb/KawasanMap"));
const AttentionList = lazy(() => import("../../components/yb/AttentionList"));

export default function DashboardPage() {
  const { user } = useYbAuth();
  if (user?.role === "Aide" || user?.role === "Intern") return <MyQueueDashboard user={user} />;
  // Remount per user so the per-user persisted layout reloads from localStorage.
  return <RepresentativeDashboard key={user?.id ?? "anon"} />;
}

const STALE_CUT = Date.parse("2026-10-03T00:00:00Z") - 60 * 86400000;
const isOpen = (c) => c.status === "Pending" || c.status === "In Progress";
const isStale = (c) => c.status === "In Progress" && Date.parse(c.updatedAt) <= STALE_CUT;

function MyQueueDashboard({ user }) {
  const firstName = user.name.split(" ")[0];
  const isIntern = user.role === "Intern";
  const { complaints, groupOwnerOf } = useYbComplaints();
  const mine = useMemo(() => complaints.filter((c) => groupOwnerOf(c) === user.id), [complaints, user.id, groupOwnerOf]);
  const mineOpen = useMemo(() => mine.filter(isOpen).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)), [mine]);
  const mineStale = useMemo(() => mine.filter(isStale), [mine]);
  const mineFlagged = useMemo(() => mine.filter((c) => c.needsRepresentativeAttention), [mine]);
  const pool = useMemo(
    () => complaints.filter((c) => !c.case_group_id && c.status === "Pending").sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    [complaints]
  );
  const activity = useMemo(
    () =>
      complaints.flatMap((c) => (c.history ?? []).filter((h) => h.by === user.id).map((h) => ({ ...h, ref: c.id, title: c.title })))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
        .slice(0, 5),
    [complaints, user.id]
  );
  const stats = [
    { label: "My open", value: mineOpen.length, hint: `${mine.filter((c) => c.status === "Pending").length} Pending · ${mine.filter((c) => c.status === "In Progress").length} In Progress`, box: "border-brand/20 bg-brand-soft", valueClass: "text-brand-dark" },
    { label: "Gone stale", value: mineStale.length, hint: "In Progress untouched 60d+", box: "border-accent/20 bg-accent-soft", valueClass: "text-accent-dark" },
    { label: "In pool to group", value: pool.length, hint: "Ungrouped Pending", box: "border-mint/20 bg-mint-soft", valueClass: "text-mint-dark" },
    { label: "With Representative", value: mineFlagged.length, hint: "Flagged, awaiting review", box: "border-line bg-paper-raised", valueClass: "text-ink" },
  ];

  return (
    <div className="w-full space-y-8 md:space-y-10">
      <PageTitle
        title={`${firstName}, your queue`}
        subtitle={`${mineOpen.length} open assigned to you · ${pool.length} waiting in pool.`}
        action={
          <Link to="/yb/complaints/assigned" className="inline-flex min-h-11 items-center rounded-2xl bg-brand px-4 text-sm font-bold text-white">
            Open assigned
          </Link>
        }
      />
      <SampleNote label="Note:">This dashboard uses sample data until the complaint system is connected.</SampleNote>
      {isIntern && (
        <p className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft md:px-5">
          Grouping only. Group from pool and move Pending to In Progress. Resolved and reassign stay with Representative and Aide.
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.box}`}>
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</dt>
            <dd className={`tabular mt-1 text-3xl font-extrabold ${s.valueClass}`}>{s.value}</dd>
            <dd className="mt-0.5 text-xs text-ink-soft">{s.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
        <Sheet
          title={`My tasks · ${mineOpen.length}`}
          className="lg:col-span-2"
          action={
            <Link to="/yb/complaints/assigned" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
              View mine
            </Link>
          }
        >
          {mineOpen.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Queue clear. Group from pool to keep it moving.</p>
          ) : (
            <ul className="divide-y divide-line">
              {mineOpen.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0">
                    <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatDisplayRef(c)}</p>
                    <p className="truncate text-base font-bold text-ink">{c.title}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {c.category} · {c.locality} · since {formatDate(c.date)}
                      {isStale(c) ? " · stale" : ""}
                      {c.needsRepresentativeAttention ? " · with Representative" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line px-2 py-1 text-xs font-bold text-ink-soft">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>

        <Sheet
          title={`Pool · ${pool.length}`}
          action={
            <Link to="/yb/complaints/pool" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
              Group
            </Link>
          }
        >
          {pool.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Pool empty.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pool.slice(0, 6).map((c) => (
                <li key={c.id} className="px-4 py-3 md:px-5">
                  <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatDisplayRef(c)}</p>
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="text-xs text-ink-soft">{c.category} · {c.locality} · {formatDate(c.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </div>

      <Sheet title="My recent activity">
        {activity.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft md:px-5">No actions yet in this sample.</p>
        ) : (
          <ul className="divide-y divide-line">
            {activity.map((h, i) => (
              <li key={`${h.ref}-${h.at}-${i}`} className="px-4 py-3 text-sm md:px-5">
                <span className="tabular font-semibold text-accent-ink">Ref. {formatDisplayRef(h.ref)}</span>{" "}
                <span className="font-bold text-ink">{h.title}</span>{" "}
                <span className="text-ink-soft">· {h.detail} · {formatDate(h.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

function RepresentativeDashboard() {
  const { user } = useYbAuth();
  const { complaints, groupOwnerOf } = useYbComplaints();
  const key = layoutKey(user?.id);
  // Per-group workload: members share their group's owner as single assignee.
  const ownerOf = (c) => groupOwnerOf(c);
  const workload = useMemo(
    () =>
      ybStaff.map((s) => ({
        staff: s,
        total: complaints.filter((c) => ownerOf(c) === s.id).length,
        open: complaints.filter((c) => ownerOf(c) === s.id && c.status !== "Resolved").length,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complaints]
  );
  const pool = complaints.filter((c) => !c.case_group_id).length;
  const totalComplaints = complaints.length;

  const [negeri, setNegeri] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [pins, setPins] = useState(aduanPins);
  useEffect(() => {
    let live = true;
    ybApi
      .kawasanGeojson({ level: ybKawasan.level, state: ybKawasan.state })
      .then((fc) => {
        if (live) setNegeri(fc);
      })
      .catch(() => {
        if (live) setMapError("Kawasan map unavailable. Start the backend, or set VITE_API_URL.");
      });
    ybApi
      .pins({ level: ybKawasan.level, state: ybKawasan.state, kod: ybKawasan.kod })
      .then((p) => {
        if (live && p?.length) setPins(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [widgetsOpen, setWidgetsOpen] = useState(false);
  const [order, setOrder] = useState(() => loadDashboardLayout(key).order);
  const [hidden, setHidden] = useState(() => loadDashboardLayout(key).hidden);

  const persist = (nextOrder, nextHidden) =>
    saveDashboardLayout(layoutKey(user?.id), { order: nextOrder, hidden: nextHidden });

  const visibleIds = order.filter((id) => !hidden.includes(id));
  const widgetById = useMemo(() => Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.id, w])), []);
  const spans = resolveSpans(visibleIds);
  const rowSpans = resolveRowSpans(visibleIds);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id));
      persist(next, hidden);
      return next;
    });
  };

  const moveVisible = (id, dir) => {
    const vis = order.filter((o) => !hidden.includes(o));
    const nextVis = moveId(vis, id, dir);
    if (nextVis === vis) return;
    let k = 0;
    const next = order.map((o) => (hidden.includes(o) ? o : nextVis[k++]));
    setOrder(next);
    persist(next, hidden);
  };

  const hideWidget = (id) => {
    if (visibleIds.length <= 1) return;
    const next = [...hidden, id];
    setHidden(next);
    persist(order, next);
  };

  const toggleWidget = (id) => {
    const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    if (order.filter((o) => !next.includes(o)).length === 0) return;
    setHidden(next);
    persist(order, next);
  };

  const resetLayout = () => {
    setOrder([...DEFAULT_ORDER]);
    setHidden([]);
    persist([...DEFAULT_ORDER], []);
  };

  const kawasanContent = (
    <Sheet
      title={`Kawasan: ${ybKawasan.state}`}
      className="h-full"
      action={
        <Link to="/yb/analytics?tab=map" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          Full map
        </Link>
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
              <KawasanMap negeri={negeri} highlightKod={ybKawasan.kod} pins={pins} />
            </Suspense>
            <p className="mt-2 text-sm text-ink-soft">
              {ybKawasan.kod} {ybKawasan.name} highlighted · {negeri.features.length} {ybKawasan.level} boundaries · Peninsular 2018
            </p>
          </>
        )}
      </div>
    </Sheet>
  );

  const attentionContent = (
    <Sheet title="Needs attention" className="h-full">
      <Suspense fallback={<p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Loading attention list…</p>}>
        <AttentionList />
      </Suspense>
    </Sheet>
  );

  const workloadContent = (
    <Sheet title="Staff workload" className="h-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line text-xs text-ink-soft">
            <th scope="col" className="px-4 py-2 font-bold md:px-5">Staff</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">Open</th>
            <th scope="col" className="px-4 py-2 text-right font-bold md:px-5">Held</th>
          </tr>
        </thead>
        <tbody>
          {workload.map((w) => (
            <tr key={w.staff.id} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-4 py-3 font-medium text-ink md:px-5">
                {w.staff.name} <span className="text-ink-soft">· {w.staff.role}</span>
              </th>
              <td className="tabular px-2 py-3 text-right text-base font-semibold text-ink">{w.open}</td>
              <td className="tabular px-4 py-3 text-right text-base text-ink-soft md:px-5">{w.total}</td>
            </tr>
          ))}
          <tr className="border-b border-line last:border-b-0">
            <th scope="row" className="px-4 py-3 font-medium text-ink md:px-5">Pool <span className="text-ink-soft">· ungrouped</span></th>
            <td className="tabular px-2 py-3 text-right text-base font-semibold text-ink">{pool}</td>
            <td className="tabular px-4 py-3 text-right text-base text-ink-soft md:px-5">{pool}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <th scope="row" className="px-4 py-3 text-sm font-extrabold text-ink md:px-5">Total</th>
            <td colSpan={2} className="tabular px-4 py-3 text-right text-2xl font-semibold text-accent-ink md:px-5">
              {totalComplaints}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="px-4 py-2 text-xs text-ink-soft md:px-5">{staffName("u-representative")} holds none; closes only.</p>
    </Sheet>
  );

  const widgetContent = {
    kawasan: kawasanContent,
    mix: <AduanMixChart />,
    trend: <AduanTrendChart />,
    aging: <AduanAging />,
    "aging-table": <AduanAgingTable />,
    attention: attentionContent,
    workload: workloadContent,
  };

  return (
    <div className="w-full space-y-8 md:space-y-10">
      <PageTitle
        title="Constituency overview"
        subtitle={isEditing ? "Drag to reorder. Changes save automatically." : "What needs the office's attention today."}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <dl className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3 md:min-w-80">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <dt className="text-sm font-bold text-ink">State seat</dt>
                <dd className="tabular mt-0.5 text-sm font-semibold text-accent-ink">N.34 Bukit Gasing</dd>
              </div>
            </dl>
            {isEditing ? (
              <>
                <button
                  type="button"
                  aria-expanded={widgetsOpen}
                  onClick={() => setWidgetsOpen((v) => !v)}
                  className={secondaryButton}
                >
                  {widgetsOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Widgets · {visibleIds.length}/{DASHBOARD_WIDGETS.length}
                </button>
                <button type="button" onClick={resetLayout} className={secondaryButton}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setWidgetsOpen(false);
                  }}
                  className={primaryButton}
                >
                  <Check className="h-4 w-4" />
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-pressed={isEditing}
                onClick={() => setIsEditing(true)}
                className={secondaryButton}
              >
                <Pencil className="h-4 w-4" />
                Edit layout
              </button>
            )}
          </div>
        }
      />

      {isEditing && widgetsOpen && (
        <div className="rounded-2xl border border-line bg-white p-4 md:px-5">
          <p className="text-sm font-bold text-ink">Widgets</p>
          <p className="mt-0.5 text-sm text-ink-soft">Tick to show. Hidden widgets unmount and stop loading.</p>
          <ul className="mt-2 divide-y divide-line">
            {DASHBOARD_WIDGETS.map((w) => {
              const shown = !hidden.includes(w.id);
              return (
                <li key={w.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink">
                    <input
                      type="checkbox"
                      checked={shown}
                      onChange={() => toggleWidget(w.id)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="min-w-0 flex-1 truncate font-bold">{w.label}</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {shown ? "In use" : "Hidden"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <SampleNote label="Note:">This dashboard uses sample data until the complaint system is connected.</SampleNote>

      <p role="status" className="sr-only">
        {visibleIds.length} of {DASHBOARD_WIDGETS.length} widgets shown{isEditing ? ", editing layout" : ""}.
      </p>

      {visibleIds.length === 0 ? (
        <Sheet title="Dashboard empty">
          <div className="px-4 py-10 text-center md:px-5">
            <p className="text-sm text-ink-soft">All widgets hidden. Nothing to show.</p>
            <button type="button" onClick={resetLayout} className={`${primaryButton} mt-4`}>
              <RotateCcw className="h-4 w-4" />
              Show all widgets
            </button>
          </div>
        </Sheet>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
            <div className="grid grid-flow-dense gap-8 lg:grid-cols-6 lg:gap-6">
              {visibleIds.map((id, i) => (
                <SortableWidget
                  key={id}
                  id={id}
                  label={widgetById[id].label}
                  span={spans[id]}
                  rowSpan={rowSpans[id] ?? ""}
                  editing={isEditing}
                  hideDisabled={visibleIds.length <= 1}
                  onHide={hideWidget}
                  onMove={moveVisible}
                  isFirst={i === 0}
                  isLast={i === visibleIds.length - 1}
                >
                  {widgetContent[id]}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
