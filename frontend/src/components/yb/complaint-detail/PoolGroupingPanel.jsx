import { useState } from "react";

import { labelClass, primaryButton, secondaryButton } from "../../ui/styles";
import GroupSelect from "./GroupSelect";
import useGroupMove from "./useGroupMove";

// Pool view: choose between adding the complaint to an existing group or opening a new one.
export default function PoolGroupingPanel({ complaint, canClaim, groupCandidates, onTransferToGroup, onClaim }) {
  const { groupDestId, setGroupDestId, groupError, setGroupError, selectedOwner, submit } = useGroupMove(
    complaint.id,
    onTransferToGroup,
    groupCandidates
  );
  const [claimPath, setClaimPath] = useState(
    groupCandidates.length > 0 && onTransferToGroup ? "existing" : "new"
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
        Pending in the pool. Grouping continues after claiming, under Assigned Complaints.
      </div>
      <div className="space-y-3 rounded-2xl border border-line px-4 py-3">
        <h3 className="text-sm font-bold text-ink">Group this complaint</h3>
        {onTransferToGroup ? (
          <fieldset>
            <legend className="sr-only">How to group</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 hover:bg-canvas ${claimPath === "existing" ? "border-brand" : "border-line"} ${groupCandidates.length === 0 ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="claim-path"
                  value="existing"
                  checked={claimPath === "existing"}
                  disabled={groupCandidates.length === 0}
                  onChange={() => {
                    setClaimPath("existing");
                    setGroupError("");
                  }}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span className="text-sm">
                  <span className="block font-bold text-ink">Add to existing group</span>
                  <span className="block text-xs text-ink-soft">
                    {groupCandidates.length === 0
                      ? "No open groups you own."
                      : "Moves to In Progress under that group owner."}
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 hover:bg-canvas ${claimPath === "new" ? "border-brand" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="claim-path"
                  value="new"
                  checked={claimPath === "new"}
                  onChange={() => {
                    setClaimPath("new");
                    setGroupError("");
                  }}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span className="text-sm">
                  <span className="block font-bold text-ink">Open new group</span>
                  <span className="block text-xs text-ink-soft">
                    Start a new case group with this complaint.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        ) : null}
        {claimPath === "existing" && onTransferToGroup ? (
          <form onSubmit={submit} className="space-y-2">
            {groupCandidates.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No open groups you own. Open a new group instead.
              </p>
            ) : (
              <>
                <label htmlFor="dlg-group-dest" className={labelClass}>Case group</label>
                <GroupSelect id="dlg-group-dest" value={groupDestId} onChange={setGroupDestId} groups={groupCandidates} />
                <p className="text-xs text-ink-soft">
                  {selectedOwner
                    ? `Moves to In Progress under ${selectedOwner}.`
                    : "Moves to In Progress under that group owner."}
                </p>
              </>
            )}
            {groupError && <p role="alert" className="text-sm font-medium text-red-700">{groupError}</p>}
            {groupCandidates.length > 0 && (
              <button type="submit" className={secondaryButton}>Add to group</button>
            )}
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">
              Grouping opens a Case Group. You can add other pool complaints there.
            </p>
            <button
              type="button"
              onClick={() => onClaim?.(complaint.id)}
              className={primaryButton}
            >
              {canClaim ? "Open new group and claim" : "Open new group and assign"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
