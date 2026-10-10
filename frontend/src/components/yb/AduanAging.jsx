// Aging view: all aduans grouped by age from created date. Expand bucket for category/staff split.
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import Sheet from "../ui/Sheet";
import { textLink } from "../ui/styles";
import { parseStamp, ybCategories, ybComplaints } from "../../data/ybSample";
import { staffName, ybCaseGroups, ybStaff } from "../../data/ybStaff";

const TODAY = Date.parse("2026-10-03T00:00:00Z");
const DAY = 86400000;

const BUCKETS = [
  { id: "0-30", label: "0–30 days", min: 0, max: 30 },
  { id: "31-60", label: "31–60 days", min: 31, max: 60 },
  { id: "61-90", label: "61–90 days", min: 61, max: 90 },
  { id: "91-180", label: "91–180 days", min: 91, max: 180 },
  { id: "180+", label: "180+ days", min: 181, max: Infinity },
];

const ageDays = (c) => Math.floor((TODAY - parseStamp(c.date)) / DAY);

function bucketOf(c) {
  const age = ageDays(c);
  return BUCKETS.find((b) => age >= b.min && age <= b.max) ?? BUCKETS[0];
}

export default function AduanAging() {
  const [open, setOpen] = useState("0-30");
  const [mode, setMode] = useState("category");

  const groups = useMemo(() => {
    const out = Object.fromEntries(BUCKETS.map((b) => [b.id, []]));
    ybComplaints.forEach((c) => out[bucketOf(c).id].push(c));
    return out;
  }, []);

  const total = ybComplaints.length;

  return (
    <Sheet title="Aduans by aging" className="h-full">
      <p className="px-4 pt-3 text-xs text-ink-soft md:px-5">Age from created date · all statuses · as of 3 Oct 2026.</p>
      <ul className="divide-y divide-line">
        {BUCKETS.map((b) => {
          const items = groups[b.id];
          const isOpen = open === b.id;
          const pct = total ? Math.round((items.length / total) * 100) : 0;
          return (
            <li key={b.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : b.id)}
                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left md:px-5"
              >
                <ChevronDown className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-ink">{b.label}</span>
                    <span className="tabular text-sm font-extrabold text-ink">
                      {items.length} <span className="font-normal text-ink-soft">· {pct}%</span>
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 md:px-5 md:pl-11">
                  <div role="group" aria-label={`Breakdown for ${b.label}`} className="flex gap-1 pb-2">
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
                  {items.length === 0 ? (
                    <p className="py-2 text-sm text-ink-soft">No aduans in this range.</p>
                  ) : mode === "category" ? (
                    <ul className="divide-y divide-line rounded-2xl border border-line">
                      {ybCategories.map((cat) => {
                        const n = items.filter((c) => c.category === cat).length;
                        if (!n) return null;
                        return (
                          <li key={cat} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-bold text-ink">{cat}</span>
                            <span className="tabular font-semibold text-ink-soft">{n}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ul className="divide-y divide-line rounded-2xl border border-line">
                      {[{ id: null, name: "Unassigned" }, ...ybStaff].map((s) => {
                        const key = s.id ?? "unassigned";
                        const n = items.filter((c) => {
                          const owner = c.case_group_id
                            ? ybCaseGroups.find((g) => g.id === c.case_group_id)?.owner_staff_id ?? null
                            : null;
                          return owner === (s.id ?? null);
                        }).length;
                        if (!n) return null;
                        return (
                          <li key={key} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-bold text-ink">
                              {s.id ? staffName(s.id) : "Unassigned"} <span className="font-normal text-ink-soft">· {s.name === "Unassigned" ? "pool" : s.role}</span>
                            </span>
                            <span className="tabular font-semibold text-ink-soft">{n}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
