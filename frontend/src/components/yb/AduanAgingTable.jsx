// Aging table: one row per category or staff. Status counts plus open aduans with no update in each window.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Sheet from "../ui/Sheet";
import { textLink } from "../ui/styles";
import { parseStamp, ybCategories, ybComplaints } from "../../data/ybSample";
import { staffName, ybCaseGroups, ybStaff } from "../../data/ybStaff";

const TODAY = Date.parse("2026-10-03T00:00:00Z");
const DAY = 86400000;

const isOpen = (c) => c.status === "Pending" || c.status === "In Progress";
const staleAge = (c) => Math.floor((TODAY - parseStamp(c.updatedAt)) / DAY);
const inRange = (c, min, max) => isOpen(c) && staleAge(c) >= min && staleAge(c) <= max;

function rowStats(items) {
  return {
    total: items.length,
    resolved: items.filter((c) => c.status === "Resolved").length,
    progress: items.filter((c) => c.status === "In Progress").length,
    pending: items.filter((c) => c.status === "Pending").length,
    s30: items.filter((c) => inRange(c, 30, 60)).length,
    s60: items.filter((c) => inRange(c, 61, 90)).length,
    s90: items.filter((c) => inRange(c, 91, 180)).length,
    s180: items.filter((c) => inRange(c, 181, Infinity)).length,
  };
}

const COLS = [
  { id: "total", label: "Total" },
  { id: "resolved", label: "Resolved" },
  { id: "progress", label: "In progress" },
  { id: "pending", label: "Pending" },
  { id: "s30", label: "No update 30–60d" },
  { id: "s60", label: "No update 61–90d" },
  { id: "s90", label: "No update 91–180d" },
  { id: "s180", label: "No update 180+d" },
];

export default function AduanAgingTable() {
  const [mode, setMode] = useState("category");

  const rows = useMemo(() => {
    // Owner equals worker: staff rows count members of groups they own.
    const ownerOf = (c) =>
      c.case_group_id
        ? ybCaseGroups.find((g) => g.id === c.case_group_id)?.owner_staff_id ?? null
        : null;
    const groups =
      mode === "category"
        ? ybCategories.map((cat) => ({ key: cat, label: cat, sub: null, items: ybComplaints.filter((c) => c.category === cat) }))
        : [
            ...ybStaff.map((s) => ({ key: s.id, label: staffName(s.id), sub: s.role, items: ybComplaints.filter((c) => ownerOf(c) === s.id) })),
            { key: "unassigned", label: "Unassigned", sub: "pool", items: ybComplaints.filter((c) => !ownerOf(c)) },
          ];
    return groups.map((g) => ({ ...g, stats: rowStats(g.items) })).sort((a, b) => b.stats.total - a.stats.total);
  }, [mode]);

  const foot = useMemo(() => rowStats(ybComplaints), []);

  return (
    <Sheet
      title="Aging table"
      className="h-full"
      action={
        <div className="flex" role="group" aria-label="Table grouping">
          {["category", "staff"].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`${textLink} min-h-11 px-3 text-sm ${mode === m ? "font-extrabold underline" : ""}`}
            >
              {m === "category" ? "By category" : "By staff"}
            </button>
          ))}
        </div>
      }
    >
      <p className="px-4 pt-3 text-xs text-ink-soft md:px-5">
        Sorted by total desc · status at 3 Oct 2026 · no-update counts open aduans only, by days since last update.
      </p>
      <div className="overflow-x-auto px-4 py-3 md:px-5">
        <table className="w-full min-w-180 text-left text-sm">
          <thead>
            <tr className="border-b border-ink text-xs text-ink-soft">
              <th scope="col" className="py-2 pr-3 font-bold">{mode === "category" ? "Category" : "Staff"}</th>
              {COLS.map((c) => (
                <th key={c.id} scope="col" className="tabular px-2 py-2 text-right font-bold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-line last:border-b-0">
                <th scope="row" className="py-2 pr-3 font-bold text-ink">
                  {r.label} {r.sub && <span className="font-normal text-ink-soft">· {r.sub}</span>}
                </th>
                {COLS.map((c) => (
                  <td key={c.id} className={`tabular px-2 py-2 text-right ${c.id === "total" ? "font-bold text-ink" : "text-ink-soft"}`}>
                    {r.stats[c.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink font-extrabold text-ink">
              <th scope="row" className="py-2 pr-3">Total</th>
              {COLS.map((c) => (
                <td key={c.id} className="tabular px-2 py-2 text-right">{foot[c.id]}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-end px-4 pb-3 md:px-5">
        <Link to="/yb/complaints/pool" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          Open pool
        </Link>
      </div>
    </Sheet>
  );
}
