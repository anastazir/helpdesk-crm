import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { store } from '@/store'
import { clearCredentials, setCredentials } from '@/store/slices/authSlice'
import type { ApiResponse } from '@/types/api.types'
import type { RefreshResponseData } from '@/types/auth.types'
import { logger } from '@/utils/logger'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

const refreshClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const response = await refreshClient.post<ApiResponse<RefreshResponseData>>(
    '/auth/token/refresh/',
    { refresh: refreshToken },
  )
  const data = response.data.data
  if (!data?.access) throw new Error('Missing access token in refresh response')

  if (data.refresh) {
    localStorage.setItem('refreshToken', data.refresh)
  }
  return data.access
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = store.getState().auth.accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  logger.api(config.method?.toUpperCase() ?? 'REQUEST', config.url ?? '', config.data)
  return config
})

api.interceptors.response.use(
  (response) => {
    logger.debug(`[API RESPONSE] ${response.status} ${response.config.url}`)
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const requestUrl = originalRequest?.url ?? ''
    const isPublicAuthRequest =
      requestUrl.includes('/auth/login/') || requestUrl.includes('/auth/token/refresh/')

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        const newAccessToken = await refreshPromise
        const currentUser = store.getState().auth.user
        if (!currentUser) throw new Error('No authenticated user during refresh')

        store.dispatch(
          setCredentials({ user: currentUser, accessToken: newAccessToken }),
        )
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        logger.error('[AUTH] Token refresh failed. Clearing credentials.', refreshError)
        store.dispatch(clearCredentials())
        localStorage.removeItem('refreshToken')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export default api
