// Single aduan popup, opened from Complaints table. Composer gated to claimer only.
// TODO: POST /api/aduan/:id/updates + file storage; session-local history for now.
import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import Badge from "../ui/Badge";
import { inputClass, labelClass, secondaryButton, textLink } from "../ui/styles";
import { END_FLOW_REASONS, formatDate, formatDateTime, formatDisplayRef } from "../../data/ybSample";
import { citizenName } from "../../data/ybCitizens";
import { staffName } from "../../data/ybStaff";
import { isOpenComplaint, useYbComplaints } from "../../context/YbComplaintsContext";
import useDialogFocus from "./useDialogFocus";

// "Label: explanation", split for display; the stored string stays verbatim.
const splitReason = (reason) => {
  const cut = reason.indexOf(":");
  return cut === -1
    ? { label: reason, detail: "" }
    : { label: reason.slice(0, cut), detail: reason.slice(cut + 2) };
};

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
  onConfirmMember,
  onToggleAttention,
  canFlag,
}) {
  const dialogRef = useDialogFocus(!!c);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [repeatInGroup, setRepeatInGroup] = useState(true);
  const [confirmNote, setConfirmNote] = useState("");
  const [showRelease, setShowRelease] = useState(false);
  const [releaseMode, setReleaseMode] = useState("transfer-group");
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseRepeat, setReleaseRepeat] = useState(true);
  const [releaseError, setReleaseError] = useState("");
  const [groupDestId, setGroupDestId] = useState("");
  const [groupError, setGroupError] = useState("");
  const [pullGroupDestId, setPullGroupDestId] = useState("");
  const [pullError, setPullError] = useState("");
  const [flagError, setFlagError] = useState("");
  const fileInputRef = useRef(null);

  const { groupOwnerOf } = useYbComplaints();

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

  const submitUpdate = (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!ownerId) {
      setFormError("Ungrouped complaints cannot be updated. Group and claim it first.");
      return;
    }
    if (!isOwner) {
      setFormError(`Only ${ownerName} can add updates.`);
      return;
    }
    if (!text) {
      setFormError("Write update text first.");
      return;
    }
    onAddUpdate(c.id, { detail: text, attachmentName: fileName || null, repeatInGroup: caseGroup ? repeatInGroup : false });
    setBody("");
    setFileName("");
    setFormError("");
    setRepeatInGroup(true);
    setShowComposer(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelComposer = () => {
    setShowComposer(false);
    setBody("");
    setFileName("");
    setFormError("");
    setRepeatInGroup(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isRepresentative = user?.role === "Representative";
  const canRelease = isOwner || isRepresentative;

  const resetRelease = () => {
    setShowRelease(false);
    setReleaseMode("transfer-group");
    setReleaseReason("");
    setReleaseRepeat(true);
    setReleaseError("");
    setGroupDestId("");
    setGroupError("");
  };

  const submitGroupMove = (e) => {
    e.preventDefault();
    setGroupError("");
    if (!groupDestId) {
      setGroupError("Pick the case group taking this complaint.");
      return;
    }
    const result = onTransferToGroup?.(c.id, groupDestId);
    if (!result?.ok) {
      setGroupError(result?.message ?? "Move did not go through.");
    }
  };

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
            <p className="mt-1 text-sm text-ink-soft">{c.category} · {c.locality}</p>
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
            <dd className="text-ink">{citizenName(c.citizen_id)}</dd>
            <dt className="font-bold text-ink">Occurred</dt>
            <dd className="tabular text-ink">{formatDateTime(c.time_of_occurrence)}</dd>
            <dt className="font-bold text-ink">Kawasan</dt>
            <dd className="text-ink">{c.locality}{c.constituency_kod ? ` · ${c.constituency_kod}` : ""}</dd>
            {c.case_group_id && (
              <>
                <dt className="font-bold text-ink">Case group</dt>
                <dd className="text-ink">
                  {c.case_group_id}{c.case_group_confirmed ? " · confirmed" : " · tentative"}
                  {!c.case_group_confirmed && (isOwner || isRepresentative) && onConfirmMember && (
                    <span className="ml-3 inline-flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const ok = onConfirmMember(c.id);
                          setConfirmNote(ok ? "Membership confirmed." : "Complaint is closed and cannot be confirmed.");
                        }}
                        className={textLink}
                      >
                        Confirm membership
                      </button>
                      {confirmNote && <span className="text-xs text-ink-soft">{confirmNote}</span>}
                    </span>
                  )}
                </dd>
              </>
            )}
            <dt className="font-bold text-ink">Owner</dt>
            <dd className="text-ink">
              {ownerName}
              <span className="ml-3 inline-flex flex-wrap gap-2">
                {!ownerId && poolMode && (
                  <button onClick={() => onClaim(c.id)} className={textLink}>
                    {canClaim ? "Claim" : "Open group"}
                  </button>
                )}
              </span>
              {poolMode && !ownerId && (
                <span className="mt-1 block text-xs text-ink-soft">
                  Grouping opens a Case Group. You can add other pool complaints there.
                </span>
              )}
            </dd>
            <dt className="font-bold text-ink">Reported</dt>
            <dd className="text-ink">{formatDate(c.date)}</dd>
            <dt className="font-bold text-ink">Updated</dt>
            <dd className="text-ink">{formatDate(c.updatedAt)}</dd>
          </dl>

          {poolMode ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
                Pending in the pool. Triage happens after claiming, under Assigned Complaints.
              </div>
              {onTransferToGroup && (
                <form onSubmit={submitGroupMove} className="space-y-2 rounded-2xl border border-line px-4 py-3">
                  <h3 className="text-sm font-bold text-ink">Add to existing case group</h3>
                  {groupCandidates.length === 0 ? (
                    <p className="text-sm text-ink-soft">
                      No open groups you own. Claim as a new group instead.
                    </p>
                  ) : (
                    <>
                      <label htmlFor="dlg-group-dest" className={labelClass}>Case group</label>
                      <select
                        id="dlg-group-dest"
                        value={groupDestId}
                        onChange={(e) => setGroupDestId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Pick group…</option>
                        {groupCandidates.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title} · {g.memberCount} complaint{g.memberCount === 1 ? "" : "s"}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-ink-soft">
                        Moves to In Progress under that group owner.
                      </p>
                    </>
                  )}
                  {groupError && <p role="alert" className="text-sm font-medium text-red-700">{groupError}</p>}
                  {groupCandidates.length > 0 && (
                    <button type="submit" className={secondaryButton}>Add to group</button>
                  )}
                </form>
              )}
            </div>
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
          )}

          <div>
            <h3 className="text-sm font-bold text-ink">History</h3>
            {(c.history ?? []).length === 0 ? (
              <p className="mt-1 text-sm text-ink-soft">No updates yet.</p>
            ) : (
              <ol className="mt-2 space-y-2 border-l border-line pl-4">
                {(c.history ?? []).map((h, i) => (
                  <li key={`${h.at}-${h.by}-${i}`} className="text-sm">
                    <span className="tabular font-semibold text-accent-ink">{formatDate(h.at)}</span>
                    <span className="text-ink"> · {staffName(h.by)}: {h.detail}</span>
                    {h.attachmentName && (
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> {h.attachmentName}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div key={c.id} className="space-y-3 border-t border-line pt-4">
            <h3 className="text-sm font-bold text-ink">Add update</h3>
            {!ownerId ? (
              <p className="text-sm text-ink-soft">Ungrouped complaints cannot be updated. Group and claim it first.</p>
            ) : !isOwner ? (
              <p className="text-sm text-ink-soft">Only {ownerName} can add updates.</p>
            ) : !showComposer ? (
              <button type="button" onClick={() => setShowComposer(true)} className={secondaryButton}>
                Add update
              </button>
            ) : (
              <form onSubmit={submitUpdate} className="space-y-3">
            <div>
              <label htmlFor="dlg-update-body" className={labelClass}>Update text</label>
              <textarea
                id="dlg-update-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="What was done, next step…"
                className={`${inputClass} min-h-24 py-2`}
              />
            </div>
            <div>
              <label htmlFor="dlg-update-file" className={labelClass}>Attachment</label>
              <input
                ref={fileInputRef}
                id="dlg-update-file"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                className="block w-full text-sm text-ink file:mr-3 file:min-h-11 file:rounded-2xl file:border-2 file:border-ink/80 file:bg-white file:px-4 file:text-sm file:font-bold"
              />
              {fileName && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> {fileName}
                </p>
              )}
            </div>
            {formError && <p role="alert" className="text-sm font-medium text-red-700">{formError}</p>}
            {caseGroup && (
              <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-line bg-canvas px-3 py-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={repeatInGroup}
                  onChange={(e) => setRepeatInGroup(e.target.checked)}
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
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={secondaryButton}>Append update</button>
              <button type="button" onClick={cancelComposer} className={textLink}>Cancel</button>
            </div>
            <p className="text-xs text-ink-soft">Not saved to server yet. Updates stay in this session until the aduan API lands.</p>
              </form>
            )}
          </div>

          {!poolMode && onReleaseComplaint && canRelease && (
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
                          <select
                            id="dlg-release-group"
                            value={groupDestId}
                            onChange={(e) => setGroupDestId(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Pick group…</option>
                            {groupCandidates.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.title} · {g.memberCount} complaint{g.memberCount === 1 ? "" : "s"}
                              </option>
                            ))}
                          </select>
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
          )}

          {!poolMode && !canRelease && onTransferToGroup && (
            <div className="space-y-3 border-t border-line pt-4">
              <h3 className="text-sm font-bold text-ink">Pull into my group</h3>
              <p className="text-sm text-ink-soft">
                Owned by {ownerName}. You can pull this complaint, or its whole case group, into a group you own.
              </p>
              {!isOpenComplaint(c) ? (
                <p className="text-sm text-ink-soft">Complaint is closed. Nothing to pull.</p>
              ) : (
                <>
                  <form onSubmit={submitGroupMove} className="space-y-2">
                    {groupCandidates.length === 0 ? (
                      <p className="text-sm text-ink-soft">
                        No open groups you own. Open one from the pool first.
                      </p>
                    ) : (
                      <>
                        <label htmlFor="dlg-pull-dest" className={labelClass}>Pull this complaint to</label>
                        <select
                          id="dlg-pull-dest"
                          value={groupDestId}
                          onChange={(e) => setGroupDestId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Pick group…</option>
                          {groupCandidates.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title} · {g.memberCount} complaint{g.memberCount === 1 ? "" : "s"}
                            </option>
                          ))}
                        </select>
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
                          <select
                            id="dlg-pull-group-dest"
                            value={pullGroupDestId}
                            onChange={(e) => setPullGroupDestId(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Pick group…</option>
                            {groupCandidates.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.title} · {g.memberCount} complaint{g.memberCount === 1 ? "" : "s"}
                              </option>
                            ))}
                          </select>
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
          )}
        </div>
      </div>
    </div>
  );
}
