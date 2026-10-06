import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import IconButton from '../ui/IconButton'
import Logo from '../ui/Logo'

export default function DashboardShell({ sidebar, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <Logo className="h-10" />
          <IconButton label="Open menu" icon={Menu} onClick={() => setDrawerOpen(true)} />
        </div>

        <aside className="hidden w-72 shrink-0 border-r border-line bg-[#fbfbfd] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          {sidebar}
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              onClick={(e) => e.target.closest('a') && setDrawerOpen(false)}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-card"
            >
              <div className="flex justify-end px-3 pt-3">
                <IconButton label="Close menu" icon={X} onClick={() => setDrawerOpen(false)} />
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
