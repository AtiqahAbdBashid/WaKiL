import { MapPin } from 'lucide-react'
import ChatComposer from '../ChatComposer'

// Confirm banner, location pin row and message composer at the bottom of the chat.
export default function ChatInputArea({
  showConfirmBanner,
  confirming,
  onConfirm,
  pinnedLocation,
  onOpenMap,
  input,
  onInputChange,
  onSend,
  inputRef,
  disabled,
  attachedImage,
  onAttachedImageChange,
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {showConfirmBanner && (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-brand/30 bg-brand-soft/70 px-4 py-2 text-xs">
          <span className="font-medium text-brand-dark">
            Details complete. Ready to generate your official ticket.
          </span>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="font-bold text-brand hover:underline disabled:opacity-50"
          >
            {confirming ? 'Submitting...' : 'Confirm Now →'}
          </button>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between px-1 text-xs">
        <button
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-1.5 font-semibold text-brand transition hover:underline"
        >
          <MapPin className="h-3.5 w-3.5 text-accent" />
          <span>Pin location / Use current GPS</span>
        </button>
        {pinnedLocation && (
          <span
            title={pinnedLocation}
            className="font-mono text-[11px] text-mint-dark bg-mint-soft px-2.5 py-0.5 rounded-full truncate max-w-[200px] sm:max-w-[300px] font-semibold flex items-center gap-1"
          >
            <span>GPS:</span>
            <span className="truncate">{pinnedLocation}</span>
          </span>
        )}
      </div>

      <ChatComposer
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        inputRef={inputRef}
        disabled={disabled}
        onOpenLocationModal={onOpenMap}
        attachedImage={attachedImage}
        onAttachedImageChange={onAttachedImageChange}
      />

      <p className="mt-3 text-center text-xs text-muted">
        WaKiL AI processes complaints directly through the WaKiL backend service with automated intake verification.
      </p>
    </div>
  )
}
