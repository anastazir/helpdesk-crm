import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  WhatsAppMeData,
  WhatsAppSettingsData,
} from '@/types/whatsapp.types'
import { logger } from '@/utils/logger'

export const whatsappApi = {
  getSettings: async (): Promise<ApiResponse<WhatsAppSettingsData>> => {
    logger.api('GET', '/whatsapp/settings/')
    const res = await api.get<ApiResponse<WhatsAppSettingsData>>(
      '/whatsapp/settings/',
    )
    return res.data
  },

  updateSettings: async (
    useWhatsApp: boolean,
  ): Promise<ApiResponse<WhatsAppSettingsData>> => {
    logger.api('PATCH', '/whatsapp/settings/', { use_whatsapp: useWhatsApp })
    const res = await api.patch<ApiResponse<WhatsAppSettingsData>>(
      '/whatsapp/settings/',
      { use_whatsapp: useWhatsApp },
    )
    return res.data
  },

  getMe: async (): Promise<ApiResponse<WhatsAppMeData>> => {
    logger.api('GET', '/whatsapp/me/')
    const res = await api.get<ApiResponse<WhatsAppMeData>>('/whatsapp/me/')
    return res.data
  },

  updateMe: async (
    whatsappOptIn: boolean,
  ): Promise<ApiResponse<WhatsAppMeData>> => {
    logger.api('PATCH', '/whatsapp/me/', {
      whatsapp_opt_in: whatsappOptIn,
    })
    const res = await api.patch<ApiResponse<WhatsAppMeData>>(
      '/whatsapp/me/',
      { whatsapp_opt_in: whatsappOptIn },
    )
    return res.data
  },
}
