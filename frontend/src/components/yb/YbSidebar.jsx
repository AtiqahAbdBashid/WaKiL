import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { ybNavItems } from '../../data/ybNav'
import { ybUnreadCount } from '../../data/ybNotifications'
import { useYbAuth } from '../../auth/YbAuthContext'
import { useYbComplaints } from '../../context/YbComplaintsContext'
import SidebarNav from '../dashboard/SidebarNav'

export default function YbSidebar() {
  const { user: authUser, canViewStaff } = useYbAuth()
  const { complaints, caseGroups } = useYbComplaints()
  const unread = ybUnreadCount(complaints, caseGroups, authUser)
  // Staff roster link is Representative-only; everyone else sees the rest.
  const base = canViewStaff ? ybNavItems : ybNavItems.filter((item) => item.to !== '/yb/staff')
  const items = base.map((item) =>
    item.to === '/yb/notifications' ? { ...item, count: unread } : item
  )
  const user = authUser
    ? { name: authUser.name, initials: authUser.initials, role: authUser.role }
    : { name: 'Service Officer', initials: 'SO', role: 'YB Office' }
  return (
    <SidebarNav
      tagline="People's Voice, Representative's Mandate"
      user={user}
      items={items}
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
