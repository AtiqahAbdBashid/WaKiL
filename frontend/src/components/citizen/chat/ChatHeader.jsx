import { Link } from 'react-router-dom'
import { ArrowLeft, History, SquarePen } from 'lucide-react'
import Button from '../../ui/Button'
import Logo from '../../ui/Logo'

export default function ChatHeader({ sidebarOpen, sessionCount, onToggleSidebar, onNewChat }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line/60 px-3 sm:px-5">
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          to="/citizen/dashboard"
          aria-label="Back to dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide conversation history' : 'Show conversation history'}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-canvas/40 px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-canvas hover:border-brand"
        >
          <History className="h-4 w-4 text-brand" />
          <span className="hidden sm:inline">History</span>
          {sessionCount > 0 && (
            <span className="rounded-full bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand">
              {sessionCount}
            </span>
          )}
        </button>
        <Logo to="/citizen/dashboard" className="h-9 ml-1" />
        <span className="ml-2 hidden rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand md:inline-block">
          Connected to WaKiL Core
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onNewChat}>
        <SquarePen className="h-4 w-4" aria-hidden="true" />
        New chat
      </Button>
    </header>
  )
}
