import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import { logger } from '@/utils/logger'

export interface BriefingUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number | null
}

export interface BriefingResult {
  briefing: string
  generated_at: string
  as_of: string
  timezone: string
  model: string
  provider: string | null
  usage: BriefingUsage
  latency_ms: number
}

export const aiApi = {
  briefing: async (): Promise<ApiResponse<BriefingResult>> => {
    logger.api('POST', '/assistant/briefing/')
    const response = await api.post<ApiResponse<BriefingResult>>(
      '/assistant/briefing/',
      undefined,
      { timeout: 65000 },
    )
    return response.data
  },
}
