// Single aduan popup, opened from Complaints table. Composer gated to claimer only.
// TODO: POST /api/aduan/:id/updates + file storage; session-local history for now.
import { useEffect } from "react";
import { X } from "lucide-react";

import Badge from "../ui/Badge";
import { labelClass } from "../ui/styles";
import { formatDate, formatDateTime, formatDisplayRef } from "../../data/ybSample";
import { useYbComplaints } from "../../context/YbComplaintsContext";
import useDialogFocus from "./useDialogFocus";
import HistoryList from "./complaint-detail/HistoryList";
import PoolGroupingPanel from "./complaint-detail/PoolGroupingPanel";
import PullPanel from "./complaint-detail/PullPanel";
import ReleasePanel from "./complaint-detail/ReleasePanel";
import RepresentativeFlagPanel from "./complaint-detail/RepresentativeFlagPanel";
import UpdateComposer from "./complaint-detail/UpdateComposer";

export default function ComplaintDetailDialog({
  complaint: c,
  user,
  canClaim,
  poolMode = false,
  caseGroup = null,
  groupCandidates = [],
  sourceGroupId = null,
  sourceOpenCount = 0,
  canMarkResolved = false,
  onClose,
  onClaim,
  onAddUpdate,
  onReleaseComplaint,
  onTransferToGroup,
  onPullGroup,
  onToggleAttention,
  canFlag,
}) {
  const dialogRef = useDialogFocus(!!c);
  const { groupOwnerOf, staffName } = useYbComplaints();

  useEffect(() => {
    if (!c) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [c, onClose]);

  if (!c) return null;

  // Owner equals worker: the complaint's group owner is its single assignee.
  const ownerId = groupOwnerOf(c);
  const isOwner = !!ownerId && ownerId === user?.id;
  const ownerName = ownerId ? staffName(ownerId) : "Pool";
  const canRelease = isOwner || user?.role === "Representative";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aduan-dialog-title"
        aria-describedby="aduan-dialog-body"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
          <div className="min-w-0">
            <p className="tabular text-xs font-semibold text-accent-ink">Ruj. {formatDisplayRef(c)}</p>
            <h2 id="aduan-dialog-title" className="mt-0.5 text-lg font-extrabold text-ink">{c.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{[c.category, c.locality].filter(Boolean).join(" · ")}</p>
            {c.needsRepresentativeAttention && (
              <p className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                Flagged for Representative review
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge>{c.status}</Badge>
            <button
              onClick={onClose}
              aria-label="Close aduan detail"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-ink-soft hover:bg-canvas hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-4 py-4 md:px-5">
          <div>
            <h3 className="text-sm font-bold text-ink">Report</h3>
            <p id="aduan-dialog-body" className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {c.body?.trim() ? c.body : "No report text."}
            </p>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="font-bold text-ink">Reporter</dt>
            <dd className="text-ink">{c.citizen_name}</dd>
            <dt className="font-bold text-ink">Occurred</dt>
            <dd className="tabular text-ink">{formatDateTime(c.time_of_occurrence)}</dd>
            <dt className="font-bold text-ink">Kawasan</dt>
            <dd className="text-ink">{c.locality || (c.lat != null ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : "Not pinned")}{c.constituency_kod ? ` · ${c.constituency_kod}` : ""}</dd>
            {c.case_group_id && (
              <>
                <dt className="font-bold text-ink">Case group</dt>
                <dd className="text-ink">{c.case_group_id}</dd>
              </>
            )}
            <dt className="font-bold text-ink">Owner</dt>
            <dd className="text-ink">{ownerName}</dd>
            <dt className="font-bold text-ink">Reported</dt>
            <dd className="text-ink">{formatDate(c.date)}</dd>
            <dt className="font-bold text-ink">Updated</dt>
            <dd className="text-ink">{formatDate(c.updatedAt)}</dd>
          </dl>


          {poolMode ? (
            <PoolGroupingPanel
              key={c.id}
              complaint={c}
              canClaim={canClaim}
              groupCandidates={groupCandidates}
              onTransferToGroup={onTransferToGroup}
              onClaim={onClaim}
            />
          ) : (
          <div>
            <p className={labelClass}>Status</p>
            <div className="mt-1">
              <Badge>{c.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Claiming moves a complaint to In Progress. Ending resolves it. Move it to another group you own below.
            </p>
          </div>
          )}

          {!poolMode && onToggleAttention && (
            <RepresentativeFlagPanel key={c.id} complaint={c} canFlag={canFlag} onToggleAttention={onToggleAttention} />
          )}

          <HistoryList complaint={c} />

          <UpdateComposer
            key={c.id}
            complaint={c}
            ownerId={ownerId}
            isOwner={isOwner}
            ownerName={ownerName}
            caseGroup={caseGroup}
            onAddUpdate={onAddUpdate}
          />

          {!poolMode && onReleaseComplaint && canRelease && (
            <ReleasePanel
              key={c.id}
              complaint={c}
              ownerId={ownerId}
              ownerName={ownerName}
              canRelease={canRelease}
              canMarkResolved={canMarkResolved}
              caseGroup={caseGroup}
              groupCandidates={groupCandidates}
              onTransferToGroup={onTransferToGroup}
              onReleaseComplaint={onReleaseComplaint}
            />
          )}

          {!poolMode && !canRelease && onTransferToGroup && (
            <PullPanel
              key={c.id}
              complaint={c}
              ownerName={ownerName}
              groupCandidates={groupCandidates}
              sourceGroupId={sourceGroupId}
              sourceOpenCount={sourceOpenCount}
              onTransferToGroup={onTransferToGroup}
              onPullGroup={onPullGroup}
            />
          )}
        </div>
      </div>
    </div>
  );
}
