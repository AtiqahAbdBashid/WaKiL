import { useState } from "react";

import { secondaryButton } from "../../ui/styles";

// Aide/Intern flag a complaint for the Representative; the owner or Representative clears it.
export default function RepresentativeFlagPanel({ complaint: c, canFlag, onToggleAttention }) {
  const [flagError, setFlagError] = useState("");

  return (
    <div className="rounded-2xl border border-line bg-canvas px-4 py-3">
      <h3 className="text-sm font-bold text-ink">Representative review</h3>
      {c.status !== "In Progress" ? (
        <p className="mt-1 text-sm text-ink-soft">
          Flagging is available after claiming, while the complaint is In Progress.
        </p>
      ) : canFlag === false ? (
        <p className="mt-1 text-sm text-ink-soft">
          Only the assigned Aide or Intern can flag. Only the owner or Representative can clear.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-soft">
            {c.needsRepresentativeAttention
              ? "Flagged. The Representative clears it after review."
              : "Flag it when the Representative needs to review this complaint."}
          </p>
          <button
            type="button"
            onClick={() => {
              setFlagError("");
              const result = onToggleAttention(c.id, !c.needsRepresentativeAttention);
              if (!result?.ok) setFlagError(result?.message ?? "Flag did not go through.");
            }}
            className={`${secondaryButton} mt-2`}
          >
            {c.needsRepresentativeAttention ? "Clear Representative flag" : "Flag for Representative review"}
          </button>
          {flagError && <p role="alert" className="mt-1 text-sm font-medium text-red-700">{flagError}</p>}
        </>
      )}
    </div>
  );
}
