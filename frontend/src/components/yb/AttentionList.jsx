// Attention order: flagged first, then oldest unassigned Pending, then stalest In Progress (60d+ untouched).
import { useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import { textLink } from "../ui/styles";
import { formatDate, formatDisplayRef, ybComplaints } from "../../data/ybSample";

const STALE_DAYS = 60;
const staleCut = Date.parse("2026-10-03T00:00:00Z") - STALE_DAYS * 86400000;

const isStale = (c) => c.status === "In Progress" && Date.parse(c.updatedAt) <= staleCut;

function reason(c) {
  if (c.needsRepresentativeAttention) return "Flagged for Representative";
  if (c.status === "Pending" && !c.assigneeId) return `Unassigned since ${formatDate(c.date)}`;
  return `Stale since ${formatDate(c.updatedAt)}`;
}

const rank = (c) =>
  c.needsRepresentativeAttention ? 0 : c.status === "Pending" && !c.assigneeId ? 1 : 2;

function getAttentionList() {
  return ybComplaints
    .filter((c) => c.needsRepresentativeAttention || (c.status === "Pending" && !c.assigneeId) || isStale(c))
    .sort((a, b) => rank(a) - rank(b) || a.date.localeCompare(b.date));
}

export default function AttentionList() {
  const [expanded, setExpanded] = useState(false);
  const items = getAttentionList();
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
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        {items.length > 10 ? (
          <button onClick={() => setExpanded((v) => !v)} className={`${textLink} min-h-11 px-2 text-sm`}>
            {expanded ? "Show less" : `Show all ${items.length}`}
          </button>
        ) : <span />}
        <Link to="/yb/complaints/pool" className={`${textLink} inline-flex min-h-11 items-center px-2 text-sm`}>
          Open pool
        </Link>
      </div>
    </div>
  );
}
