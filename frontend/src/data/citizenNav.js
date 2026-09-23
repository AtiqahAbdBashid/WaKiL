import { Bell, ClipboardList, LayoutGrid, MessageCircle, PlusCircle, User } from 'lucide-react'

export const citizenNavItems = [
  { label: 'Dashboard', to: '/citizen/dashboard', icon: LayoutGrid },
  { label: 'Hantar Aduan', to: '/citizen/hantar-aduan', icon: PlusCircle },
  { label: 'Aduan Saya', to: '/citizen/aduan-saya', icon: ClipboardList },
  { label: 'WaKiL AI Chat', to: '/citizen/ai-chat', icon: MessageCircle, badge: 'Smart' },
  { label: 'Notifikasi', to: '/citizen/notifikasi', icon: Bell, count: 3 },
  { label: 'Profil Saya', to: '/citizen/profil', icon: User },
]
