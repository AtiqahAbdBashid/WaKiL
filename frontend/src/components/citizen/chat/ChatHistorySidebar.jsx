import { History, Loader2, Plus, Trash2 } from 'lucide-react'
import InlineNotice from '../../ui/InlineNotice'

function formatSessionDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatHistorySidebar({
  sessions,
  loadingSessions,
  sessionId,
  notice,
  onDismissNotice,
  onSelect,
  onDelete,
  onNew,
}) {
  return (
    <aside className="w-64 sm:w-72 shrink-0 border-r border-line/60 bg-canvas/30 flex flex-col min-h-0 transition-all">
      <div className="flex items-center justify-between border-b border-line/40 p-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-brand" />
          Chat History
        </span>
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <InlineNotice message={notice} onDismiss={onDismissNotice} className="m-2" />

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingSessions ? (
          <div className="flex items-center justify-center p-6 text-xs text-muted">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-brand" />
            Loading history...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted">
            No conversation history yet. Start asking WaKiL AI!
          </div>
        ) : (
          sessions.map((s) => {
            const isSelected = s.id === sessionId
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`group relative flex cursor-pointer items-start justify-between rounded-xl p-2.5 text-left transition ${
                  isSelected
                    ? 'bg-brand-soft/80 border border-brand/30 text-ink shadow-xs'
                    : 'hover:bg-canvas text-ink/80 hover:text-ink'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-brand-dark font-bold' : ''}`}>
                    {s.title || 'Conversation'}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <span>{formatSessionDate(s.started_at)}</span>
                    {s.complaint_ticket_id ? (
                      <span className="rounded bg-mint-soft px-1.5 py-0.2 text-[9px] font-bold text-mint-dark">
                        {s.complaint_ticket_id}
                      </span>
                    ) : (
                      <span>· {s.message_count} msgs</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => onDelete(e, s.id)}
                  title="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-600 transition rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
