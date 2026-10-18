import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";

import { inputClass, labelClass, secondaryButton, textLink } from "../../ui/styles";

// Owner-only update form. The parent keys it by complaint id so a new complaint starts blank.
export default function UpdateComposer({ complaint: c, ownerId, isOwner, ownerName, caseGroup, onAddUpdate }) {
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [repeatInGroup, setRepeatInGroup] = useState(true);
  const fileInputRef = useRef(null);

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

  return (
    <div className="space-y-3 border-t border-line pt-4">
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
  );
}
