// Dashboard charts: mix (bar/pie toggle) and weekly trend (status/category toggle).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Sheet from "../ui/Sheet";
import { textLink } from "../ui/styles";
import { ybCategories, ybComplaints, ybStatuses } from "../../data/ybSample";

const STATUS_COLORS = {
  Pending: "#B45309",
  "In Progress": "#1D4ED8",
  Resolved: "#15803D",
};
const CATEGORY_COLORS = ["#1D4ED8", "#B45309", "#15803D", "#7F1D1B", "#6D28D9", "#0E7490", "#BE185D", "#4D7C0F", "#0F766E", "#C026D3", "#EA580C", "#475569", "#A16207"];

const btn = (on) => `${textLink} min-h-11 px-3 text-sm ${on ? "font-extrabold underline" : ""}`;

function ViewToggle({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={btn(value === o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

const weekStart = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const weekLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "UTC" });

export function AduanMixChart() {
  const [view, setView] = useState("Bar");
  const byStatus = useMemo(
    () => ybStatuses.map((s) => ({ label: s, count: ybComplaints.filter((c) => c.status === s).length })),
    []
  );
  const byCategory = useMemo(
    () => ybCategories.map((cat) => ({ label: cat, count: ybComplaints.filter((c) => c.category === cat).length })),
    []
  );
  const rows = view === "Bar" ? byStatus : byCategory;
  const colorOf = (label, i) => (view === "Bar" ? STATUS_COLORS[label] : CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

  return (
    <Sheet
      title={view === "Bar" ? "Aduan by status" : "Aduan by category"}
      className="h-full"
      action={<ViewToggle options={["Bar", "Pie"]} value={view} onChange={setView} label="Mix chart view" />}
    >
      <div className="h-64 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          {view === "Bar" ? (
            <BarChart data={rows} layout="vertical" margin={{ left: 24, right: 16 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {rows.map((r, i) => (
                  <Cell key={r.label} fill={colorOf(r.label, i)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={rows} dataKey="count" nameKey="label" outerRadius={90} label={({ label, count }) => `${label} (${count})`}>
                {rows.map((r, i) => (
                  <Cell key={r.label} fill={colorOf(r.label, i)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="flex justify-end px-4 pb-3 md:px-5">
        <Link to="/yb/analytics" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          Analytics
        </Link>
      </div>
    </Sheet>
  );
}

export function AduanTrendChart() {
  const [mode, setMode] = useState("Status");
  const [cumulative, setCumulative] = useState(false);
  const dims = mode === "Status" ? ybStatuses : ybCategories;
  const series = useMemo(() => {
    const weeks = [...new Set(ybComplaints.map((c) => weekStart(c.date)))].sort();
    const rows = weeks.map((w) => {
      const row = { week: weekLabel(w) };
      dims.forEach((d) => {
        row[d] = ybComplaints.filter((c) => weekStart(c.date) === w && (mode === "Status" ? c.status === d : c.category === d)).length;
      });
      return row;
    });
    if (!cumulative) return rows;
    const running = {};
    dims.forEach((d) => { running[d] = 0; });
    return rows.map((row) => {
      const out = { week: row.week };
      dims.forEach((d) => {
        running[d] += row[d];
        out[d] = running[d];
      });
      return out;
    });
  }, [dims, mode, cumulative]);
  const colorOf = (d, i) => (mode === "Status" ? STATUS_COLORS[d] : CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

  return (
    <Sheet
      title="Aduan trend per week"
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={cumulative}
              onChange={(e) => setCumulative(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Cumulative
          </label>
          <ViewToggle options={["Status", "Category"]} value={mode} onChange={setMode} label="Trend series" />
        </div>
      }
    >
      <div className="h-64 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ left: -12, right: 16 }}>
            <XAxis dataKey="week" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            {dims.map((d, i) => (
              <Line key={d} type="monotone" dataKey={d} stroke={colorOf(d, i)} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="px-4 pb-3 text-xs text-ink-soft md:px-5">{cumulative ? "Running total to each week." : "Received per week of submission."}</p>
    </Sheet>
  );
}
