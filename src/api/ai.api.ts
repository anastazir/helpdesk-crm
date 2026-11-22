import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import { logger } from '@/utils/logger'

export interface BriefingUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number | null
  cost_inr?: number | null
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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(
  /\/$/,
  '',
)

export type ChatStreamEvent =
  | { type: 'status'; key: string; params?: Record<string, string | number> }
  | { type: 'token'; text: string }
  | { type: 'reset' }
  | { type: 'done'; data: ChatResult }
  | { type: 'error'; message: string }

const parseSseBlock = (block: string) => {
  let eventName = 'message'
  const dataLines: string[] = []
  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  if (!dataLines.length) return null
  return { eventName, data: dataLines.join('\n') }
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

  chatStream: async (
    message: string,
    history: ChatHistoryItem[],
    locale: string,
    accessToken: string,
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    logger.api('POST', '/assistant/chat/stream/', { message })
    const response = await fetch(`${apiBaseUrl}/assistant/chat/stream/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message,
        history,
        language: language(locale),
      }),
      signal,
    })

    if (!response.ok) {
      let errorMessage = 'Could not reach the AI assistant.'
      try {
        const body = (await response.json()) as { message?: string }
        errorMessage = body.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    if (!response.body) {
      throw new Error('The browser could not read the streaming response.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const dispatch = (block: string) => {
      const parsed = parseSseBlock(block)
      if (!parsed) return
      try {
        const event = JSON.parse(parsed.data) as ChatStreamEvent
        onEvent(event)
      } catch (error) {
        logger.warn('[AI CHAT] Ignored malformed stream event.', {
          eventName: parsed.eventName,
          error,
        })
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) dispatch(buffer)
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


export interface ExportSummaryResult extends AiResultMeta {
  text: string
  language: 'en' | 'hi'
}

export interface AutofillFields {
  caller_name: string | null
  caller_phone: string | null
  zone: string | null
  department: string | null
  designation: string | null
  address: string | null
  address_remark: string | null
  pincode: string | null
  cpu_serial: string | null
  monitor_serial: string | null
  issue_names: string[]
  others_description: string | null
  notes: string | null
}

export interface AutofillResult extends AiResultMeta {
  fields: AutofillFields
  suggested_issues: TriageIssue[]
  suggested_issue_ids: number[]
  zone_id: number | null
  zone_name: string | null
  language: 'en' | 'hi'
}

export interface ExportSummaryFilters {
  zone_ids?: number[]
  statuses?: string[]
  date_from?: string | null
  date_to?: string | null
  assigned_engineer_ids?: number[]
  cpu_serial_contains?: string | null
}

export const assistantApi = {
  exportSummary: async (
    filters: ExportSummaryFilters,
    deduplicate: boolean,
    locale: string,
  ): Promise<ApiResponse<ExportSummaryResult>> => {
    logger.api('POST', '/assistant/export-summary/')
    const response = await api.post<ApiResponse<ExportSummaryResult>>(
      '/assistant/export-summary/',
      { filters, deduplicate, language: language(locale) },
      { timeout: 65000 },
    )
    return response.data
  },

  autofill: async (
    transcript: string,
    locale: string,
  ): Promise<ApiResponse<AutofillResult>> => {
    logger.api('POST', '/assistant/complaint-autofill/')
    const response = await api.post<ApiResponse<AutofillResult>>(
      '/assistant/complaint-autofill/',
      { transcript, language: language(locale) },
      { timeout: 65000 },
    )
    return response.data
  },
}


export interface AnalyticsChartSpec {
  type: 'table' | 'bar' | 'line' | 'area' | 'donut' | 'kpi'
  x: string | null
  y: string | null
  series: string | null
}

export interface AnalyticsResult extends AiResultMeta {
  question: string
  sql: string
  columns: string[]
  rows: Record<string, unknown>[]
  row_count: number
  truncated: boolean
  dialect: string
  title: string
  response_type: 'table' | 'chart'
  chart: AnalyticsChartSpec
  explanation: string
  answer: string
}

export const dashboardAnalyticsApi = {
  analyze: async (
    question: string,
    locale: string,
  ): Promise<ApiResponse<AnalyticsResult>> => {
    logger.api('POST', '/assistant/analytics/', { question })
    const response = await api.post<ApiResponse<AnalyticsResult>>(
      '/assistant/analytics/',
      { question, language: language(locale) },
      { timeout: 120000 },
    )
    return response.data
  },
}


export interface AssistantSettings {
  ai_enabled: boolean
  stored_ai_enabled: boolean
  can_manage: boolean
}

export const assistantSettingsApi = {
  get: async (): Promise<ApiResponse<AssistantSettings>> => {
    logger.api('GET', '/assistant/settings/')
    const response = await api.get<ApiResponse<AssistantSettings>>(
      '/assistant/settings/',
    )
    return response.data
  },
  update: async (aiEnabled: boolean): Promise<ApiResponse<AssistantSettings>> => {
    logger.api('PATCH', '/assistant/settings/', { ai_enabled: aiEnabled })
    const response = await api.patch<ApiResponse<AssistantSettings>>(
      '/assistant/settings/',
      { ai_enabled: aiEnabled },
    )
    return response.data
  },
}
