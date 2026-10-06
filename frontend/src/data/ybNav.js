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
} from 'lucide-react'

export const ybNavItems = [
  { label: 'Dashboard', to: '/yb/dashboard', icon: LayoutGrid },
  { label: 'Complaints', to: '/yb/complaints', icon: Inbox },
  { label: 'Facebook Monitor', to: '/yb/facebook-monitor', icon: MessageSquare },
  { label: 'AI Insights', to: '/yb/ai-insights', icon: Sparkles },
  { label: 'Analytics', to: '/yb/analytics', icon: BarChart3 },
  { label: 'Map', to: '/yb/map', icon: Map },
  { label: 'WaKiL AI', to: '/yb/ai', icon: Monitor },
  { label: 'Notifications', to: '/yb/notifications', icon: Bell, count: 3 },
  { label: 'Settings', to: '/yb/settings', icon: Settings },
]
