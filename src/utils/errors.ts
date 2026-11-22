import axios from 'axios'

import i18n from '@/i18n'
import type { ApiResponse } from '@/types/api.types'

const GENERIC_MESSAGES = new Set([
  'an error occurred',
  'an error occurred.',
  'validation failed',
  'validation failed.',
  'request failed',
  'request failed.',
  'error',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractDetail = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const message = value.trim()
    return message.length > 0 ? message : null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractDetail(item)
      if (message) return message
    }
    return null
  }

  if (isRecord(value)) {
    for (const key of ['detail', 'message', 'error', 'non_field_errors']) {
      if (key in value) {
        const message = extractDetail(value[key])
        if (message) return message
      }
    }

    for (const [field, child] of Object.entries(value)) {
      const message = extractDetail(child)
      if (message) {
        return field === 'non_field_errors' || field === 'detail'
          ? message
          : `${field}: ${message}`
      }
    }
  }

  return null
}

const statusFallback = (statusCode: number): string => {
  if (statusCode === 401) return i18n.t('errors.unauthorized')
  if (statusCode === 403) return i18n.t('errors.forbidden')
  if (statusCode === 404) return i18n.t('errors.notFound')
  if (statusCode >= 500) return i18n.t('errors.server')
  return i18n.t('errors.generic')
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return i18n.t('errors.network')
    }

    const data: unknown = error.response.data
    if (isRecord(data)) {
      const apiError = data as unknown as ApiResponse<unknown>
      const message =
        typeof apiError.message === 'string' ? apiError.message.trim() : ''
      const detailMessage = extractDetail(apiError.errors)
      const normalizedMessage = message.toLowerCase()

      if (message.length > 0 && !GENERIC_MESSAGES.has(normalizedMessage)) {
        return message
      }
      if (detailMessage) {
        return detailMessage
      }
      if (message.length > 0) {
        return message
      }
    }

    return statusFallback(error.response.status)
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return fallback
}
