import { format } from 'date-fns'

import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  ExportConfig,
  ExportPreview,
  ExportPreviewRequest,
} from '@/types/export.types'
import { logger } from '@/utils/logger'

export const exportApi = {
  preview: async (config: ExportPreviewRequest): Promise<ApiResponse<ExportPreview>> => {
    logger.api('POST', '/export/preview/', config)
    const res = await api.post<ApiResponse<ExportPreview>>('/export/preview/', config)
    return res.data
  },

  userAuditPreview: async (filters: Record<string, unknown>): Promise<ApiResponse<{ total_matching: number; columns: string[]; rows: Record<string, string>[] }>> => {
    logger.api('POST', '/export/user-audit/preview/', filters)
    const res = await api.post<ApiResponse<{ total_matching: number; columns: string[]; rows: Record<string, string>[] }>>(
      '/export/user-audit/preview/',
      { filters },
    )
    return res.data
  },

  userAuditDownload: async (filters: Record<string, unknown>): Promise<void> => {
    logger.api('POST', '/export/user-audit/download/', filters)
    const response = await api.post<Blob>(
      '/export/user-audit/download/',
      { filters },
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `user_audit_export_${format(new Date(), 'yyyyMMdd')}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  },

  download: async (config: ExportConfig): Promise<void> => {
    logger.api('POST', '/export/download/', config)
    const response = await api.post<Blob>('/export/download/', config, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `complaints_export_${format(new Date(), 'yyyyMMdd')}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  },
}
