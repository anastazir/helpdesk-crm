import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { IssueType } from '@/types/complaint.types'
import { logger } from '@/utils/logger'

export const issuesApi = {
  list: async (): Promise<ApiResponse<IssueType[]>> => {
    logger.api('GET', '/issues/')
    const res = await api.get<ApiResponse<IssueType[]>>('/issues/')
    return res.data
  },
}
