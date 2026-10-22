import { Outlet } from 'react-router-dom'

import CitizenSidebar from '../components/citizen/CitizenSidebar'
import DashboardShell from '../components/dashboard/DashboardShell'
import { CitizenNotificationProvider } from '../context/CitizenNotificationContext'

export default function CitizenLayout() {
  return (
    <div className="citizen-theme min-h-screen bg-canvas text-ink">
      <CitizenNotificationProvider>
        <DashboardShell sidebar={<CitizenSidebar />}>
          <Outlet />
        </DashboardShell>
      </CitizenNotificationProvider>
    </div>
  )
}
