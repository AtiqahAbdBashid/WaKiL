import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { ybNavItems } from '../../data/ybNav'
import { watchedAreas, ybUser } from '../../data/ybMock'
import SidebarNav from '../dashboard/SidebarNav'

const dotTone = {
  brand: 'border-brand',
  accent: 'border-accent',
  mint: 'border-mint',
}

export default function YbSidebar() {
  return (
    <SidebarNav
      tagline="People's Voice, Representative's Mandate"
      user={ybUser}
      items={ybNavItems}
      extra={
        <section aria-label="Watched areas" className="mt-8">
          <p className="px-3 text-xs font-bold uppercase tracking-widest text-muted">Watched areas</p>
          <ul className="mt-3 space-y-1">
            {watchedAreas.map((area) => (
              <li key={area.name} className="flex items-center gap-3 px-3 py-2 text-[15px] text-ink">
                <span aria-hidden="true" className={`h-3 w-3 rounded-full border-2 ${dotTone[area.tone]}`} />
                {area.name}
              </li>
            ))}
          </ul>
        </section>
      }
      footer={
        <Link
          to="/"
          className="flex items-center gap-2 px-3 text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log Out
        </Link>
      }
    />
  )
}
