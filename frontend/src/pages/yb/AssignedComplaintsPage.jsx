// Assigned Complaints: group-first work queue. Staff see their own case
// groups plus all other open groups read-only (pull model); Representative
// sees all. Groups start collapsed; clicking a group expands its
// complaints. All grouping happens inside the complaint dialog.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { formatDisplayRef, ybCategories, ybStatuses } from "../../data/ybSample";
import { staffName } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { isOpenComplaint, useYbComplaints } from "../../context/YbComplaintsContext";

export default function AssignedComplaintsPage() {
  const { user, canClaim, canMarkResolved } = useYbAuth();
  const {
    complaints,
    caseGroups,
    groupMembers,
    groupOwnerOf,
    releaseComplaint,
    moveToExistingGroup,
    moveGroupToGroup,
    addUpdate,
    setAttention,
  } = useYbComplaints();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  const isRepresentative = user?.role === "Representative";

  const STALE_CUT = Date.parse("2026-10-03T00:00:00Z") - 60 * 86400000;
  const mine = useMemo(
    () => complaints.filter((c) => isRepresentative || groupOwnerOf(c) === user?.id),
    [complaints, groupOwnerOf, isRepresentative, user?.id]
  );
  const mineOpen = useMemo(() => mine.filter((c) => isOpenComplaint(c)), [mine]);
  const mineStale = useMemo(
    () => mine.filter((c) => c.status === "In Progress" && Date.parse(c.updatedAt) <= STALE_CUT),
    [mine]
  );
  const poolToGroup = useMemo(
    () => complaints.filter((c) => !c.case_group_id && c.status === "Pending"),
    [complaints]
  );
  const mineFlagged = useMemo(() => mine.filter((c) => c.needsRepresentativeAttention), [mine]);
  const queueStats = [
    { label: "My open", value: mineOpen.length, hint: `${mine.filter((c) => c.status === "Pending").length} Pending · ${mine.filter((c) => c.status === "In Progress").length} In Progress`, box: "border-brand/20 bg-brand-soft", valueClass: "text-brand-dark" },
    { label: "Gone stale", value: mineStale.length, hint: "In Progress untouched 60d+", box: "border-accent/20 bg-accent-soft", valueClass: "text-accent-dark" },
    { label: "In pool to group", value: poolToGroup.length, hint: "Ungrouped Pending", box: "border-mint/20 bg-mint-soft", valueClass: "text-mint-dark" },
    { label: "With Representative", value: mineFlagged.length, hint: "Flagged, awaiting review", box: "border-line bg-paper-raised", valueClass: "text-ink" },
  ];

  const q = query.trim().toLowerCase();
  const matches = (c) =>
    (status === "All" || c.status === status) &&
    (category === "All" || c.category === category) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const sortOpenFirst = (a, b) => {
    if (a.status === "Open" && b.status !== "Open") return -1;
    if (a.status !== "Open" && b.status === "Open") return 1;
    return 0;
  };

  const myGroups = caseGroups
    .filter((g) => isRepresentative || g.owner_staff_id === user?.id)
    .sort(sortOpenFirst);

  // Pull model: everyone sees all other open groups read-only so they can
  // pull singles or whole groups into a group they own. Representative
  // already sees everything via myGroups, so the second list is empty.
  const otherOpenGroups = isRepresentative
    ? []
    : caseGroups
        .filter((g) => g.status === "Open" && g.owner_staff_id !== user?.id)
        .sort(sortOpenFirst);

  const toggleGroup = (id) =>
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onReleaseComplaint = (id, payload) => {
    const result = releaseComplaint(id, payload, user);
    setAnnouncement(result.message || "");
    return result;
  };

  const onMoveToGroup = (id, destGroupId) => {
    const result = moveToExistingGroup(id, destGroupId, user);
    setAnnouncement(result.message || "");
    return result;
  };

  const onPullGroup = (sourceGroupId, destGroupId) => {
    const result = moveGroupToGroup(sourceGroupId, destGroupId, user);
    setAnnouncement(result.message || "");
    return result;
  };

  const onAddUpdate = (id, { detail, attachmentName, repeatInGroup }) => {
    const result = addUpdate(id, { detail, attachmentName, repeatInGroup }, user);
    setAnnouncement(
      result?.count > 1
        ? `Update added to ${result.count} complaints in the case group${attachmentName ? ` with ${attachmentName}` : ""}.`
        : `Update added to ${formatDisplayRef(id)}${attachmentName ? ` with ${attachmentName}` : ""}.`
    );
  };

  const onToggleAttention = (id, value) => {
    const result = setAttention(id, value, user);
    if (!result?.ok) return result;
    setAnnouncement(
      value ? "Flagged for Representative review." : "Representative flag cleared."
    );
    return result;
  };

  const clear = () => {
    setStatus("All");
    setCategory("All");
    setQuery("");
  };

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
  const selectedSourceOpenCount = selected?.case_group_id
    ? groupMembers(selected.case_group_id).filter((m) => isOpenComplaint(m)).length
    : 0;
  const groupCandidates = caseGroups
    .filter(
      (g) =>
        g.status === "Open" &&
        g.id !== selected?.case_group_id &&
        (isRepresentative || g.owner_staff_id === user?.id)
    )
    .map((g) => {
      const members = groupMembers(g.id);
      return {
        id: g.id,
        title: g.title,
        ownerName: staffName(g.owner_staff_id),
        memberCount: members.filter((m) => isOpenComplaint(m)).length || members.length,
      };
    });
  const isSelectedOwner = !!selectedOwnerId && selectedOwnerId === user?.id;
  const canFlagSelected =
    !!selected &&
    (selected.needsRepresentativeAttention
      ? isSelectedOwner || isRepresentative
      : isSelectedOwner && !isRepresentative);

  const renderGroupList = (groups) => (
    <ul className="divide-y divide-line">
      {groups.map((g) => {
        const members = groupMembers(g.id);
        const shown = members.filter(matches);
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
                  {staffName(g.owner_staff_id)} · {members.length} members
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
                              {" · "}{c.category} · {c.locality}
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
  );

  return (
    <div className="w-full space-y-8">
      <PageTitle
        title="Assigned Complaints"
        subtitle="Your case groups, plus other open groups you can pull from."
      />
      <SampleNote label="Note:">Mock multi-staff grouping. Your groups are fully editable; other open groups are read-only. Open a complaint to pull it into a group you own.</SampleNote>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {queueStats.map((s) => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.box}`}>
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</dt>
            <dd className={`tabular mt-1 text-3xl font-extrabold ${s.valueClass}`}>{s.value}</dd>
            <dd className="mt-0.5 text-xs text-ink-soft">{s.hint}</dd>
          </div>
        ))}
      </dl>

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

      <Sheet title={`My case groups · ${myGroups.length}`}>
        {myGroups.length === 0 ? (
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
          renderGroupList(myGroups)
        )}
      </Sheet>

      {!isRepresentative && (
        <Sheet title={`Other open groups · ${otherOpenGroups.length} · read-only`}>
          {otherOpenGroups.length === 0 ? (
            <div className="space-y-3 px-4 py-10 text-center md:px-5">
              <p className="text-base text-ink-soft">No other open groups to pull from.</p>
            </div>
          ) : (
            renderGroupList(otherOpenGroups)
          )}
        </Sheet>
      )}

      <ComplaintDetailDialog
        key={`detail-${selectedId ?? "none"}`}
        complaint={selected}
        user={user}
        canClaim={canClaim}
        caseGroup={selectedCaseGroup}
        onClose={() => setSelectedId(null)}
        onClaim={() => {}}
        onAddUpdate={onAddUpdate}
        onReleaseComplaint={onReleaseComplaint}
        groupCandidates={groupCandidates}
        onTransferToGroup={onMoveToGroup}
        sourceGroupId={selected?.case_group_id ?? null}
        sourceOpenCount={selectedSourceOpenCount}
        onPullGroup={onPullGroup}
        canMarkResolved={canMarkResolved}
        onToggleAttention={onToggleAttention}
        canFlag={canFlagSelected}
      />
    </div>
  );
}
