import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import { logger } from '@/utils/logger'

export interface AIRequestLog {
  id: number
  user_name: string | null
  user_email: string | null
  feature: string
  status: 'success' | 'error'
  model: string
  provider: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: string | null
  cost_inr: string | null
  latency_ms: number
  tools_used: string[]
  error_message: string
  created_at: string
  request_preview: string
  response_preview: string
}

export interface AIRequestLogDetail extends AIRequestLog {
  request_text: string
  response_text: string
  metadata: Record<string, unknown>
}

export interface AIRequestLogSummary {
  total_requests: number
  total_tokens: number
  total_cost_inr: number
  today_requests: number
  today_cost_inr: number
  errors: number
  features: {
    feature: string
    requests: number
    total_tokens: number
    cost_inr: number
  }[]
  as_of: string
}

export interface AIRequestLogPage {
  results: AIRequestLog[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface AIRequestLogParams {
  page?: number
  page_size?: number
  feature?: string
  status?: string
  search?: string
  date_from?: string
  date_to?: string
}

export const aiLogsApi = {
  list: async (
    params: AIRequestLogParams,
  ): Promise<ApiResponse<AIRequestLogPage>> => {
    logger.api('GET', '/ai-logs/', params)
    const response = await api.get<ApiResponse<AIRequestLogPage>>('/ai-logs/', {
      params,
    })
    return response.data
  },
  detail: async (id: number): Promise<ApiResponse<AIRequestLogDetail>> => {
    logger.api('GET', `/ai-logs/${id}/`)
    const response = await api.get<ApiResponse<AIRequestLogDetail>>(
      `/ai-logs/${id}/`,
    )
    return response.data
  },
  summary: async (): Promise<ApiResponse<AIRequestLogSummary>> => {
    logger.api('GET', '/ai-logs/summary/')
    const response = await api.get<ApiResponse<AIRequestLogSummary>>(
      '/ai-logs/summary/',
    )
    return response.data
  },
}
