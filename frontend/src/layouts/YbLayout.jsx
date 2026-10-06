import { Outlet } from 'react-router-dom'

import DashboardShell from '../components/dashboard/DashboardShell'
import YbSidebar from '../components/yb/YbSidebar'
import { useYbAuth } from '../auth/YbAuthContext'
import { ybStaff } from '../data/ybStaff'

export default function YbLayout() {
  const { user, switchUser } = useYbAuth()
  return (
    <DashboardShell sidebar={<YbSidebar />}>
      <div className="border-b border-line bg-white px-4 py-2 text-sm md:px-8">
        <label htmlFor="mock-user" className="mr-2 font-bold">Mock session:</label>
        <select
          id="mock-user"
          value={user?.id ?? ''}
          onChange={(e) => switchUser(e.target.value)}
          className="rounded border border-line bg-white px-2 py-1 text-sm"
        >
          {ybStaff.filter((s) => s.active).map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
          ))}
        </select>
      </div>
      <Outlet />
    </DashboardShell>
  )
}
