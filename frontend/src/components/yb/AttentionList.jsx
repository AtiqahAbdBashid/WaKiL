// Attention order: flagged first, then stalest In Progress (60d+ untouched).
// Flagged implies In Progress: only claimed complaints can be flagged.
// Pending never appears here; pool lives under Complaint Pool.
import { useState } from "react";

import Badge from "../ui/Badge";
import { textLink } from "../ui/styles";
import { formatDate, formatDisplayRef } from "../../data/ybSample";
import { useYbComplaints } from "../../context/YbComplaintsContext";

const STALE_DAYS = 60;
const staleCut = Date.parse("2026-10-03T00:00:00Z") - STALE_DAYS * 86400000;

const isStale = (c) => c.status === "In Progress" && Date.parse(c.updatedAt) <= staleCut;

function reason(c) {
  if (c.needsRepresentativeAttention) return "Flagged for Representative";
  return `Stale since ${formatDate(c.updatedAt)}`;
}

const rank = (c) => (c.needsRepresentativeAttention ? 0 : 1);

function getAttentionList(complaints) {
  return complaints
    .filter((c) => c.needsRepresentativeAttention || isStale(c))
    .sort((a, b) => rank(a) - rank(b) || Date.parse(a.date) - Date.parse(b.date));
}

export default function AttentionList() {
  const [expanded, setExpanded] = useState(false);
  const { complaints } = useYbComplaints();
  const items = getAttentionList(complaints);
  const shown = expanded ? items : items.slice(0, 10);

  if (items.length === 0) {
    return <p className="px-4 py-10 text-center text-base text-ink-soft md:px-5">Nothing needs attention. Everything has been picked up.</p>;
  }
  return (
    <div>
      <div className="max-h-[480px] overflow-auto">
      <ul className="divide-y divide-line">
        {shown.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-4 md:px-5">
            <div className="min-w-0">
              <p className="tabular text-xs font-semibold text-accent-ink">Ref. {formatDisplayRef(c)}</p>
              <h3 className="mt-0.5 text-base font-bold text-ink">{c.title}</h3>
              <p className="mt-0.5 text-sm text-ink-soft">
                {c.category} · {c.locality} · {reason(c)}
              </p>
            </div>
            <Badge>{c.status}</Badge>
          </li>
        ))}
      </ul>
      </div>
      {items.length > 10 && (
        <div className="flex items-center px-4 py-3 md:px-5">
          <button onClick={() => setExpanded((v) => !v)} className={`${textLink} min-h-11 px-2 text-sm`}>
            {expanded ? "Show less" : `Show all ${items.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
