import { useAuth } from '@/hooks/useAuth'

export const usePermissions = () => {
  const { role } = useAuth()

  return {
    role,
    isAdmin: role === 'admin',
    isHD: role === 'helpdesk',
    isEngineer: role === 'engineer',
    isAdminOrHD: role === 'admin' || role === 'helpdesk',
    canEdit: role === 'admin' || role === 'helpdesk',
    canExport: role === 'admin' || role === 'helpdesk',
    canManageUsers: role === 'admin',
    canManageZones: role === 'admin',
  }
}
