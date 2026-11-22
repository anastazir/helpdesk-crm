import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import { logger } from '@/utils/logger'

export interface GeocodeQuery {
  query: string
  kind: 'address' | 'landmark' | 'pincode'
}

export interface GeocodeResult {
  status: 'address' | 'landmark' | 'pincode' | 'manual' | 'not_found' | 'failed'
  label: string
  provider: string
  latitude: number | null
  longitude: number | null
  map_radius_m: number | null
  queries: GeocodeQuery[]
  ai_assisted: boolean
  ai_note?: string
  ai_usage?: unknown
}

export const geocodeApi = {
  preview: async (payload: {
    address: string
    address_remark: string
    pincode: string
    locale: string
    use_ai?: boolean
  }): Promise<ApiResponse<GeocodeResult>> => {
    logger.api('POST', '/assistant/geocode/', {
      address: payload.address,
      address_remark: payload.address_remark,
      pincode: payload.pincode,
    })
    const response = await api.post<ApiResponse<GeocodeResult>>(
      '/assistant/geocode/',
      {
        address: payload.address,
        address_remark: payload.address_remark,
        pincode: payload.pincode,
        language: payload.locale.startsWith('hi') ? 'hi' : 'en',
        use_ai: payload.use_ai ?? true,
      },
      { timeout: 45000 },
    )
    return response.data
  },
}
