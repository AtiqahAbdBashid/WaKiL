import { useState } from "react";

// Shared state for moving one complaint into a case group the viewer owns.
export default function useGroupMove(complaintId, onTransferToGroup, groupCandidates) {
  const [groupDestId, setGroupDestId] = useState("");
  const [groupError, setGroupError] = useState("");
  const selectedOwner = groupCandidates.find((g) => g.id === groupDestId)?.ownerName ?? null;

  const submit = (e) => {
    e.preventDefault();
    setGroupError("");
    if (!groupDestId) {
      setGroupError("Pick the case group taking this complaint.");
      return;
    }
    const result = onTransferToGroup?.(complaintId, groupDestId);
    if (!result?.ok) {
      setGroupError(result?.message ?? "Move did not go through.");
    }
  };

  return { groupDestId, setGroupDestId, groupError, setGroupError, selectedOwner, submit };
}
