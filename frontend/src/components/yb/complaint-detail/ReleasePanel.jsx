import { useState } from "react";

import { labelClass, secondaryButton, textLink } from "../../ui/styles";
import { END_FLOW_REASONS } from "../../../data/ybSample";
import { isOpenComplaint } from "../../../context/YbComplaintsContext";
import GroupSelect from "./GroupSelect";

// "Label: explanation", split for display; the stored string stays verbatim.
const splitReason = (reason) => {
  const cut = reason.indexOf(":");
  return cut === -1
    ? { label: reason, detail: "" }
    : { label: reason.slice(0, cut), detail: reason.slice(cut + 2) };
};

// Owner/Representative release: move to another group, or end and resolve.
export default function ReleasePanel({
  complaint: c,
  ownerId,
  ownerName,
  canRelease,
  canMarkResolved,
  caseGroup,
  groupCandidates,
  onTransferToGroup,
  onReleaseComplaint,
}) {
  const [showRelease, setShowRelease] = useState(false);
  const [releaseMode, setReleaseMode] = useState("transfer-group");
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseRepeat, setReleaseRepeat] = useState(true);
  const [releaseError, setReleaseError] = useState("");
  const [groupDestId, setGroupDestId] = useState("");
  const selectedDestOwner = groupCandidates.find((g) => g.id === groupDestId)?.ownerName ?? null;

  const resetRelease = () => {
    setShowRelease(false);
    setReleaseMode("transfer-group");
    setReleaseReason("");
    setReleaseRepeat(true);
    setReleaseError("");
    setGroupDestId("");
  };

  const submitRelease = (e) => {
    e.preventDefault();
    setReleaseError("");
    if (!ownerId) {
      setReleaseError("Ungrouped complaints have nothing to release. Group it first.");
      return;
    }
    if (!canRelease) {
      setReleaseError(`Only ${ownerName} can release.`);
      return;
    }
    if (releaseMode === "transfer-group") {
      if (!groupDestId) {
        setReleaseError("Pick the case group taking this complaint.");
        return;
      }
      const result = onTransferToGroup?.(c.id, groupDestId);
      if (!result?.ok) {
        setReleaseError(result?.message ?? "Move did not go through.");
        return;
      }
      resetRelease();
      return;
    }
    if (releaseMode === "end") {
      if (!canMarkResolved) {
        setReleaseError("Only Representative can end the flow.");
        return;
      }
      if (!releaseReason) {
        setReleaseError("Pick a resolve reason.");
        return;
      }
    }
    const result = onReleaseComplaint?.(c.id, {
      mode: releaseMode,
      reason: releaseReason || null,
      repeatInGroup: caseGroup ? releaseRepeat : false,
    });
    if (!result?.ok) {
      setReleaseError(result?.message ?? "Release did not go through.");
      return;
    }
    resetRelease();
  };

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <h3 className="text-sm font-bold text-ink">Release</h3>
      {!ownerId ? (
        <p className="text-sm text-ink-soft">Ungrouped complaint has nothing to release. Group it first.</p>
      ) : !isOpenComplaint(c) ? (
        <p className="text-sm text-ink-soft">Complaint is closed. Nothing to release.</p>
      ) : !showRelease ? (
        <button type="button" onClick={() => setShowRelease(true)} className={secondaryButton}>
          Release complaint
        </button>
      ) : (
        <form onSubmit={submitRelease} className="space-y-3">
          <fieldset className="space-y-2">
            <legend className={labelClass}>What happens to this complaint</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line px-3 py-2 hover:bg-canvas">
              <input
                type="radio"
                name="release-mode"
                value="transfer-group"
                checked={releaseMode === "transfer-group"}
                onChange={() => setReleaseMode("transfer-group")}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span className="text-sm">
                <span className="block font-bold text-ink">Move to another group you own</span>
                <span className="block text-xs text-ink-soft">
                  Moves into an existing open group you own. The complaint becomes In Progress there.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line px-3 py-2 hover:bg-canvas">
              <input
                type="radio"
                name="release-mode"
                value="end"
                checked={releaseMode === "end"}
                onChange={() => setReleaseMode("end")}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span className="text-sm">
                <span className="block font-bold text-ink">End and resolve</span>
                <span className="block text-xs text-ink-soft">
                  {canMarkResolved ? "Resolves this complaint under a fixed reason." : "Representative only."}
                </span>
              </span>
            </label>
          </fieldset>

          {releaseMode === "transfer-group" ? (
            <div>
              {!onTransferToGroup || groupCandidates.length === 0 ? (
                <p className="text-sm text-ink-soft">No other open groups you own to take it.</p>
              ) : (
                <>
                  <label htmlFor="dlg-release-group" className={labelClass}>Move to group</label>
                  <GroupSelect id="dlg-release-group" value={groupDestId} onChange={setGroupDestId} groups={groupCandidates} />
                  {selectedDestOwner && (
                    <p className="text-xs text-ink-soft">
                      Moves to In Progress under {selectedDestOwner}.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <fieldset>
              <legend className={labelClass}>Resolve reason</legend>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-line p-2">
                {END_FLOW_REASONS.map((r) => {
                  const { label, detail } = splitReason(r);
                  return (
                    <li key={r}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-2 hover:bg-canvas">
                        <input
                          type="radio"
                          name="dlg-end-reason"
                          checked={releaseReason === r}
                          onChange={() => setReleaseReason(r)}
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

          {caseGroup && releaseMode !== "transfer-group" && (
            <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line bg-canvas px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={releaseRepeat}
                onChange={(e) => setReleaseRepeat(e.target.checked)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span>
                Repeat throughout Case Group
                <span className="block text-xs text-ink-soft">
                  {caseGroup.title} · applies to {caseGroup.memberCount} complaint{caseGroup.memberCount === 1 ? "" : "s"}
                </span>
              </span>
            </label>
          )}

          {releaseError && <p role="alert" className="text-sm font-medium text-red-700">{releaseError}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={secondaryButton}>
              {releaseMode === "transfer-group" ? "Move to group" : "End and resolve"}
            </button>
            <button type="button" onClick={resetRelease} className={textLink}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
