// Assigned Complaints: group-first work queue. Staff see the case groups they
// opened (Representative sees all). Groups start collapsed; clicking a group
// expands its complaints. All triage happens inside the complaint dialog.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { formatDisplayRef, ybCategories, ybStatuses } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { isOpenComplaint, useYbComplaints } from "../../context/YbComplaintsContext";

export default function AssignedComplaintsPage() {
  const { user, canClaim, canReassign, canMarkResolved } = useYbAuth();
  const {
    complaints,
    caseGroups,
    groupMembers,
    releaseComplaint,
    changeStatus,
    confirmMember,
    addUpdate,
  } = useYbComplaints();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  const isRepresentative = user?.role === "Representative";

  const q = query.trim().toLowerCase();
  const matches = (c) =>
    (status === "All" || c.status === status) &&
    (category === "All" || c.category === category) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const visibleGroups = caseGroups
    .filter((g) => isRepresentative || g.owner_staff_id === user?.id)
    .sort((a, b) => {
      if (a.status === "Open" && b.status !== "Open") return -1;
      if (a.status !== "Open" && b.status === "Open") return 1;
      return 0;
    });

  const toggleGroup = (id) =>
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onReleaseComplaint = (id, payload) => {
    const result = releaseComplaint(id, payload, user);
    setAnnouncement(result.message || "");
    return result;
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
    if (!confirmMember(id, user)) {
      setAnnouncement(`Complaint ${formatDisplayRef(id)} is closed and cannot be confirmed.`);
      return false;
    }
    setAnnouncement(`Complaint ${formatDisplayRef(id)} membership confirmed.`);
    return true;
  };

  const onAddUpdate = (id, { detail, attachmentName, repeatInGroup }) => {
    const result = addUpdate(id, { detail, attachmentName, repeatInGroup }, user);
    setAnnouncement(
      result?.count > 1
        ? `Update added to ${result.count} complaints in the case group${attachmentName ? ` with ${attachmentName}` : ""}.`
        : `Update added to ${formatDisplayRef(id)}${attachmentName ? ` with ${attachmentName}` : ""}.`
    );
  };

  const clear = () => {
    setStatus("All");
    setCategory("All");
    setQuery("");
  };

  const statusOptions = (c) =>
    c.status === "Resolved" || canMarkResolved ? ybStatuses : ybStatuses.filter((s) => s !== "Resolved");

  const selected = complaints.find((x) => x.id === selectedId) ?? null;
  const selectedGroup = selected?.case_group_id
    ? caseGroups.find((g) => g.id === selected.case_group_id) ?? null
    : null;
  const selectedOwnerId = selectedGroup?.owner_staff_id ?? null;
  const selectedCaseGroup = (() => {
    if (!selected?.case_group_id) return null;
    const members = groupMembers(selected.case_group_id);
    const group = caseGroups.find((g) => g.id === selected.case_group_id);
    return {
      title: group?.title ?? selected.case_group_id,
      memberCount: members.filter((m) => isOpenComplaint(m)).length || members.length,
    };
  })();
  const releaseCandidates = ybStaff.filter(
    (s) =>
      s.active &&
      (s.role === "Aide" || s.role === "Intern") &&
      s.id !== selectedOwnerId
  );

  return (
    <div className="w-full space-y-8">
      <PageTitle
        title="Assigned Complaints"
        subtitle="Case groups assigned to you. Open a group to work its complaints."
      />
      <SampleNote label="Note:">Mock multi-staff triage. Staff see groups they opened; Representative sees all. All triage happens in the complaint dialog.</SampleNote>

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

      <Sheet title={`Case groups · ${visibleGroups.length}`}>
        {visibleGroups.length === 0 ? (
          <div className="space-y-3 px-4 py-10 text-center md:px-5">
            <p className="text-base text-ink-soft">No case groups assigned to you yet.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={clear} className={textLink}>Clear filters</button>
              <Link to="/yb/complaints/pool" className={`${textLink} inline-flex min-h-11 items-center`}>
                Open the pool to claim work
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {visibleGroups.map((g) => {
              const members = groupMembers(g.id);
              const shown = members.filter(matches);
              const tentative = members.filter((c) => !c.case_group_confirmed).length;
              const expanded = expandedIds.includes(g.id);
              return (
                <li key={g.id} className="px-4 py-2 md:px-5">
                  <button
                    onClick={() => toggleGroup(g.id)}
                    aria-expanded={expanded}
                    aria-controls={`group-members-${g.id}`}
                    className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block font-bold text-ink">{g.title}</span>
                      <span className="block text-sm text-ink-soft">
                        {g.category} · {staffName(g.owner_staff_id)} · {members.length} members
                        {tentative > 0 ? ` · ${tentative} tentative` : " · all confirmed"}
                        {g.status === "Closed" ? " · closed" : ""}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded && (
                    <div id={`group-members-${g.id}`} className="pb-2">
                      {members.length === 0 ? (
                        <p className="mt-1 text-sm text-ink-soft">No members yet.</p>
                      ) : shown.length === 0 ? (
                        <p className="mt-1 text-sm text-ink-soft">
                          No members match these filters ({members.length} in group).
                        </p>
                      ) : (
                        <>
                          {shown.length < members.length && (
                            <p className="mt-1 text-xs text-ink-soft">
                              Showing {shown.length} of {members.length} complaints.
                            </p>
                          )}
                          <ul className="mt-1 divide-y divide-line border-t border-line">
                            {shown.map((c) => (
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
                                    {" · "}{c.category} · {c.locality} · {staffName(g.owner_staff_id)}
                                    {c.case_group_confirmed ? " · confirmed" : " · tentative"}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <Badge>{c.status}</Badge>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      <ComplaintDetailDialog
        key={`detail-${selectedId ?? "none"}`}
        complaint={selected}
        user={user}
        canClaim={canClaim}
        canReassign={canReassign}
        statusOptions={statusOptions}
        caseGroup={selectedCaseGroup}
        onClose={() => setSelectedId(null)}
        onClaim={() => {}}
        onStatusChange={onStatusChange}
        onAddUpdate={onAddUpdate}
        onReleaseComplaint={onReleaseComplaint}
        releaseCandidates={releaseCandidates}
        canMarkResolved={canMarkResolved}
        onConfirmMember={onConfirmMember}
      />
    </div>
  );
}
