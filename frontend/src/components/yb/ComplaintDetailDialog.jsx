// Single aduan popup, opened from Complaints table. Composer gated to claimer only.
import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

import Badge from "../ui/Badge";
import { inputClass, labelClass, secondaryButton, textLink } from "../ui/styles";
import { formatDate, formatRef } from "../../data/ybSample";
import { staffName, ybStaff } from "../../data/ybStaff";

const FOCUSABLE = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

function useDialogFocus(open) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const node = ref.current;
    const previous = document.activeElement;
    node.querySelector(FOCUSABLE)?.focus();
    const trapTab = (e) => {
      if (e.key !== "Tab") return;
      const items = node.querySelectorAll(FOCUSABLE);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", trapTab);
    return () => {
      node.removeEventListener("keydown", trapTab);
      previous?.focus?.();
    };
  }, [open ]);
  return ref;
}

export default function ComplaintDetailDialog({
  complaint: c,
  user,
  canClaim,
  canReassign,
  statusOptions,
  onClose,
  onClaim,
  onRelease,
  onReassign,
  onStatusChange,
  onAddUpdate,
}) {
  const dialogRef = useDialogFocus(!!c);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");
  const [showComposer, setShowComposer] = useState(false);

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
    onAddUpdate(c.id, { detail: text, attachmentName: fileName || null });
    setBody("");
    setFileName("");
    setFormError("");
    setShowComposer(false);
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
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-ticket bg-paper shadow-xl sm:rounded-ticket"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
          <div className="min-w-0">
            <p className="tabular text-xs font-semibold text-accent-ink">Ruj. {formatRef(c.id)}</p>
            <h2 id="aduan-dialog-title" className="mt-0.5 text-lg font-extrabold text-ink">{c.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{c.category} · {c.area}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge>{c.status}</Badge>
            <button
              onClick={onClose}
              aria-label="Close aduan detail"
              className="inline-flex h-11 w-11 items-center justify-center rounded-ticket text-ink-soft hover:bg-paper-sunk hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-4 py-4 md:px-5">
          <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="font-bold text-ink">Owner</dt>
            <dd className="text-ink">
              {ownerName}
              <span className="ml-3 inline-flex flex-wrap gap-2">
                {!c.assigneeId && canClaim && (
                  <button onClick={() => onClaim(c.id)} className={textLink}>Claim</button>
                )}
                {c.assigneeId === user?.id && (
                  <button onClick={() => onRelease(c.id)} className={textLink}>Release</button>
                )}
              </span>
            </dd>
            <dt className="font-bold text-ink">Reported</dt>
            <dd className="text-ink">{formatDate(c.date)}</dd>
            <dt className="font-bold text-ink">Updated</dt>
            <dd className="text-ink">{formatDate(c.updatedAt)}</dd>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <div>
              <label htmlFor="dlg-assignee" className={labelClass}>Assign</label>
              {canReassign ? (
                <select
                  id="dlg-assignee"
                  value={c.assigneeId ?? ""}
                  onChange={(e) => onReassign(c.id, e.target.value)}
                  className={`${inputClass} text-sm`}
                >
                  <option value="">Pool</option>
                  {ybStaff.filter((s) => s.active).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-ink-soft">Reassign: Wakil/Aide only</p>
              )}
            </div>
          </div>

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
                id="dlg-update-file"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                className="block w-full text-sm text-ink file:mr-3 file:min-h-11 file:rounded-ticket file:border-2 file:border-ink/80 file:bg-paper file:px-4 file:text-sm file:font-bold"
              />
              {fileName && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> {fileName}
                </p>
              )}
            </div>
            {formError && <p role="alert" className="text-sm font-medium text-red-700">{formError}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={secondaryButton}>Append update</button>
              <button type="button" onClick={() => { setShowComposer(false); setBody(""); setFileName(""); setFormError(""); }} className={textLink}>Cancel</button>
            </div>
            <p className="text-xs text-ink-soft">TODO: wire to POST /api/aduan/:id/updates + file storage; mock-first local history only.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
