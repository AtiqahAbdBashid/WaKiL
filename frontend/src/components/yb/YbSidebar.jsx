import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { ybNavItems } from '../../data/ybNav'
import { ybComplaints } from '../../data/ybSample'
import { useYbAuth } from '../../auth/YbAuthContext'
import SidebarNav from '../dashboard/SidebarNav'

const dotTone = {
  brand: 'border-brand',
  accent: 'border-accent',
  mint: 'border-mint',
}

const tones = ['brand', 'accent', 'mint']

// Top localities by open complaints, derived from sample data.
const watchedAreas = [...new Set(ybComplaints.map((c) => c.locality))]
  .map((name) => ({
    name,
    open: ybComplaints.filter((c) => c.locality === name && c.status !== 'Resolved' && c.status !== 'Declined').length,
  }))
  .sort((a, b) => b.open - a.open)
  .slice(0, 3)
  .map((a, i) => ({ name: a.name, tone: tones[i % tones.length] }))

export default function YbSidebar() {
  const { user: authUser, canViewStaff } = useYbAuth()
  const items = canViewStaff ? ybNavItems : ybNavItems.filter((item) => item.to !== '/yb/staff')
  const user = authUser
    ? { name: authUser.name, initials: authUser.initials, role: authUser.role }
    : { name: 'Service Officer', initials: 'SO', role: 'YB Office' }
  return (
    <SidebarNav
      tagline="People's Voice, Representative's Mandate"
      user={user}
      items={items}
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
