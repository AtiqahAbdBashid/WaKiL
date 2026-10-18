import {
  BarChart3,
  Bell,
  Inbox,
  LayoutGrid,
  Settings,
  UserCheck,
  Users,
} from 'lucide-react'

export const ybNavItems = [
  { label: 'Dashboard', to: '/yb/dashboard', icon: LayoutGrid },
  { label: 'Assigned Complaints', to: '/yb/complaints/assigned', icon: UserCheck },
  { label: 'Complaint Pool', to: '/yb/complaints/pool', icon: Inbox },
  // Users glyph marks the staff roster; `to` matches the SidebarNav link contract.
  { label: 'Staff', to: '/yb/staff', icon: Users },
  { label: 'Analytics', to: '/yb/analytics', icon: BarChart3 },
  // Count is derived in YbSidebar via ybUnreadCount; keep 0 as fallback.
  { label: 'Notifications', to: '/yb/notifications', icon: Bell, count: 0 },
  { label: 'Settings', to: '/yb/settings', icon: Settings },
]
