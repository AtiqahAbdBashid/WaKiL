import { AlertCircle, X } from 'lucide-react'

// Non-blocking replacement for window.alert(): shows a dismissible message in place.
export default function InlineNotice({ message, onDismiss, className = '' }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 text-rose-700 hover:text-rose-900"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
