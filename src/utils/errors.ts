import axios from 'axios'

import type { ApiResponse } from '@/types/api.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const firstFieldError = (errors: Record<string, string[]>): string | null => {
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0]
    }
  }
  return null
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return fallback
    }

    const data: unknown = error.response.data
    if (isRecord(data)) {
      const apiError = data as unknown as ApiResponse<unknown>
      if (typeof apiError.errors === 'string' && apiError.errors.length > 0) {
        return apiError.errors
      }
      if (isRecord(apiError.errors)) {
        const fieldError = firstFieldError(apiError.errors)
        if (fieldError) return fieldError
      }
      if (typeof apiError.message === 'string' && apiError.message.length > 0) {
        return apiError.message
      }
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return fallback
}
