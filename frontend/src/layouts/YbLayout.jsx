import { Outlet } from 'react-router-dom'
import YbSidebar from '../components/yb/YbSidebar'
import YbTopbar from '../components/yb/YbTopbar'

export default function YbLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <YbSidebar />
      <div className="flex flex-1 flex-col">
        <YbTopbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
