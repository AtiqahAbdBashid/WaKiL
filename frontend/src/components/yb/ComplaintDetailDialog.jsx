// Single aduan popup, opened from Complaints table. Composer gated to claimer only.
// TODO: POST /api/aduan/:id/updates + file storage; session-local history for now.
import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import Badge from "../ui/Badge";
import { inputClass, labelClass, secondaryButton, textLink } from "../ui/styles";
import { formatDate, formatDateTime, formatDisplayRef } from "../../data/ybSample";
import { citizenName } from "../../data/ybCitizens";
import { staffName } from "../../data/ybStaff";
import useDialogFocus from "./useDialogFocus";

export default function ComplaintDetailDialog({
  complaint: c,
  user,
  canClaim,
  canReassign,
  statusOptions,
  poolMode = false,
  caseGroup = null,
  onClose,
  onClaim,
  onStatusChange,
  onAddUpdate,
  onConfirmMember,
}) {
  const dialogRef = useDialogFocus(!!c);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [repeatInGroup, setRepeatInGroup] = useState(true);
  const [confirmNote, setConfirmNote] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!c) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [c, onClose]);

  if (!c) return null;

  const isOwner = !!c.assigneeId && c.assigneeId === user?.id;
  const ownerName = c.assigneeId ? staffName(c.assigneeId) : "Pool";

  const submitUpdate = (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!c.assigneeId) {
      setFormError("Unassigned aduan cannot be updated. Claim it first.");
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
                  {!c.case_group_confirmed && canReassign && onConfirmMember && (
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
                {!c.assigneeId && (canClaim || poolMode) && (
                  <button onClick={() => onClaim(c.id)} className={textLink}>
                    {canClaim ? "Claim" : "Open group"}
                  </button>
                )}
              </span>
              {poolMode && !c.assigneeId && (
                <span className="mt-1 block text-xs text-ink-soft">
                  Claiming opens a Case Group. You can add other pool complaints there.
                </span>
              )}
            </dd>
            <dt className="font-bold text-ink">Reported</dt>
            <dd className="text-ink">{formatDate(c.date)}</dd>
            <dt className="font-bold text-ink">Updated</dt>
            <dd className="text-ink">{formatDate(c.updatedAt)}</dd>
          </dl>

          {poolMode ? (
            <div className="rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
              Status is {c.status}. Triage happens after claiming, under Assigned Complaints.
            </div>
          ) : (
            <div>
              <label htmlFor="dlg-status" className={labelClass}>Status</label>
              <select
                id="dlg-status"
                value={c.status}
                onChange={(e) => onStatusChange(c.id, e.target.value)}
                className={`${inputClass} text-sm`}
              >
                {statusOptions(c).map((s) => <option key={s}>{s}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink-soft">
                Assignment and release happen at the case group level.
              </p>
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
            {!c.assigneeId ? (
              <p className="text-sm text-ink-soft">Unassigned aduan cannot be updated. Claim it first.</p>
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
        </div>
      </div>
    </div>
  );
}
