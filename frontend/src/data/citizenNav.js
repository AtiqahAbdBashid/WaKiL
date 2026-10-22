import { Bell, ClipboardList, LayoutGrid, MessageCircle, PlusCircle, User } from 'lucide-react'

export const citizenNavItems = [
  { label: 'Dashboard', to: '/citizen/dashboard', icon: LayoutGrid },
  { label: 'Submit Complaint', to: '/citizen/hantar-aduan', icon: PlusCircle },
  { label: 'My Complaints', to: '/citizen/aduan-saya', icon: ClipboardList },
  { label: 'WaKiL AI', to: '/citizen/wakil-ai', icon: MessageCircle, badge: 'Smart' },
  { label: 'Notifications', to: '/citizen/notifikasi', icon: Bell },
  { label: 'My Profile', to: '/citizen/profil', icon: User },
]
