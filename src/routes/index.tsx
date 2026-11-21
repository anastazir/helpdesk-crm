import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/auth/LoginPage'
import ComplaintDetailPage from '@/pages/complaints/ComplaintDetailPage'
import ComplaintsListPage from '@/pages/complaints/ComplaintsListPage'
import NewComplaintPage from '@/pages/complaints/NewComplaintPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AllComplaintsPage from '@/pages/engineer/AllComplaintsPage'
import MyComplaintsPage from '@/pages/engineer/MyComplaintsPage'
import ExportPage from '@/pages/export/ExportPage'
import PreferencesPage from '@/pages/settings/PreferencesPage'
import UsersPage from '@/pages/users/UsersPage'
import ZonesPage from '@/pages/zones/ZonesPage'
import { ROLE_HOME } from '@/utils/constants'

import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'

const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={ROLE_HOME[user.role]} replace />
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<RoleRoute allowedRoles={['admin', 'helpdesk']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/complaints" element={<ComplaintsListPage />} />
          <Route path="/complaints/new" element={<NewComplaintPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/zones" element={<ZonesPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['engineer']} />}>
          <Route path="/engineer/complaints" element={<MyComplaintsPage />} />
          <Route path="/engineer/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/engineer/all" element={<AllComplaintsPage />} />
        </Route>

        <Route path="/settings" element={<PreferencesPage />} />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Route>
  </Routes>
)

export default AppRoutes
