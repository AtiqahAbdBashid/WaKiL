import { Outlet } from 'react-router-dom'

import CitizenSidebar from '../components/citizen/CitizenSidebar'
import DashboardShell from '../components/dashboard/DashboardShell'

export default function CitizenLayout() {
  return (
    <DashboardShell sidebar={<CitizenSidebar />}>
      <Outlet />
    </DashboardShell>
  )
}
