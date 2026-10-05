import { useLayoutEffect } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'

const MAX_HEIGHT = 144

export default function ChatComposer({ value, onChange, onSend, inputRef }) {
  const canSend = value.trim().length > 0

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value, inputRef])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSend()
      }}
      className="rounded-3xl border border-line bg-white p-3 shadow-card focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
    >
      <label htmlFor="wakil-message" className="sr-only">
        Message WaKiL AI
      </label>
      <textarea
        id="wakil-message"
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question or describe an issue"
        className="block w-full resize-none bg-transparent px-2 py-1.5 text-base leading-6 text-ink placeholder:text-muted focus:outline-none"
      />
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          aria-label="Attach photo or document"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Paperclip className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            canSend ? 'bg-brand text-white hover:bg-brand-dark' : 'cursor-not-allowed bg-line text-muted'
          }`}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
