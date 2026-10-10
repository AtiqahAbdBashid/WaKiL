// YB notifications, derived read-only from the shared mock triage state.
// No NOTIFICATION entity exists in ER v3, so this file builds the feed from
// COMPLAINT + history (COMPLAINT_UPDATE equivalent) + CASE_GROUP ownership.
// Start-of-day pool digest and end-of-day review digest are computed against
// the latest sample timestamp so the mock timeline still reads as "today".
import { staffName } from "./ybStaff";

const STALE_DAYS = 60;
const DAY_MS = 86400000;

const toTime = (v) => {
  const t = Date.parse(v ?? "");
  return Number.isNaN(t) ? 0 : t;
};

// Simulated "today": the newest stamp in the dataset. Keeps the mock feed
// meaningful when the sample dates sit behind the real clock.
export function referenceNow(complaints) {
  let max = 0;
  for (const c of complaints ?? []) {
    max = Math.max(max, toTime(c.date), toTime(c.updatedAt));
    for (const h of c.history ?? []) max = Math.max(max, toTime(h.at));
  }
  return max || Date.now();
}

const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function ownerOf(complaint, caseGroups) {
  if (!complaint?.case_group_id) return null;
  return caseGroups.find((g) => g.id === complaint.case_group_id)?.owner_staff_id ?? null;
}

export function isRemoteStale(c, now) {
  return c.status === "In Progress" && toTime(c.updatedAt) <= now - STALE_DAYS * DAY_MS;
}

// Morning pool digest: total unassigned Pending + arrivals since yesterday.
export function buildPoolDigest(complaints, now = referenceNow(complaints)) {
  const pool = (complaints ?? []).filter((c) => !c.case_group_id && c.status === "Pending");
  const dayStart = startOfDay(now);
  const fresh = pool.filter((c) => toTime(c.date) >= dayStart - DAY_MS);
  const oldest = pool.reduce((min, c) => Math.min(min, toTime(c.date) || Infinity), Infinity);
  return {
    total: pool.length,
    fresh: fresh.length,
    oldestAt: oldest === Infinity ? null : new Date(oldest).toISOString(),
    items: [...pool].sort((a, b) => toTime(a.date) - toTime(b.date)),
  };
}

// Evening review digest: complaints flagged for Representative attention.
export function buildFlagDigest(complaints, caseGroups, user) {
  const flagged = (complaints ?? []).filter((c) => c.needsRepresentativeAttention);
  const scoped =
    user?.role === "Representative"
      ? flagged
      : flagged.filter((c) => ownerOf(c, caseGroups) === user?.id);
  const dayStart = startOfDay(referenceNow(complaints));
  const fresh = scoped.filter((c) =>
    (c.history ?? []).some((h) => h.action === "flag" && toTime(h.at) >= dayStart - DAY_MS)
  );
  return { total: scoped.length, fresh: fresh.length, items: scoped };
}

function kindOf(entry) {
  const action = entry.action ?? "";
  const detail = entry.detail ?? "";
  if (action === "flag") return "flag";
  if (action === "unflag") return "unflag";
  if (action === "update") return "update-sent";
  if (action === "resolve" || detail.includes("Resolved")) return "resolved";
  if (action === "claim" || action === "group-assign") return "claim";
  if (action === "reassign" || detail.includes("moved") || detail.includes("pulled")) return "move";
  if (action === "status") return "resolved";
  return "note";
}

const kindLabel = {
  flag: "Flagged for review",
  unflag: "Flag cleared",
  "update-sent": "Update sent to reporter",
  resolved: "Resolved",
  claim: "Claimed / grouped",
  move: "Moved",
  arrival: "New in pool",
  stale: "Gone stale",
  note: "Activity",
};

// Flat event feed from history, newest first, scoped by role.
export function buildYbNotifications(complaints, caseGroups, user) {
  const now = referenceNow(complaints);
  const isRepresentative = user?.role === "Representative";
  const out = [];

  for (const c of complaints ?? []) {
    const ownerId = ownerOf(c, caseGroups);
    const mine = isRepresentative || ownerId === user?.id;
    const groupTitle = caseGroups.find((g) => g.id === c.case_group_id)?.title ?? null;

    // Pool arrivals have no history yet; surface them so the feed explains the digest.
    if ((c.history ?? []).length === 0 && !c.case_group_id && c.status === "Pending") {
      out.push({
        id: `arrival-${c.id}`,
        kind: "arrival",
        label: kindLabel.arrival,
        title: c.title,
        detail: `Entered the pool · ${c.category} · ${c.locality}`,
        by: null,
        byName: null,
        at: c.date,
        complaintId: c.id,
        ref: c.ref_no ?? String(c.id),
        status: c.status,
        group: null,
        mine,
      });
    }

    for (const [i, h] of (c.history ?? []).entries()) {
      const kind = kindOf(h);
      // Flags on other owners' groups stay Representative-only.
      if (kind === "flag" && !isRepresentative && ownerId !== user?.id) continue;
      out.push({
        id: `${c.id}-${toTime(h.at)}-${i}`,
        kind,
        label: kindLabel[kind] ?? kindLabel.note,
        title: c.title,
        detail: h.detail ?? h.action,
        by: h.by ?? null,
        byName: h.by ? staffName(h.by) : null,
        at: h.at,
        complaintId: c.id,
        ref: c.ref_no ?? String(c.id),
        status: c.status,
        group: groupTitle,
        mine,
      });
    }

    // Stale watch: derived, never written.
    if (isRemoteStale(c, now) && (isRepresentative || ownerId === user?.id)) {
      out.push({
        id: `stale-${c.id}`,
        kind: "stale",
        label: kindLabel.stale,
        title: c.title,
        detail: `In Progress untouched ${STALE_DAYS}d+${groupTitle ? ` · ${groupTitle}` : ""}`,
        by: null,
        byName: null,
        at: c.updatedAt,
        complaintId: c.id,
        ref: c.ref_no ?? String(c.id),
        status: c.status,
        group: groupTitle,
        mine,
      });
    }
  }

  return out
    .filter((n) => (isRepresentative ? true : n.mine || n.kind === "arrival"))
    .sort((a, b) => toTime(b.at) - toTime(a.at));
}

// Sidebar badge: fresh pool arrivals + flags awaiting review, scoped to viewer.
export function ybUnreadCount(complaints, caseGroups, user) {
  const now = referenceNow(complaints);
  const pool = buildPoolDigest(complaints, now);
  const flags = buildFlagDigest(complaints, caseGroups, user);
  if (user?.role === "Representative") return pool.fresh + flags.total;
  return pool.fresh + flags.total;
}

export const YB_NOTIFICATION_FILTERS = [
  { id: "all", label: "All" },
  { id: "pool", label: "Pool" },
  { id: "review", label: "Review flags" },
  { id: "updates", label: "Updates sent" },
  { id: "moves", label: "Claims & moves" },
  { id: "resolved", label: "Resolved" },
];

export function matchesFilter(n, filter) {
  if (filter === "all") return true;
  if (filter === "pool") return n.kind === "arrival";
  if (filter === "review") return n.kind === "flag" || n.kind === "unflag";
  if (filter === "updates") return n.kind === "update-sent";
  if (filter === "moves") return n.kind === "claim" || n.kind === "move" || n.kind === "stale";
  if (filter === "resolved") return n.kind === "resolved";
  return true;
}
