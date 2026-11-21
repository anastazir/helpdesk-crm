import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { authApi } from '@/api/auth.api'
import { useAppDispatch } from '@/store/hooks'
import { clearCredentials } from '@/store/slices/authSlice'
import { logger } from '@/utils/logger'

export const useLogout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = async () => {
    setLoggingOut(true)
    const refresh = localStorage.getItem('refreshToken')

    try {
      if (refresh) {
        await authApi.logout(refresh)
      }
    } catch (error) {
      logger.error('[AUTH] Logout request failed.', error)
    } finally {
      dispatch(clearCredentials())
      localStorage.removeItem('refreshToken')
      setLoggingOut(false)
      toast.success(t('auth.logoutSuccess'))
      navigate('/login', { replace: true })
    }
  }

  return { logout, loggingOut }
}
