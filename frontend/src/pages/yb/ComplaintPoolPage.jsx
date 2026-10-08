// Complaint Pool: ungrouped complaints (no case_group_id). Read-only list;
// staff open a complaint to group 1..N pool complaints, then claim en-bloc
// via the new Case Group. Ungrouped complaints are never claimed directly.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import PageTitle from "../../components/ui/PageTitle";
import SampleNote from "../../components/ui/SampleNote";
import Sheet from "../../components/ui/Sheet";
import ComplaintDetailDialog from "../../components/yb/ComplaintDetailDialog";
import ClaimCaseGroupDialog from "../../components/yb/ClaimCaseGroupDialog";
import { inputClass, labelClass, textLink } from "../../components/ui/styles";
import { formatDate, formatDisplayRef, ybCategories } from "../../data/ybSample";
import { staffName } from "../../data/ybStaff";
import { useYbAuth } from "../../auth/YbAuthContext";
import { isOpenComplaint, useYbComplaints } from "../../context/YbComplaintsContext";

export default function ComplaintPoolPage() {
  const { user, canClaim } = useYbAuth();
  const { complaints, createGroupWithSelection } = useYbComplaints();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [claimSeedId, setClaimSeedId] = useState(null);

  const q = query.trim().toLowerCase();
  // Every ungrouped complaint is Pending by invariant, so there is no status
  // filter here — only category and free-text search.
  const matches = (c) =>
    (category === "All" || c.category === category) &&
    (!q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q));

  const pool = complaints
    .filter((c) => !c.case_group_id && matches(c))
    .sort((a, b) => b.date.localeCompare(a.date));

  const seedComplaint = complaints.find((x) => x.id === claimSeedId) ?? null;
  const claimCandidates = pool.filter(
    (c) => c.id !== claimSeedId && isOpenComplaint(c)
  );

  const onClaimRequest = (id) => {
    setSelectedId(null);
    setClaimSeedId(id);
  };

  const onConfirmClaim = ({ title, category: groupCategory, extraIds }) => {
    const ids = [claimSeedId, ...(extraIds ?? [])];
    const result = createGroupWithSelection(ids, { title, category: groupCategory }, user);
    setAnnouncement(result.message);
    if (!result.ok) return;
    setClaimSeedId(null);
    setSelectedId(null);
  };

  const clear = () => {
    setCategory("All");
    setQuery("");
  };

  return (
    <div className="w-full space-y-8">
      <PageTitle
        title="Complaint Pool"
        subtitle="Ungrouped complaints. Open a complaint to group it and claim en-bloc via a Case Group."
      />
      <SampleNote label="Note:">Mock multi-staff triage. Open a complaint to group it. Aide and Intern group and claim en-bloc; Representative opens groups unowned.</SampleNote>

      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
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

      <Sheet title={`Complaint pool · ${pool.length} complaints`}>
        {pool.length === 0 ? (
          <div className="space-y-3 px-4 py-10 text-center md:px-5">
            <p className="text-base text-ink-soft">No ungrouped complaints match these filters.</p>
            <button onClick={clear} className={textLink}>Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-soft">
                  <th scope="col" className="px-4 py-3 font-bold md:px-5">Ref.</th>
                  <th scope="col" className="px-4 py-3 font-bold">Complaint</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>

      <p className="text-sm text-ink-soft">
        Claimed work appears under <Link to="/yb/complaints/assigned" className={textLink}>Assigned Complaints</Link>.
      </p>

      <ComplaintDetailDialog
        key={`detail-${selectedId ?? "none"}`}
        complaint={complaints.find((x) => x.id === selectedId) ?? null}
        user={user}
        canClaim={canClaim}
        canReassign={false}
        poolMode
        onClose={() => setSelectedId(null)}
        onClaim={onClaimRequest}
        onAddUpdate={() => {}}
      />

      <ClaimCaseGroupDialog
        key={`claim-${seedComplaint?.id ?? "none"}`}
        seedComplaint={seedComplaint}
        candidates={claimCandidates}
        user={user}
        canClaim={canClaim}
        defaultCategory={seedComplaint?.category ?? ybCategories[0]}
        onConfirm={onConfirmClaim}
        onClose={() => setClaimSeedId(null)}
      />
    </div>
  );
}
