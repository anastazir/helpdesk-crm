import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Comment } from '@/types/complaint.types'
import { logger } from '@/utils/logger'

export const commentsApi = {
  list: async (complaintId: number): Promise<ApiResponse<Comment[]>> => {
    logger.api('GET', `/complaints/${complaintId}/comments/`)
    const res = await api.get<ApiResponse<Comment[]>>(`/complaints/${complaintId}/comments/`)
    return res.data
  },

  create: async (complaintId: number, body: string): Promise<ApiResponse<Comment>> => {
    logger.api('POST', `/complaints/${complaintId}/comments/`, { body })
    const res = await api.post<ApiResponse<Comment>>(
      `/complaints/${complaintId}/comments/`,
      { body },
    )
    return res.data
  },

  update: async (
    complaintId: number,
    commentId: number,
    body: string,
  ): Promise<ApiResponse<Comment>> => {
    logger.api('PATCH', `/complaints/${complaintId}/comments/${commentId}/`, { body })
    const res = await api.patch<ApiResponse<Comment>>(
      `/complaints/${complaintId}/comments/${commentId}/`,
      { body },
    )
    return res.data
  },
}
