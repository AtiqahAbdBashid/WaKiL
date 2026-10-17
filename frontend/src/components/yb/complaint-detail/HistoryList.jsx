import { Paperclip } from "lucide-react";

import { formatDate } from "../../../data/ybSample";
import { useYbComplaints } from "../../../context/YbComplaintsContext";

export default function HistoryList({ complaint: c }) {
  const { staffName } = useYbComplaints();

  return (
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
  );
}
