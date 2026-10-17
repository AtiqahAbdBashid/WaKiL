import { AlertCircle, Check, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import Button from '../../ui/Button'
import Assistant from './Assistant'
import TicketCard from './TicketCard'

export default function ChatMessage({ msg, isLastAi, confirmedTicket, confirming, onConfirm, onRetry, onNewChat }) {
  return (
    <div>
      {msg.type === 'user' && (
        <div className="ml-auto w-fit max-w-[85%] rounded-3xl bg-brand px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm space-y-2">
          {msg.image && (
            <img
              src={msg.image}
              alt="Uploaded evidence"
              className="max-h-56 max-w-full rounded-2xl object-cover border border-white/20 shadow-sm"
            />
          )}
          {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
        </div>
      )}

      {msg.type === 'ai' && (
        <Assistant>
          <div className="whitespace-pre-wrap">{msg.text}</div>

          {/* If this message indicates ready to confirm */}
          {msg.can_confirm && !confirmedTicket && isLastAi && (
            <div className="mt-4 rounded-2xl border-2 border-brand/30 bg-brand-soft/50 p-4 transition">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-ink">
                    All details collected & ready for confirmation
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Please review the summary above. When you are ready, press the Confirm button below
                    to submit your official complaint.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={onConfirm}
                      disabled={confirming}
                      variant="primary"
                      size="sm"
                      className="gap-2"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting ticket...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Confirm & Submit Complaint
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Assistant>
      )}

      {msg.type === 'success' && (
        <Assistant>
          <TicketCard msg={msg} onNewChat={onNewChat} />
        </Assistant>
      )}

      {msg.type === 'error' && (
        <Assistant>
          <div className="max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Error Encountered</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">{msg.text}</p>
            {msg.retryText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(msg.retryText)}
                className="!text-rose-900 hover:!bg-rose-100 !px-3 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        </Assistant>
      )}
    </div>
  )
}
