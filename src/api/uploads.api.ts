import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { FileUploadBatch, UploadBatchResult } from '@/types/complaint.types'
import { logger } from '@/utils/logger'

export const uploadsApi = {
  list: async (complaintId: number): Promise<ApiResponse<FileUploadBatch[]>> => {
    logger.api('GET', `/complaints/${complaintId}/uploads/`)
    const res = await api.get<ApiResponse<FileUploadBatch[]>>(
      `/complaints/${complaintId}/uploads/`,
    )
    return res.data
  },

  upload: async (
    complaintId: number,
    files: File[],
  ): Promise<ApiResponse<UploadBatchResult>> => {
    logger.api('POST', `/complaints/${complaintId}/uploads/`, {
      files: files.map((file) => file.name),
    })
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const res = await api.post<ApiResponse<UploadBatchResult>>(
      `/complaints/${complaintId}/uploads/`,
      formData,
      {
        headers: { 'Content-Type': undefined },
      },
    )
    return res.data
  },
}
