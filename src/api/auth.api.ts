import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  LoginResponseData,
  RefreshResponseData,
  User,
} from '@/types/auth.types'
import { logger } from '@/utils/logger'

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponseData>> => {
    logger.api('POST', '/auth/login/', { email })
    const res = await api.post<ApiResponse<LoginResponseData>>('/auth/login/', {
      email,
      password,
    })
    return res.data
  },

  logout: async (refresh: string): Promise<ApiResponse<null>> => {
    logger.api('POST', '/auth/logout/', { refresh })
    const res = await api.post<ApiResponse<null>>('/auth/logout/', { refresh })
    return res.data
  },

  refreshToken: async (refresh: string): Promise<ApiResponse<RefreshResponseData>> => {
    logger.api('POST', '/auth/token/refresh/', { refresh })
    const res = await api.post<ApiResponse<RefreshResponseData>>('/auth/token/refresh/', {
      refresh,
    })
    return res.data
  },

  me: async (accessToken?: string): Promise<ApiResponse<User>> => {
    logger.api('GET', '/auth/me/', accessToken ? { withExplicitToken: true } : undefined)
    const res = await api.get<ApiResponse<User>>('/auth/me/', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    return res.data
  },
}
