// Assigned Complaints: mine-only work queue (assigneeId == session user) plus
// case groups. New claims arrive here via opening a case group from the pool;
// Representative never holds assignments.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { formatDate, formatDisplayRef, ybCategories, ybStatuses } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { isOpenComplaint, useYbComplaints } from "../../context/YbComplaintsContext";

export default function AssignedComplaintsPage() {
  const { user, canClaim, canReassign, canMarkResolved } = useYbAuth();
  const {
    complaints,
    caseGroups,
    groupMembers,
    release,
    reassign,
    changeStatus,
    confirmMember,
    confirmGroup,
    claimAll,
    addUpdate,
  } = useYbComplaints();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const q = query.trim().toLowerCase();
  const matches = (c) =>
    (status === "All" || c.status === status) &&
    (category === "All" || c.category === category) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const mine = complaints
    .filter((c) => c.assigneeId === user?.id && matches(c))
    .sort((a, b) => a.date.localeCompare(b.date));

  const onRelease = (id) => {
    release(id, user);
    setAnnouncement(`Complaint ${formatDisplayRef(id)} released to pool.`);
  };

  const onReassign = (id, nextId) => {
    reassign(id, nextId, user);
    setAnnouncement(`Complaint ${formatDisplayRef(id)} assigned to ${nextId ? staffName(nextId) : "pool"}.`);
  };

  const onStatusChange = (id, next) => {
    if (next === "Resolved" && !canMarkResolved) {
      setAnnouncement("Only Representative can mark Resolved in this mock.");
      return;
    }
    changeStatus(id, next, user);
    setAnnouncement(`Complaint ${formatDisplayRef(id)} marked ${next}.`);
  };

  const onConfirmMember = (id) => {
    if (!canReassign) {
      setAnnouncement("Only Representative or Aide can confirm case group members.");
      return;
    }
    if (!confirmMember(id, user)) {
      setAnnouncement(`Complaint ${formatDisplayRef(id)} is closed and cannot be confirmed.`);
      return;
    }
    setAnnouncement(`Complaint ${formatDisplayRef(id)} membership confirmed.`);
  };

  const onConfirmGroup = (groupId) => {
    const n = confirmGroup(groupId, user);
    setAnnouncement(n === 0 ? "Nothing tentative to confirm in this group." : `${n} memberships confirmed.`);
  };

  const onClaimAll = (groupId) => {
    if (!canClaim) {
      setAnnouncement("Representative does not claim. Assign via the reassign list instead.");
      return;
    }
    const n = claimAll(groupId, user);
    setAnnouncement(n === 0 ? "Nothing unassigned to claim in this group." : `${n} complaints claimed by you.`);
  };

  const onAddUpdate = (id, { detail, attachmentName }) => {
    addUpdate(id, { detail, attachmentName }, user);
    setAnnouncement(`Update added to ${formatDisplayRef(id)}${attachmentName ? ` with ${attachmentName}` : ""}.`);
  };

  const clear = () => {
    setStatus("All");
    setCategory("All");
    setQuery("");
  };

  const statusOptions = (c) =>
    c.status === "Resolved" || canMarkResolved ? ybStatuses : ybStatuses.filter((s) => s !== "Resolved");

  return (
    <div className="w-full space-y-8">
      <PageTitle
        title="Assigned Complaints"
        subtitle="Complaints assigned to you. Claim new work by opening a case group from the pool."
      />
      <SampleNote label="Note:">Mock multi-staff triage. This queue is mine-only. Representative holds none and closes only.</SampleNote>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
        <div>
          <label htmlFor="assigned-status" className={labelClass}>Status</label>
          <select id="assigned-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybStatuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="assigned-category" className={labelClass}>Category</label>
          <select id="assigned-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="assigned-search" className={labelClass}>Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input id="assigned-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, locality or reference" className={`${inputClass} pl-9`} />
          </div>
        </div>
      </div>

      <p role="status" className="sr-only">{announcement}</p>
      {announcement && <p className="text-sm font-bold text-brand">{announcement}</p>}

      <Sheet title={`Case groups · ${caseGroups.length}`}>
        <ul className="divide-y divide-line">
          {caseGroups.map((g) => {
            const members = groupMembers(g.id);
            const tentative = members.filter((c) => !c.case_group_confirmed).length;
            return (
              <li key={g.id} className="px-4 py-4 md:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{g.title}</p>
                    <p className="text-sm text-ink-soft">
                      {g.category} · {staffName(g.owner_staff_id)} · {members.length} members
                      {tentative > 0 ? ` · ${tentative} tentative` : " · all confirmed"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canReassign && tentative > 0 && (
                      <button onClick={() => onConfirmGroup(g.id)} className={textLink}>
                        Confirm {tentative}
                      </button>
                    )}
                    {canClaim && (
                      <button onClick={() => onClaimAll(g.id)} className={textLink}>
                        Claim all
                      </button>
                    )}
                  </div>
                </div>
                {members.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-soft">No members yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line border-t border-line">
                    {members.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedId(c.id)}
                            aria-haspopup="dialog"
                            className="inline-flex min-h-11 items-center py-1 text-left font-bold text-ink underline decoration-2 underline-offset-4 hover:text-brand"
                          >
                            {c.title}
                          </button>
                          <p className="text-xs text-ink-soft">
                            <span className="tabular font-semibold text-accent-ink">Ref. {formatDisplayRef(c.id)}</span>
                            {" · "}{c.category} · {c.locality} · {c.assigneeId ? staffName(c.assigneeId) : "Pool"}
                            {c.case_group_confirmed ? " · confirmed" : " · tentative"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge>{c.status}</Badge>
                          {!c.case_group_confirmed && canReassign && isOpenComplaint(c) && (
                            <button onClick={() => onConfirmMember(c.id)} className={textLink}>
                              Confirm
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Sheet>

      <Sheet title={`Assigned to you · ${mine.length} complaints`}>
        {mine.length === 0 ? (
          <div className="space-y-3 px-4 py-10 text-center md:px-5">
            <p className="text-base text-ink-soft">Nothing assigned to you under these filters.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={clear} className={textLink}>Clear filters</button>
              <Link to="/yb/complaints/pool" className={`${textLink} inline-flex min-h-11 items-center`}>
                Open the pool to claim work
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-soft">
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Ref.</th>
                  <th scope="col" className="px-4 py-3 font-bold">Complaint</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Triage</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => (
                  <tr key={c.id} className="border-b border-line align-top last:border-b-0">
                    <td className="tabular px-4 py-3 font-semibold text-accent-ink md:px-5">{formatDisplayRef(c.id)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(c.id)}
                        aria-haspopup="dialog"
                        className="inline-flex min-h-11 items-center py-1 text-left font-bold text-ink underline decoration-2 underline-offset-4 hover:text-brand"
                      >
                        {c.title}
                      </button>
                      <p className="text-ink-soft">{c.category} · {c.locality}{c.case_group_id ? ` · ${c.case_group_id}` : ""}</p>
                      {(c.history ?? []).length > 0 && (
                        <p className="mt-1 text-xs text-ink-soft">
                          {(c.history ?? []).slice(-2).map((h) => `${formatDate(h.at)} ${staffName(h.by)}: ${h.detail}`).join(" · ")}
                        </p>
                      )}
                      <div className="mt-1">
                        <button onClick={() => onRelease(c.id)} className={textLink}>Release</button>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                    <td className="space-y-2 px-4 py-3 md:px-5">
                      <select
                        value={c.status}
                        onChange={(e) => onStatusChange(c.id, e.target.value)}
                        aria-label={`Update status of complaint ${formatDisplayRef(c.id)}`}
                        className={`${inputClass} min-w-36 text-sm`}
                      >
                        {statusOptions(c).map((s) => <option key={s}>{s}</option>)}
                      </select>
                      {canReassign ? (
                        <select
                          value={c.assigneeId ?? ""}
                          onChange={(e) => onReassign(c.id, e.target.value)}
                          aria-label={`Assign complaint ${formatDisplayRef(c.id)}`}
                          className={`${inputClass} min-w-36 text-sm`}
                        >
                          <option value="">Pool</option>
                          {ybStaff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}
                        </select>
                      ) : (
                        <p className="text-xs text-ink-soft">Reassign: Representative/Aide only</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>

      <ComplaintDetailDialog
        key={selectedId ?? "none"}
        complaint={complaints.find((x) => x.id === selectedId) ?? null}
        user={user}
        canClaim={canClaim}
        canReassign={canReassign}
        statusOptions={statusOptions}
        onClose={() => setSelectedId(null)}
        onClaim={() => {}}
        onRelease={onRelease}
        onReassign={onReassign}
        onStatusChange={onStatusChange}
        onAddUpdate={onAddUpdate}
      />
    </div>
  );
}
