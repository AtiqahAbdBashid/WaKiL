import {
  BarChart3,
  Bell,
  Inbox,
  LayoutGrid,
  Map,
  MessageSquare,
  Monitor,
  Settings,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'

export const ybNavItems = [
  { label: 'Dashboard', to: '/yb/dashboard', icon: LayoutGrid },
  { label: 'Assigned Complaints', to: '/yb/complaints/assigned', icon: UserCheck },
  { label: 'Complaint Pool', to: '/yb/complaints/pool', icon: Inbox },
  // Users glyph marks the staff roster; `to` matches the SidebarNav link contract.
  { label: 'Staff', to: '/yb/staff', icon: Users },
  { label: 'Facebook Monitor', to: '/yb/facebook-monitor', icon: MessageSquare },
  { label: 'AI Insights', to: '/yb/ai-insights', icon: Sparkles },
  { label: 'Analytics', to: '/yb/analytics', icon: BarChart3 },
  { label: 'Map', to: '/yb/map', icon: Map },
  { label: 'WaKiL AI', to: '/yb/ai', icon: Monitor },
  { label: 'Notifications', to: '/yb/notifications', icon: Bell, count: 3 },
  { label: 'Settings', to: '/yb/settings', icon: Settings },
]
