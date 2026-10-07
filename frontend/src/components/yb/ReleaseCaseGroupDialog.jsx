// Group-level release. One Case Group leaves your hands two ways: hand the
// whole group to another Aide/Intern, or end the flow by declining every open
// complaint under a fixed reason (Representative only).
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { errorClass, inputClass, labelClass, primaryButton, textLink } from "../ui/styles";
import { END_FLOW_REASONS } from "../../data/ybSample";
import useDialogFocus from "./useDialogFocus";

// "Label: explanation", split for display; the stored string stays verbatim.
const splitReason = (reason) => {
  const cut = reason.indexOf(":");
  return cut === -1
    ? { label: reason, detail: "" }
    : { label: reason.slice(0, cut), detail: reason.slice(cut + 2) };
};

export default function ReleaseCaseGroupDialog({
  group,
  memberCount,
  openCount,
  ownerName,
  canMarkResolved,
  candidates,
  onTransfer,
  onEndFlow,
  onClose,
}) {
  const dialogRef = useDialogFocus(!!group);
  const [choice, setChoice] = useState("transfer");
  const [nextId, setNextId] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!group) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [group, onClose]);

  if (!group) return null;

  const submit = (e) => {
    e.preventDefault();
    setFormError("");
    if (choice === "transfer") {
      if (!nextId) {
        setFormError("Pick the Aide or Intern taking this group.");
        return;
      }
      const result = onTransfer(group.id, nextId);
      if (!result?.ok) setFormError(result?.message ?? "Transfer did not go through.");
      return;
    }
    if (!canMarkResolved) {
      setFormError("Only Representative can end the flow.");
      return;
    }
    if (!reason) {
      setFormError("Pick a decline reason.");
      return;
    }
    const result = onEndFlow(group.id, reason);
    if (!result?.ok) setFormError(result?.message ?? "The flow could not be ended.");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-group-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
          <div className="min-w-0">
            <p className="tabular text-xs font-semibold text-accent-ink">
              {memberCount} complaint{memberCount === 1 ? "" : "s"} · owner {ownerName}
            </p>
            <h2 id="release-group-title" className="mt-0.5 text-lg font-extrabold text-ink">
              Release this case group
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              &ldquo;{group.title}&rdquo; leaves your queue as a whole. Single complaints stay inside
              the group.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close release dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-soft hover:bg-canvas hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-4 py-4 md:px-5">
          <fieldset className="space-y-2">
            <legend className={labelClass}>What happens to this group</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line px-3 py-2 hover:bg-canvas">
              <input
                type="radio"
                name="release-choice"
                value="transfer"
                checked={choice === "transfer"}
                onChange={() => setChoice("transfer")}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span className="text-sm">
                <span className="block font-bold text-ink">Transfer the whole group</span>
                <span className="block text-xs text-ink-soft">
                  Ownership and every complaint move to another Aide or Intern.
                </span>
              </span>
            </label>
            {canMarkResolved && (
              <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line px-3 py-2 hover:bg-canvas">
                <input
                  type="radio"
                  name="release-choice"
                  value="end"
                  checked={choice === "end"}
                  onChange={() => setChoice("end")}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span className="text-sm">
                  <span className="block font-bold text-ink">End the flow</span>
                  <span className="block text-xs text-ink-soft">
                    {openCount} open complaint{openCount === 1 ? "" : "s"} declined, the rest stay
                    closed, and the group closes.
                  </span>
                </span>
              </label>
            )}
          </fieldset>

          {choice === "transfer" ? (
            <div>
              {candidates.length === 0 ? (
                <p className="text-sm text-ink-soft">No other active Aide or Intern to take it.</p>
              ) : (
                <>
                  <label htmlFor="release-transfer-to" className={labelClass}>Transfer to</label>
                  <select
                    id="release-transfer-to"
                    value={nextId}
                    onChange={(e) => setNextId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Pick staff…</option>
                    {candidates.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ) : (
            <fieldset>
              <legend className={labelClass}>Decline reason</legend>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-line p-2">
                {END_FLOW_REASONS.map((r) => {
                  const { label, detail } = splitReason(r);
                  return (
                    <li key={r}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-2 hover:bg-canvas">
                        <input
                          type="radio"
                          name="end-reason"
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="mt-1 h-4 w-4 accent-brand"
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-bold text-ink">{label}</span>
                          <span className="block text-xs text-ink-soft">{detail}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {formError && <p role="alert" className={errorClass}>{formError}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={primaryButton}>
              {choice === "transfer" ? "Transfer group" : "End flow"}
            </button>
            <button type="button" onClick={onClose} className={textLink}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
