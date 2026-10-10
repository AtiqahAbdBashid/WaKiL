import { Navigate, Route, Routes } from 'react-router-dom'

import CitizenLayout from '../layouts/CitizenLayout'
import PublicLayout from '../layouts/PublicLayout'
import YbLayout from '../layouts/YbLayout'

import LandingPage from '../pages/landing/LandingPage'
import CitizenLoginPage from '../pages/auth/CitizenLoginPage'
import YbLoginPage from '../pages/auth/YbLoginPage'

import CitizenDashboardPage from '../pages/citizen/CitizenDashboardPage'
import CitizenNotificationsPage from '../pages/citizen/NotificationsPage'
import MyComplaintsPage from '../pages/citizen/MyComplaintsPage'
import ProfilePage from '../pages/citizen/ProfilePage'
import SubmitComplaintPage from '../pages/citizen/SubmitComplaintPage'
import CitizenWakilAIPage from '../pages/citizen/WakilAIPage'

import AnalyticsPage from '../pages/yb/AnalyticsPage'
import AssignedComplaintsPage from '../pages/yb/AssignedComplaintsPage'
import ComplaintPoolPage from '../pages/yb/ComplaintPoolPage'
import YbDashboardPage from '../pages/yb/DashboardPage'
import YbNotificationsPage from '../pages/yb/NotificationsPage'
import SettingsPage from '../pages/yb/SettingsPage'
import StaffPage from '../pages/yb/StaffPage'
import { YbAuthProvider } from '../auth/YbAuthContext'
import { YbComplaintsProvider } from '../context/YbComplaintsContext'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="citizen/login" element={<CitizenLoginPage />} />
        <Route path="yb/login" element={<YbLoginPage />} />
      </Route>

      <Route path="citizen/wakil-ai" element={<CitizenWakilAIPage />} />

      <Route path="citizen" element={<CitizenLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboardPage />} />
        <Route path="hantar-aduan" element={<SubmitComplaintPage />} />
        <Route path="aduan-saya" element={<MyComplaintsPage />} />
        <Route path="notifikasi" element={<CitizenNotificationsPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      <Route path="yb" element={<YbAuthProvider><YbComplaintsProvider><YbLayout /></YbComplaintsProvider></YbAuthProvider>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<YbDashboardPage />} />
        <Route path="complaints" element={<Navigate to="complaints/pool" replace />} />
        <Route path="complaints/assigned" element={<AssignedComplaintsPage />} />
        <Route path="complaints/pool" element={<ComplaintPoolPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notifications" element={<YbNotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
