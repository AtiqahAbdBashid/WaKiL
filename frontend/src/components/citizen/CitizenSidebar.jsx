import { Link } from 'react-router-dom'
import { LogOut, Plus } from 'lucide-react'

import { citizenNavItems } from '../../data/citizenNav'
import { citizenUser } from '../../data/citizenMock'
import Button from '../ui/Button'
import SidebarNav from '../dashboard/SidebarNav'

export default function CitizenSidebar() {
  return (
    <SidebarNav
      tagline="Community voice, real action"
      user={citizenUser}
      items={citizenNavItems}
      footer={
        <>
          <Button as={Link} to="/citizen/hantar-aduan" variant="danger" size="lg" className="w-full">
            <Plus className="h-5 w-5" aria-hidden="true" />
            Submit complaint
          </Button>
          <Link
            to="/"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log Out
          </Link>
        </>
      }
    />
  )
}
