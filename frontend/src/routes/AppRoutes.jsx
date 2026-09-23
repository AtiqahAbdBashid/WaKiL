import { Route, Routes } from 'react-router-dom'

import CitizenLayout from '../layouts/CitizenLayout'
import PublicLayout from '../layouts/PublicLayout'
import YbLayout from '../layouts/YbLayout'

import LandingPage from '../pages/landing/LandingPage'

import AIChatPage from '../pages/citizen/AIChatPage'
import CitizenDashboardPage from '../pages/citizen/DashboardPage'
import CitizenNotificationsPage from '../pages/citizen/NotificationsPage'
import MyComplaintsPage from '../pages/citizen/MyComplaintsPage'
import ProfilePage from '../pages/citizen/ProfilePage'
import SubmitComplaintPage from '../pages/citizen/SubmitComplaintPage'

import AIInsightsPage from '../pages/yb/AIInsightsPage'
import AnalyticsPage from '../pages/yb/AnalyticsPage'
import ComplaintsPage from '../pages/yb/ComplaintsPage'
import YbDashboardPage from '../pages/yb/DashboardPage'
import FacebookMonitorPage from '../pages/yb/FacebookMonitorPage'
import MapPage from '../pages/yb/MapPage'
import YbNotificationsPage from '../pages/yb/NotificationsPage'
import SettingsPage from '../pages/yb/SettingsPage'
import WakilAIPage from '../pages/yb/WakilAIPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route path="citizen" element={<CitizenLayout />}>
        <Route index element={<CitizenDashboardPage />} />
        <Route path="dashboard" element={<CitizenDashboardPage />} />
        <Route path="hantar-aduan" element={<SubmitComplaintPage />} />
        <Route path="aduan-saya" element={<MyComplaintsPage />} />
        <Route path="ai-chat" element={<AIChatPage />} />
        <Route path="notifikasi" element={<CitizenNotificationsPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      <Route path="yb" element={<YbLayout />}>
        <Route index element={<YbDashboardPage />} />
        <Route path="dashboard" element={<YbDashboardPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="facebook-monitor" element={<FacebookMonitorPage />} />
        <Route path="ai-insights" element={<AIInsightsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="ai" element={<WakilAIPage />} />
        <Route path="notifications" element={<YbNotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
