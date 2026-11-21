import api from '@/api/axios'
import type { ApiResponse, PaginatedData } from '@/types/api.types'
import type {
  AddZonePayload,
  CreateUserPayload,
  EngineerListParams,
  EngineerUser,
  ResetPasswordPayload,
  UpdateUserPayload,
  UserDetail,
  UserListParams,
  UserListItem,
} from '@/types/auth.types'
import type { EngineerZoneAssignment, ZoneRef } from '@/types/zone.types'
import { logger } from '@/utils/logger'

export const usersApi = {
  list: async (params?: UserListParams): Promise<ApiResponse<PaginatedData<UserListItem>>> => {
    logger.api('GET', '/users/', params)
    const res = await api.get<ApiResponse<PaginatedData<UserListItem>>>('/users/', { params })
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<UserDetail>> => {
    logger.api('GET', `/users/${id}/`)
    const res = await api.get<ApiResponse<UserDetail>>(`/users/${id}/`)
    return res.data
  },

  create: async (data: CreateUserPayload): Promise<ApiResponse<UserListItem>> => {
    logger.api('POST', '/users/', data)
    const res = await api.post<ApiResponse<UserListItem>>('/users/', data)
    return res.data
  },

  update: async (id: number, data: UpdateUserPayload): Promise<ApiResponse<UserDetail>> => {
    logger.api('PATCH', `/users/${id}/`, data)
    const res = await api.patch<ApiResponse<UserDetail>>(`/users/${id}/`, data)
    return res.data
  },

  disable: async (id: number): Promise<ApiResponse<null>> => {
    logger.api('POST', `/users/${id}/disable/`)
    const res = await api.post<ApiResponse<null>>(`/users/${id}/disable/`)
    return res.data
  },

  enable: async (id: number): Promise<ApiResponse<null>> => {
    logger.api('POST', `/users/${id}/enable/`)
    const res = await api.post<ApiResponse<null>>(`/users/${id}/enable/`)
    return res.data
  },

  resetPassword: async (
    id: number,
    data: ResetPasswordPayload,
  ): Promise<ApiResponse<null>> => {
    logger.api('POST', `/users/${id}/reset-password/`, data)
    const res = await api.post<ApiResponse<null>>(`/users/${id}/reset-password/`, data)
    return res.data
  },

  engineers: async (params?: EngineerListParams): Promise<ApiResponse<EngineerUser[]>> => {
    logger.api('GET', '/users/engineers/', params)
    const res = await api.get<ApiResponse<EngineerUser[]>>('/users/engineers/', { params })
    return res.data
  },

  zoneHistory: async (id: number): Promise<ApiResponse<EngineerZoneAssignment[]>> => {
    logger.api('GET', `/users/${id}/zone-history/`)
    const res = await api.get<ApiResponse<EngineerZoneAssignment[]>>(
      `/users/${id}/zone-history/`,
    )
    return res.data
  },

  addZone: async (id: number, data: AddZonePayload): Promise<ApiResponse<ZoneRef[]>> => {
    logger.api('POST', `/users/${id}/zones/`, data)
    const res = await api.post<ApiResponse<ZoneRef[]>>(`/users/${id}/zones/`, data)
    return res.data
  },

  removeZone: async (id: number, zoneId: number): Promise<ApiResponse<ZoneRef[]>> => {
    logger.api('DELETE', `/users/${id}/zones/${zoneId}/`)
    const res = await api.delete<ApiResponse<ZoneRef[]>>(`/users/${id}/zones/${zoneId}/`)
    return res.data
  },
}
