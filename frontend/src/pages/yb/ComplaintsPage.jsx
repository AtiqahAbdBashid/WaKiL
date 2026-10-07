// Aduan triage: self-claim from pool (Aide/Intern), release, reassign (Representative/Aide), status with history.
// Pool list holds unassigned + ungrouped complaints; case groups hold tentative
// members until Representative/Aide confirm them, then claim-all assigns the group.
import { useState } from "react";
import { Search } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { formatDate, formatDisplayRef, ybCategories, ybComplaints, ybStatuses } from "../../data/ybSample";
import { staffName, ybCaseGroups, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";

const today = () => new Date().toISOString().slice(0, 10);
const isOpen = (c) => c.status === "Pending" || c.status === "In Progress";

export default function ComplaintsPage() {
  const { user, canClaim, canReassign, canMarkResolved } = useYbAuth();
  const [complaints, setComplaints] = useState(ybComplaints);
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [owner, setOwner] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const q = query.trim().toLowerCase();
  const matches = (c) =>
    (status === "All" || c.status === status) &&
    (category === "All" || c.category === category) &&
    (owner === "All" ||
      (owner === "Unassigned" ? !c.assigneeId : owner === "Mine" ? c.assigneeId === user?.id : c.assigneeId === owner)) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const pool = complaints.filter((c) => !c.assigneeId && !c.case_group_id && matches(c)).sort((a, b) => b.date.localeCompare(a.date));
  const groupMembers = (groupId) =>
    complaints.filter((c) => c.case_group_id === groupId).sort((a, b) => b.date.localeCompare(a.date));

  const touch = (id, patch, entry) =>
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, history: [...(c.history ?? []), entry] } : c))
    );

  const claim = (id) => {
    if (!canClaim) {
      setAnnouncement("Representative assigns via reassign list, no pool claim.");
      return;
    }
    touch(id, { assigneeId: user.id }, { by: user.id, at: today(), action: "claim", detail: `${user.name} claimed from pool` });
    setAnnouncement(`Complaint ${formatDisplayRef(id)} claimed by you.`);
  };

  const release = (id) => {
    touch(id, { assigneeId: null }, { by: user.id, at: today(), action: "release", detail: `${user.name} released to pool` });
    setAnnouncement(`Complaint ${formatDisplayRef(id)} released to pool.`);
  };

  const reassign = (id, nextId) => {
    touch(id, { assigneeId: nextId || null }, { by: user.id, at: today(), action: "reassign", detail: `${user.name} assigned to ${nextId ? staffName(nextId) : "pool"}` });
    setAnnouncement(`Complaint ${formatDisplayRef(id)} assigned to ${nextId ? staffName(nextId) : "pool"}.`);
  };

  const changeStatus = (id, next) => {
    if (next === "Resolved" && !canMarkResolved) {
      setAnnouncement("Only Representative can mark Resolved in this mock.");
      return;
    }
    const c = complaints.find((x) => x.id === id);
    touch(id, { status: next }, { by: user.id, at: today(), action: "status", detail: `${c.status} → ${next}` });
    setAnnouncement(`Complaint ${formatDisplayRef(id)} marked ${next}.`);
  };

  const clear = () => {
    setStatus("All");
    setCategory("All");
    setOwner("All");
    setQuery("");
  };

  const confirmMember = (id) => {
    if (!canReassign) {
      setAnnouncement("Only Representative or Aide can confirm case group members.");
      return;
    }
    const c = complaints.find((x) => x.id === id);
    if (!c || !c.case_group_id) return;
    if (!isOpen(c)) {
      setAnnouncement(`Complaint ${formatDisplayRef(id)} is closed and cannot be confirmed.`);
      return;
    }
    touch(
      id,
      { case_group_confirmed: true },
      { by: user.id, at: today(), action: "group-confirm", detail: `${user.name} confirmed membership` }
    );
    setAnnouncement(`Complaint ${formatDisplayRef(id)} membership confirmed.`);
  };

  const confirmGroup = (groupId) => {
    const members = groupMembers(groupId).filter((c) => !c.case_group_confirmed && isOpen(c));
    if (members.length === 0) {
      setAnnouncement("Nothing tentative to confirm in this group.");
      return;
    }
    for (const m of members) confirmMember(m.id);
  };

  const claimAll = (groupId) => {
    const members = groupMembers(groupId).filter((c) => !c.assigneeId && isOpen(c));
    if (members.length === 0) {
      setAnnouncement("Nothing unassigned to claim in this group.");
      return;
    }
    for (const m of members) {
      touch(
        m.id,
        { assigneeId: user.id },
        { by: user.id, at: today(), action: "claim", detail: `${user.name} claimed via case group` }
      );
    }
    setAnnouncement(`${members.length} complaints claimed by you.`);
  };

  const addUpdate = (id, { detail, attachmentName }) => {
    touch(
      id,
      { updatedAt: today() },
      { by: user.id, at: today(), action: "update", detail, ...(attachmentName ? { attachmentName } : {}) }
    );
    setAnnouncement(`Update added to ${formatDisplayRef(id)}${attachmentName ? ` with ${attachmentName}` : ""}.`);
  };

  const statusOptions = (c) =>
    c.status === "Resolved" || canMarkResolved ? ybStatuses : ybStatuses.filter((s) => s !== "Resolved");

  return (
    <div className="w-full space-y-8">
      <PageTitle title="Complaints" subtitle="Claim from pool (Aide/Intern), reassign, update status. History tracked per aduan." />
      <SampleNote label="Note:">Mock multi-staff triage. Aide/Intern self-claim, Representative/Aide reassign and confirm case groups, only Representative marks Resolved.</SampleNote>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr]">
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybStatuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="owner" className={labelClass}>Owner</label>
          <select id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass}>
            <option>All</option>
            <option value="Mine">Mine</option>
            <option value="Unassigned">Unassigned</option>
            {ybStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="search" className={labelClass}>Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, locality or reference" className={`${inputClass} pl-9`} />
          </div>
        </div>
      </div>

      <p role="status" className="sr-only">{announcement}</p>
      {announcement && <p className="text-sm font-bold text-brand">{announcement}</p>}

      <Sheet title={`Case groups · ${ybCaseGroups.length}`}>
        <ul className="divide-y divide-line">
          {ybCaseGroups.map((g) => {
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
                      <button onClick={() => confirmGroup(g.id)} className={textLink}>
                        Confirm {tentative}
                      </button>
                    )}
                    <button onClick={() => claimAll(g.id)} className={textLink}>
                      Claim all
                    </button>
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
                          {!c.case_group_confirmed && canReassign && isOpen(c) && (
                            <button onClick={() => confirmMember(c.id)} className={textLink}>
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

      <Sheet title={`Unassigned pool · ${pool.length} complaints`}>
        {pool.length === 0 ? (
          <div className="space-y-3 px-4 py-10 text-center md:px-5">
            <p className="text-base text-ink-soft">No unassigned complaints match these filters.</p>
            <button onClick={clear} className={textLink}>Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-soft">
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Ref.</th>
                  <th scope="col" className="px-4 py-3 font-bold">Complaint</th>
                  <th scope="col" className="px-4 py-3 font-bold">Owner</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Triage</th>
                </tr>
              </thead>
              <tbody>
                {pool.map((c) => (
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
                      <p className="text-ink-soft">{c.category} · {c.locality}</p>
                      {(c.history ?? []).length > 0 && (
                        <p className="mt-1 text-xs text-ink-soft">
                          {(c.history ?? []).slice(-2).map((h) => `${formatDate(h.at)} ${staffName(h.by)}: ${h.detail}`).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{c.assigneeId ? staffName(c.assigneeId) : "Pool"}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {!c.assigneeId && canClaim && <button onClick={() => claim(c.id)} className={textLink}>Claim</button>}
                        {c.assigneeId === user?.id && <button onClick={() => release(c.id)} className={textLink}>Release</button>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                    <td className="space-y-2 px-4 py-3 md:px-5">
                      <select
                        value={c.status}
                        onChange={(e) => changeStatus(c.id, e.target.value)}
                        aria-label={`Update status of complaint ${formatDisplayRef(c.id)}`}
                        className={`${inputClass} min-w-36 text-sm`}
                      >
                        {statusOptions(c).map((s) => <option key={s}>{s}</option>)}
                      </select>
                      {canReassign ? (
                        <select
                          value={c.assigneeId ?? ""}
                          onChange={(e) => reassign(c.id, e.target.value)}
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
        onClaim={claim}
        onRelease={release}
        onReassign={reassign}
        onStatusChange={changeStatus}
        onAddUpdate={addUpdate}
      />
    </div>
  );
}
