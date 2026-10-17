// Dashboard charts: mix (bar/pie toggle) and weekly trend (status/category toggle).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Sheet from "../ui/Sheet";
import { textLink } from "../ui/styles";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import { PIN_COLORS as STATUS_COLORS } from "../../data/aduanPins";
import { CATEGORY_COLORS } from "../../data/chartColors";
import { parseStamp, ybStatuses } from "../../data/ybSample";


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
  const d = new Date(parseStamp(iso));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const weekLabel = (iso) => new Date(parseStamp(iso)).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "UTC" });

export function AduanMixChart({ hideAnalyticsLink = false }) {
  const { complaints, categories } = useYbComplaints();
  const [view, setView] = useState("Bar");
  const byStatus = useMemo(
    () => ybStatuses.map((s) => ({ label: s, count: complaints.filter((c) => c.status === s).length })),
    [complaints]
  );
  const byCategory = useMemo(
    () => categories.map((cat) => ({ label: cat, count: complaints.filter((c) => c.category === cat).length })),
    [categories, complaints]
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
      {hideAnalyticsLink ? null : (
      <div className="flex justify-end px-4 pb-3 md:px-5">
        <Link to="/yb/analytics" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          Analytics
        </Link>
      </div>
      )}
    </Sheet>
  );
}

export function AduanTrendChart() {
  const { complaints, categories } = useYbComplaints();
  const [mode, setMode] = useState("Status");
  const [cumulative, setCumulative] = useState(false);
  const dims = mode === "Status" ? ybStatuses : categories;
  const series = useMemo(() => {
    const weeks = [...new Set(complaints.map((c) => weekStart(c.date)))].sort();
    const rows = weeks.map((w) => {
      const row = { week: weekLabel(w) };
      dims.forEach((d) => {
        row[d] = complaints.filter((c) => weekStart(c.date) === w && (mode === "Status" ? c.status === d : c.category === d)).length;
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
  }, [dims, mode, cumulative, complaints]);
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
