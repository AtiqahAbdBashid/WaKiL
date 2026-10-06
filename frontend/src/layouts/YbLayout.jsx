import { Outlet } from 'react-router-dom'

import DashboardShell from '../components/dashboard/DashboardShell'
import YbSidebar from '../components/yb/YbSidebar'

export default function YbLayout() {
  return (
    <DashboardShell sidebar={<YbSidebar />}>
      <Outlet />
    </DashboardShell>
  )
}
