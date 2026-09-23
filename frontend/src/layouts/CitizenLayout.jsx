import { Outlet } from 'react-router-dom'
import CitizenSidebar from '../components/citizen/CitizenSidebar'
import CitizenTopbar from '../components/citizen/CitizenTopbar'

export default function CitizenLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <CitizenSidebar />
      <div className="flex flex-1 flex-col">
        <CitizenTopbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
