// Notifications: read-only feed derived from complaint history (no notification
// service yet). Morning pool digest plus flag review digest, scoped by role.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { useYbAuth } from "../../auth/YbAuthContext";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import {
  YB_NOTIFICATION_FILTERS,
  buildFlagDigest,
  buildPoolDigest,
  buildYbNotifications,
  matchesFilter,
  referenceNow,
} from "../../data/ybNotifications";
import { formatDate, formatDateTime, formatDisplayRef } from "../../data/ybSample";
import { staffName } from "../../data/ybStaff";

export default function NotificationsPage() {
  const { user } = useYbAuth();
  const { complaints, caseGroups } = useYbComplaints();
  const [filter, setFilter] = useState("all");

  const now = useMemo(() => referenceNow(complaints), [complaints]);
  const pool = useMemo(() => buildPoolDigest(complaints, now), [complaints, now]);
  const flags = useMemo(
    () => buildFlagDigest(complaints, caseGroups, user),
    [complaints, caseGroups, user]
  );
  const feed = useMemo(
    () => buildYbNotifications(complaints, caseGroups, user),
    [complaints, caseGroups, user]
  );
  const shown = useMemo(() => feed.filter((n) => matchesFilter(n, filter)), [feed, filter]);

  const isRepresentative = user?.role === "Representative";
  const subtitle = isRepresentative
    ? `${pool.total} waiting in pool · ${flags.total} flagged for your review.`
    : `${pool.fresh} new in pool · ${flags.total} flagged on your groups.`;

  return (
    <div className="w-full space-y-8">
      <PageTitle title="Notifications" subtitle={subtitle} />
      <SampleNote label="Note:">
        Read-only feed derived from complaint history until a notification service exists.
      </SampleNote>

      <div className="grid gap-6 lg:grid-cols-2">
        <Sheet title={`Morning pool · ${pool.total}`}>
          <div className="px-4 py-4 md:px-5">
            <p className="text-base text-ink">
              <span className="tabular text-2xl font-extrabold text-accent-ink">{pool.fresh}</span>{" "}
              <span className="font-bold">new since yesterday</span>
              <span className="text-ink-soft"> · {pool.total} unassigned Pending in total</span>
            </p>
            {pool.oldestAt && pool.total > 0 && (
              <p className="mt-1 text-sm text-ink-soft">Oldest waiting since {formatDate(pool.oldestAt)}.</p>
            )}
            {pool.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-soft">Pool empty.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {pool.items.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-2">
                    <p className="tabular text-xs font-semibold text-accent-ink">
                      Ref. {formatDisplayRef(c)}
                    </p>
                    <p className="text-sm font-bold text-ink">{c.title}</p>
                    <p className="text-xs text-ink-soft">
                      {c.category} · {c.locality} · {formatDate(c.date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/yb/complaints/pool" className={`${textLink} mt-3 inline-flex min-h-11 items-center text-sm`}>
              Open the pool to group them
            </Link>
          </div>
        </Sheet>

        <Sheet title={`Evening review · ${flags.total}`}>
          <div className="px-4 py-4 md:px-5">
            {isRepresentative ? (
              <p className="text-sm text-ink-soft">
                Flagged by your Aide or Intern for end-of-day review. Only you see all flags.
              </p>
            ) : (
              <p className="text-sm text-ink-soft">
                Flags on groups you own. The full review list sits with the Representative.
              </p>
            )}
            {flags.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-soft">Nothing flagged for review.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {flags.items.slice(0, 5).map((c) => {
                  const flagBy = (c.history ?? []).find((h) => h.action === "flag");
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="tabular text-xs font-semibold text-accent-ink">
                          Ref. {formatDisplayRef(c)}
                        </p>
                        <p className="truncate text-sm font-bold text-ink">{c.title}</p>
                        <p className="text-xs text-ink-soft">
                          {flagBy?.by ? `${staffName(flagBy.by)} flagged · ` : ""}
                          {flagBy?.at ? formatDate(flagBy.at) : formatDate(c.updatedAt)}
                        </p>
                      </div>
                      <Badge>{c.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              to="/yb/complaints/assigned"
              className={`${textLink} mt-3 inline-flex min-h-11 items-center text-sm`}
            >
              Review in Assigned Complaints
            </Link>
          </div>
        </Sheet>
      </div>

      <div className="max-w-xs">
        <label htmlFor="notif-filter" className={labelClass}>
          Show
        </label>
        <select
          id="notif-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={inputClass}
        >
          {YB_NOTIFICATION_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <Sheet title={`Activity · ${shown.length}`}>
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-soft md:px-5">
            No activity matches this filter yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.slice(0, 30).map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{n.label}</p>
                  <p className="mt-0.5 text-base font-bold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    <span className="tabular font-semibold text-accent-ink">Ref. {n.ref}</span>
                    {" · "}
                    {n.detail}
                    {n.byName ? ` · ${n.byName}` : ""}
                    {n.group ? ` · ${n.group}` : ""}
                    {" · "}
                    {formatDateTime(n.at)}
                  </p>
                  {n.kind === "update-sent" && (
                    <p className="mt-0.5 text-xs text-ink-soft">Visible to the reporter; shown here as sent-log.</p>
                  )}
                </div>
                <Badge>{n.status}</Badge>
              </li>
            ))}
          </ul>
        )}
        {shown.length > 30 && (
          <p className="px-4 py-3 text-xs text-ink-soft md:px-5">
            Showing 30 of {shown.length}. Refine the filter to narrow it down.
          </p>
        )}
      </Sheet>

      <p role="status" className="sr-only">
        {shown.length} notifications shown.
      </p>
    </div>
  );
}
