// YB page shell: office sidebar and the signed-in session guard.
import { Navigate, Outlet } from 'react-router-dom'

import DashboardShell from '../components/dashboard/DashboardShell'
import YbSidebar from '../components/yb/YbSidebar'
import { useYbAuth } from '../auth/YbAuthContext'
import { useYbComplaints } from '../context/YbComplaintsContext'

export default function YbLayout() {
  const { user, loading } = useYbAuth()
  const { syncError } = useYbComplaints()
  if (loading) return null
  if (!user) return <Navigate to="/yb/login" replace />
  return (
    <DashboardShell sidebar={<YbSidebar />}>
      {syncError && (
        <p role="alert" className="border-b border-line bg-white px-4 py-2 text-sm font-semibold text-red-700 md:px-8">
          Could not save or load office data: {syncError}
        </p>
      )}
      <Outlet />
    </DashboardShell>
  )
}
