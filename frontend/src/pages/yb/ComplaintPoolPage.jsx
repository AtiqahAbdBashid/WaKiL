// Complaint Pool: unassigned complaints outside case groups
// (!assigneeId && !case_group_id). No direct claim here; staff select pool
// complaints and open a case group to claim them. Representative groups stay
// unassigned.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import Badge from "../../components/ui/Badge";
import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import { inputClass, labelClass, primaryButton, secondaryButton, textLink } from "../../components/ui/styles";
import { formatDate, formatDisplayRef, ybCategories, ybStatuses } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { useYbComplaints } from "../../context/YbComplaintsContext";

export default function ComplaintPoolPage() {
  const { user, canClaim, canReassign, canMarkResolved } = useYbAuth();
  const { complaints, reassign, changeStatus, createGroupWithSelection, addUpdate } = useYbComplaints();
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupCategory, setGroupCategory] = useState(ybCategories[0]);

  const q = query.trim().toLowerCase();
  const matches = (c) =>
    (status === "All" || c.status === status) &&
    (category === "All" || c.category === category) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const pool = complaints
    .filter((c) => !c.assigneeId && !c.case_group_id && matches(c))
    .sort((a, b) => b.date.localeCompare(a.date));

  const poolIds = pool.map((c) => c.id);
  const selectedInPool = selected.filter((id) => poolIds.includes(id));
  const allChecked = pool.length > 0 && selectedInPool.length === pool.length;

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () => setSelected(allChecked ? [] : poolIds);

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

  const onAddUpdate = (id, { detail, attachmentName }) => {
    addUpdate(id, { detail, attachmentName }, user);
    setAnnouncement(`Update added to ${formatDisplayRef(id)}${attachmentName ? ` with ${attachmentName}` : ""}.`);
  };

  const onCreateGroup = (e) => {
    e.preventDefault();
    const result = createGroupWithSelection(selectedInPool, { title: groupTitle, category: groupCategory }, user);
    setAnnouncement(result.message);
    if (!result.ok) return;
    setSelected([]);
    setGroupTitle("");
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
        title="Complaint Pool"
        subtitle="Unassigned complaints outside case groups. Select complaints and open a case group to claim them."
      />
      <SampleNote label="Note:">Mock multi-staff triage. Direct claim is off. Aide and Intern claim by opening a case group; Representative opens groups unassigned.</SampleNote>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
        <div>
          <label htmlFor="pool-status" className={labelClass}>Status</label>
          <select id="pool-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybStatuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pool-category" className={labelClass}>Category</label>
          <select id="pool-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option>All</option>
            {ybCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pool-search" className={labelClass}>Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input id="pool-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, locality or reference" className={`${inputClass} pl-9`} />
          </div>
        </div>
      </div>

      <p role="status" className="sr-only">{announcement}</p>
      {announcement && (
        <p className="text-sm font-bold text-brand">
          {announcement}{" "}
          {announcement.includes("claimed") && (
            <Link to="/yb/complaints/assigned" className={`${textLink} ml-1`}>View assigned</Link>
          )}
        </p>
      )}

      <Sheet
        title={`Open case group · ${selectedInPool.length} selected`}
        action={
          selectedInPool.length > 0 && (
            <button onClick={() => setSelected([])} className={`${textLink} min-h-11 px-2 text-sm`}>
              Clear selection
            </button>
          )
        }
      >
        <form onSubmit={onCreateGroup} className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_auto] md:p-5">
          <div>
            <label htmlFor="group-title" className={labelClass}>Group title</label>
            <input
              id="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Street light round Seksyen 17"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="group-category" className={labelClass}>Category</label>
            <select id="group-category" value={groupCategory} onChange={(e) => setGroupCategory(e.target.value)} className={inputClass}>
              {ybCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={selectedInPool.length === 0} className={primaryButton}>
              {canClaim
                ? `Open group and claim ${selectedInPool.length}`
                : `Open group ${selectedInPool.length > 0 ? `(${selectedInPool.length})` : ""}`}
            </button>
          </div>
        </form>
        {!canClaim && (
          <p className="px-4 pb-4 text-sm text-ink-soft md:px-5">Representative opens groups unassigned and does not claim.</p>
        )}
      </Sheet>

      <Sheet title={`Complaint pool · ${pool.length} complaints`}>
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
                  <th scope="col" className="px-4 py-3 md:px-5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      aria-label="Select all pool complaints"
                      className="h-4 w-4 accent-brand"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">Ref.</th>
                  <th scope="col" className="px-4 py-3 font-bold">Complaint</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Triage</th>
                </tr>
              </thead>
              <tbody>
                {pool.map((c) => (
                  <tr key={c.id} className="border-b border-line align-top last:border-b-0">
                    <td className="px-4 py-3 md:px-5">
                      <input
                        type="checkbox"
                        checked={selectedInPool.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        aria-label={`Select complaint ${formatDisplayRef(c.id)}`}
                        className="mt-4 h-4 w-4 accent-brand"
                      />
                    </td>
                    <td className="tabular px-4 py-3 font-semibold text-accent-ink">{formatDisplayRef(c.id)}</td>
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

      {!canClaim && (
        <p className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft md:px-5">
          To claim a complaint, open a case group from the pool. Claimed work appears under{" "}
          <Link to="/yb/complaints/assigned" className={textLink}>Assigned Complaints</Link>.
        </p>
      )}
      {canClaim && (
        <p className="text-sm text-ink-soft">
          Claimed work appears under <Link to="/yb/complaints/assigned" className={textLink}>Assigned Complaints</Link>.{" "}
          <button onClick={() => document.getElementById("group-title")?.focus()} className={`${secondaryButton} ml-2`}>Start a group</button>
        </p>
      )}

      <ComplaintDetailDialog
        key={selectedId ?? "none"}
        complaint={complaints.find((x) => x.id === selectedId) ?? null}
        user={user}
        canClaim={false}
        canReassign={canReassign}
        statusOptions={statusOptions}
        onClose={() => setSelectedId(null)}
        onClaim={() => {}}
        onRelease={() => {}}
        onReassign={onReassign}
        onStatusChange={onStatusChange}
        onAddUpdate={onAddUpdate}
      />
    </div>
  );
}
