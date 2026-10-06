// YB home: office overview for Wakil, personal queue for Aide and Intern.
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
import { ybComplaints } from "../../data/ybSample";
import { formatDate, formatRef } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
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
  saveDashboardLayout,
} from "../../components/yb/dashboardLayout";

const KawasanMap = lazy(() => import("../../components/yb/KawasanMap"));
const AttentionList = lazy(() => import("../../components/yb/AttentionList"));

export default function DashboardPage() {
  const { user } = useYbAuth();
  if (user?.role === "Aide" || user?.role === "Intern") return <MyQueueDashboard user={user} />;
  return <WakilDashboard key={user?.id ?? "anon"} />;
}

const STALE_CUT = Date.parse("2026-10-03T00:00:00Z") - 60 * 86400000;
const isOpen = (c) => c.status === "Pending" || c.status === "In Progress";
const isStale = (c) => c.status === "In Progress" && Date.parse(c.updatedAt) <= STALE_CUT;

function MyQueueDashboard({ user }) {
  const firstName = user.name.split(" ")[0];
  const isIntern = user.role === "Intern";
  const mine = useMemo(() => ybComplaints.filter((c) => c.assigneeId === user.id), [user.id]);
  const mineOpen = useMemo(() => mine.filter(isOpen).sort((a, b) => a.date.localeCompare(b.date)), [mine]);
  const mineStale = useMemo(() => mine.filter(isStale), [mine]);
  const mineFlagged = useMemo(() => mine.filter((c) => c.needsWakilAttention), [mine]);
  const pool = useMemo(
    () => ybComplaints.filter((c) => !c.assigneeId && c.status === "Pending").sort((a, b) => a.date.localeCompare(b.date)),
    []
  );
  const activity = useMemo(
    () =>
      ybComplaints.flatMap((c) => (c.history ?? []).filter((h) => h.by === user.id).map((h) => ({ ...h, ref: c.id, title: c.title })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [user.id]
  );
  const stats = [
    { label: "My open", value: mineOpen.length, hint: `${mine.filter((c) => c.status === "Pending").length} Pending · ${mine.filter((c) => c.status === "In Progress").length} In Progress` },
    { label: "Gone stale", value: mineStale.length, hint: "In Progress untouched 60d+" },
    { label: "In pool to claim", value: pool.length, hint: "Unassigned Pending" },
    { label: "With Wakil", value: mineFlagged.length, hint: "Flagged, awaiting review" },
  ];

  return (
    <div className="w-full space-y-8 md:space-y-10">
      <PageTitle
        title={`${firstName}, your queue`}
        subtitle={`${mineOpen.length} open assigned to you · ${pool.length} waiting in pool.`}
        action={
          <Link to="/yb/complaints" className="inline-flex min-h-11 items-center rounded-ticket bg-brand px-4 text-sm font-bold text-white">
            Open triage
          </Link>
        }
      />
      <SampleNote label="Note:">This dashboard uses sample data until the complaint system is connected.</SampleNote>
      {isIntern && (
        <p className="rounded-ticket border border-line bg-paper-raised px-4 py-3 text-sm text-ink-soft md:px-5">
          Triage only. Claim from pool and move Pending to In Progress. Resolved and reassign stay with Wakil and Aide.
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-ticket border border-line bg-paper px-4 py-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</dt>
            <dd className="tabular mt-1 text-3xl font-extrabold text-ink">{s.value}</dd>
            <dd className="mt-0.5 text-xs text-ink-soft">{s.hint}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
        <Sheet
          title={`My tasks · ${mineOpen.length}`}
          className="lg:col-span-2"
          action={
            <Link to="/yb/complaints" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
              Triage mine
            </Link>
          }
        >
          {mineOpen.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Queue clear. Claim from pool to keep it moving.</p>
          ) : (
            <ul className="divide-y divide-line">
              {mineOpen.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                  <div className="min-w-0">
                    <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatRef(c.id)}</p>
                    <p className="truncate text-base font-bold text-ink">{c.title}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {c.category} · {c.area} · since {formatDate(c.date)}
                      {isStale(c) ? " · stale" : ""}
                      {c.needsWakilAttention ? " · with Wakil" : ""}
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
            <Link to="/yb/complaints" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
              Claim
            </Link>
          }
        >
          {pool.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">Pool empty.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pool.slice(0, 6).map((c) => (
                <li key={c.id} className="px-4 py-3 md:px-5">
                  <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatRef(c.id)}</p>
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="text-xs text-ink-soft">{c.category} · {c.area} · {formatDate(c.date)}</p>
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
                <span className="tabular font-semibold text-accent-ink">Ref. {formatRef(h.ref)}</span>{" "}
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

function WakilDashboard() {
  const { user } = useYbAuth();
  const key = layoutKey(user?.id);
  const workload = useMemo(
    () =>
      ybStaff.map((s) => ({
        staff: s,
        total: ybComplaints.filter((c) => c.assigneeId === s.id).length,
        open: ybComplaints.filter((c) => c.assigneeId === s.id && c.status !== "Resolved" && c.status !== "Declined").length,
      })),
    []
  );
  const pool = ybComplaints.filter((c) => !c.assigneeId).length;

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
        <Link to="/yb/map" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
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
    <Sheet
      title="Needs attention"
      className="h-full"
      action={
        <Link to="/yb/complaints" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          All complaints
        </Link>
      }
    >
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
            <th scope="row" className="px-4 py-3 font-medium text-ink md:px-5">Pool <span className="text-ink-soft">· unassigned</span></th>
            <td className="tabular px-2 py-3 text-right text-base font-semibold text-ink">{pool}</td>
            <td className="tabular px-4 py-3 text-right text-base text-ink-soft md:px-5">{pool}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-ink">
            <th scope="row" className="px-4 py-3 text-sm font-extrabold text-ink md:px-5">Total</th>
            <td colSpan={2} className="tabular px-4 py-3 text-right text-2xl font-semibold text-accent-ink md:px-5">
              {ybComplaints.length}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="px-4 py-2 text-xs text-ink-soft md:px-5">{staffName("u-wakil")} holds none; closes only.</p>
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
            <dl className="flex items-start gap-3 rounded-ticket border border-line px-4 py-3 md:min-w-80">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <dt className="text-sm font-bold text-ink">Parliament / State seat</dt>
                <dd className="tabular mt-0.5 text-sm font-semibold text-accent-ink">P.108 Shah Alam / N.40 Kota Anggerik</dd>
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
        <div className="rounded-ticket border border-line bg-paper p-4 md:px-5">
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
