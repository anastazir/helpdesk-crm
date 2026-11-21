import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { EngineerUser } from '@/types/auth.types'
import type { Zone, ZoneCreatePayload, ZoneUpdatePayload } from '@/types/zone.types'
import { logger } from '@/utils/logger'

export const zonesApi = {
  list: async (): Promise<ApiResponse<Zone[]>> => {
    logger.api('GET', '/zones/')
    const res = await api.get<ApiResponse<Zone[]>>('/zones/')
    return res.data
  },

  create: async (data: ZoneCreatePayload): Promise<ApiResponse<Zone>> => {
    logger.api('POST', '/zones/', data)
    const res = await api.post<ApiResponse<Zone>>('/zones/', data)
    return res.data
  },

  update: async (id: number, data: ZoneUpdatePayload): Promise<ApiResponse<Zone>> => {
    logger.api('PATCH', `/zones/${id}/`, data)
    const res = await api.patch<ApiResponse<Zone>>(`/zones/${id}/`, data)
    return res.data
  },

  engineers: async (id: number): Promise<ApiResponse<EngineerUser[]>> => {
    logger.api('GET', `/zones/${id}/engineers/`)
    const res = await api.get<ApiResponse<EngineerUser[]>>(`/zones/${id}/engineers/`)
    return res.data
  },
}
