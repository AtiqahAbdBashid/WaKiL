import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

export default function FloatingChat() {
  return (
    <div className="fixed bottom-6 right-4 z-40 flex items-center gap-3 sm:right-6">
      <Link
        to="/citizen/wakil-ai"
        aria-hidden="true"
        tabIndex={-1}
        className="relative z-10 hidden -translate-y-7 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink transition [filter:drop-shadow(0_8px_16px_rgb(26_26_46/0.16))] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand motion-safe:active:scale-[0.97] sm:block"
      >
        Chat with WaKiL AI
        <span
          aria-hidden="true"
          className="absolute right-0 top-[calc(100%-1px)] h-3 w-7 bg-inherit [clip-path:polygon(0_0,40%_0,100%_100%)]"
        />
      </Link>
      <div className="relative">
        <span
          aria-hidden="true"
          className="chat-ring pointer-events-none absolute inset-0 rounded-full bg-mint"
        />
        <Link
          to="/citizen/wakil-ai"
          aria-label="Chat with WaKiL AI"
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-mint-dark text-white shadow-card transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:active:scale-95"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
