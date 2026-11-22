import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import { logger } from '@/utils/logger'

export interface BriefingUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number | null
}

export interface AiResultMeta {
  generated_at: string
  model: string
  provider: string | null
  usage: BriefingUsage
  latency_ms: number
}

export interface BriefingResult extends AiResultMeta {
  briefing: string
  as_of: string
  timezone: string
}

export interface ChatReference {
  id: number
  label: string
}

export interface ChatResult extends AiResultMeta {
  reply: string
  references: ChatReference[]
  tools_used: string[]
  language: 'en' | 'hi'
}

export interface CopilotResult extends AiResultMeta {
  text: string
  task: 'summary' | 'next_action' | 'draft_comment'
  language: 'en' | 'hi'
}

export interface EngineerPlanResult extends AiResultMeta {
  text: string
  language: 'en' | 'hi'
}

export interface TriageIssue {
  id: number
  name: string
}

export interface TriageResult extends AiResultMeta {
  suggested_issues: TriageIssue[]
  urgency: 'normal' | 'soon' | 'urgent'
  reason: string
  next_step: string
  language: 'en' | 'hi'
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

const language = (value: string): 'en' | 'hi' =>
  value.startsWith('hi') ? 'hi' : 'en'

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

  chat: async (
    message: string,
    history: ChatHistoryItem[],
    locale: string,
  ): Promise<ApiResponse<ChatResult>> => {
    logger.api('POST', '/assistant/chat/', { message })
    const response = await api.post<ApiResponse<ChatResult>>(
      '/assistant/chat/',
      { message, history, language: language(locale) },
      { timeout: 120000 },
    )
    return response.data
  },

  complaintCopilot: async (
    complaintId: number,
    task: CopilotResult['task'],
    locale: string,
    instruction = '',
  ): Promise<ApiResponse<CopilotResult>> => {
    logger.api('POST', '/assistant/complaint-copilot/', { complaintId, task })
    const response = await api.post<ApiResponse<CopilotResult>>(
      '/assistant/complaint-copilot/',
      {
        complaint_id: complaintId,
        task,
        language: language(locale),
        instruction,
      },
      { timeout: 65000 },
    )
    return response.data
  },

  engineerPlan: async (
    locale: string,
  ): Promise<ApiResponse<EngineerPlanResult>> => {
    logger.api('POST', '/assistant/engineer-plan/')
    const response = await api.post<ApiResponse<EngineerPlanResult>>(
      '/assistant/engineer-plan/',
      { language: language(locale) },
      { timeout: 65000 },
    )
    return response.data
  },

  triage: async (payload: {
    issue_ids: number[]
    others_description: string
    department: string
    designation: string
    locale: string
  }): Promise<ApiResponse<TriageResult>> => {
    logger.api('POST', '/assistant/triage/')
    const response = await api.post<ApiResponse<TriageResult>>(
      '/assistant/triage/',
      {
        issue_ids: payload.issue_ids,
        others_description: payload.others_description,
        department: payload.department,
        designation: payload.designation,
        language: language(payload.locale),
      },
      { timeout: 65000 },
    )
    return response.data
  },
}
