import { useState } from "react";

import { labelClass, secondaryButton } from "../../ui/styles";
import { isOpenComplaint } from "../../../context/YbComplaintsContext";
import GroupSelect from "./GroupSelect";
import useGroupMove from "./useGroupMove";

// Non-owners can pull a complaint, or its whole case group, into a group they own.
export default function PullPanel({
  complaint: c,
  ownerName,
  groupCandidates,
  sourceGroupId,
  sourceOpenCount,
  onTransferToGroup,
  onPullGroup,
}) {
  const { groupDestId, setGroupDestId, groupError, selectedOwner, submit } = useGroupMove(
    c.id,
    onTransferToGroup,
    groupCandidates
  );
  const [pullGroupDestId, setPullGroupDestId] = useState("");
  const [pullError, setPullError] = useState("");
  const selectedPullOwner = groupCandidates.find((g) => g.id === pullGroupDestId)?.ownerName ?? null;

  const submitPullGroup = (e) => {
    e.preventDefault();
    setPullError("");
    if (!sourceGroupId) {
      setPullError("This complaint is not in a case group.");
      return;
    }
    if (!pullGroupDestId) {
      setPullError("Pick the group taking the whole case group.");
      return;
    }
    const result = onPullGroup?.(sourceGroupId, pullGroupDestId);
    if (!result?.ok) {
      setPullError(result?.message ?? "Pull did not go through.");
    }
  };

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <h3 className="text-sm font-bold text-ink">Pull into my group</h3>
      <p className="text-sm text-ink-soft">
        Owned by {ownerName}. You can pull this complaint, or its whole case group, into a group you own.
      </p>
      {!isOpenComplaint(c) ? (
        <p className="text-sm text-ink-soft">Complaint is closed. Nothing to pull.</p>
      ) : (
        <>
          <form onSubmit={submit} className="space-y-2">
            {groupCandidates.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No open groups you own. Open one from the pool first.
              </p>
            ) : (
              <>
                <label htmlFor="dlg-pull-dest" className={labelClass}>Pull this complaint to</label>
                <GroupSelect id="dlg-pull-dest" value={groupDestId} onChange={setGroupDestId} groups={groupCandidates} />
                {selectedOwner && (
                  <p className="text-xs text-ink-soft">
                    Pulls into the group owned by {selectedOwner}.
                  </p>
                )}
              </>
            )}
            {groupError && <p role="alert" className="text-sm font-medium text-red-700">{groupError}</p>}
            {groupCandidates.length > 0 && (
              <button type="submit" className={secondaryButton}>Pull complaint</button>
            )}
          </form>
          {onPullGroup && sourceGroupId && sourceOpenCount > 1 && (
            <form onSubmit={submitPullGroup} className="space-y-2 rounded-2xl border border-line px-4 py-3">
              <h4 className="text-sm font-bold text-ink">
                Pull whole case group · {sourceOpenCount} open
              </h4>
              {groupCandidates.length === 0 ? (
                <p className="text-sm text-ink-soft">No open groups you own to take it.</p>
              ) : (
                <>
                  <label htmlFor="dlg-pull-group-dest" className={labelClass}>Pull all open to</label>
                  <GroupSelect id="dlg-pull-group-dest" value={pullGroupDestId} onChange={setPullGroupDestId} groups={groupCandidates} />
                  {selectedPullOwner && (
                    <p className="text-xs text-ink-soft">
                      Pulls into the group owned by {selectedPullOwner}.
                    </p>
                  )}
                </>
              )}
              {pullError && <p role="alert" className="text-sm font-medium text-red-700">{pullError}</p>}
              {groupCandidates.length > 0 && (
                <button type="submit" className={secondaryButton}>
                  Pull {sourceOpenCount} complaints
                </button>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
