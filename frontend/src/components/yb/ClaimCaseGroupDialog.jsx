// Claim popup: confirms a Case Group is opened to claim the complaint and
// lets staff pull in other pool complaints so they share future updates.
// Aide/Intern claim for themselves; Representative must assign to an Aide or Intern.
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { errorClass, inputClass, labelClass, primaryButton, textLink } from "../ui/styles";
import { formatDisplayRef } from "../../data/ybSample";

export default function ClaimCaseGroupDialog({
  seedComplaint: seed,
  candidates,
  user,
  canClaim,
  defaultCategory,
  assignees = [],
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const [title, setTitle] = useState(() => (seed ? `${seed.category} round · ${seed.locality}` : ""));
  const [category, setCategory] = useState(() => seed?.category ?? defaultCategory ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [extraIds, setExtraIds] = useState([]);
  const [filter, setFilter] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!seed) return;
    const node = dialogRef.current;
    node?.querySelector("input, select, button")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [seed, onClose]);

  if (!seed) return null;

  const q = filter.trim().toLowerCase();
  const visible = candidates.filter(
    (c) => !q || `${c.title} ${c.locality} ${c.ref_no ?? ""}`.toLowerCase().includes(q)
  );

  const toggleExtra = (id) =>
    setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Give the case group a title.");
      return;
    }
    if (!canClaim && !assigneeId) {
      setFormError("Pick an Aide or Intern to assign this group to.");
      return;
    }
    onConfirm({
      title: title.trim(),
      category: category || seed.category,
      extraIds,
      ...(canClaim ? {} : { ownerStaffId: assigneeId }),
    });
  };

  const total = 1 + extraIds.length;
  const assigneeName = assignees.find((s) => s.id === assigneeId)?.name ?? null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-group-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
          <div>
            <p className="tabular text-xs font-semibold text-accent-ink">
              Ruj. {formatDisplayRef(seed.id)} · {canClaim ? `Claimed by ${user?.name ?? "staff"}` : `Assigning to ${assigneeName ?? "an Aide or Intern"}`}
            </p>
            <h2 id="claim-group-title" className="mt-0.5 text-lg font-extrabold text-ink">
              A Case Group is opened to claim this complaint
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {canClaim
                ? `"${seed.title}" and ${extraIds.length} other${extraIds.length === 1 ? "" : "s"} will be claimed under one group.`
                : `"${seed.title}" and ${extraIds.length} other${extraIds.length === 1 ? "" : "s"} will be assigned${assigneeName ? ` to ${assigneeName}` : ""} under one group.`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close claim dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-soft hover:bg-canvas hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-4 py-4 md:px-5">
          <div>
            <label htmlFor="claim-group-name" className={labelClass}>Group title</label>
            <input
              id="claim-group-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Street light round Seksyen 17"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="claim-group-category" className={labelClass}>Category</label>
            <input
              id="claim-group-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            />
          </div>

          {!canClaim && (
            <div>
              <label htmlFor="claim-group-assignee" className={labelClass}>Assign to</label>
              <select
                id="claim-group-assignee"
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  setFormError("");
                }}
                className={inputClass}
              >
                <option value="">Pick an Aide or Intern…</option>
                {assignees.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.role}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-soft">
                The group opens In Progress under this owner.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-ink">
              Add other complaints to this group · {extraIds.length} added
            </h3>
            <p className="text-xs text-ink-soft">
              Pool complaints only. Assigned complaints already belong to a Case Group.
              Added complaints receive the same updates as this one.
            </p>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter pool complaints"
              aria-label="Filter pool complaints"
              className={inputClass}
            />
            {visible.length === 0 ? (
              <p className="text-sm text-ink-soft">No other pool complaints match.</p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-line p-2">
                {visible.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-2 hover:bg-canvas">
                      <input
                        type="checkbox"
                        checked={extraIds.includes(c.id)}
                        onChange={() => toggleExtra(c.id)}
                        aria-label={`Add complaint ${formatDisplayRef(c.id)} to group`}
                        className="mt-1 h-4 w-4 accent-brand"
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block font-bold text-ink">{c.title}</span>
                        <span className="block text-xs text-ink-soft">
                          <span className="tabular font-semibold text-accent-ink">Ref. {formatDisplayRef(c.id)}</span>
                          {" · "}{c.category} · {c.locality}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && <p role="alert" className={errorClass}>{formError}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={primaryButton}>
              {canClaim ? `Open group and claim ${total}` : `Open group and assign (${total})`}
            </button>
            <button type="button" onClick={onClose} className={textLink}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
