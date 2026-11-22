import { format, isValid } from 'date-fns'

import i18n from '@/i18n'
import { AVATAR_COLORS } from '@/utils/constants'

export const formatDuration = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds))
  if (total < 60) {
    return i18n.t('time.lessThanMinute')
  }

  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (days > 0) {
    return `${days} ${i18n.t(days === 1 ? 'time.day' : 'time.days')} ${hours} ${i18n.t(
      hours === 1 ? 'time.hour' : 'time.hours',
    )}`
  }

  if (hours > 0) {
    return `${hours} ${i18n.t(hours === 1 ? 'time.hour' : 'time.hours')} ${minutes} ${i18n.t(
      minutes === 1 ? 'time.min' : 'time.mins',
    )}`
  }

  return `${minutes} ${i18n.t(minutes === 1 ? 'time.min' : 'time.mins')}`
}

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString)
  if (!isValid(date)) return ''
  return format(date, 'MMM d, yyyy, h:mm a')
}

export const formatDateOnly = (isoString: string): string => {
  const date = new Date(isoString)
  if (!isValid(date)) return ''
  return format(date, 'yyyy-MM-dd')
}

export const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const getAvatarColor = (userId: number): string => {
  const index = Math.abs(Math.trunc(userId)) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export const toMediaUrl = (relativePath: string): string => {
  if (/^https?:\/\//i.test(relativePath)) return relativePath

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const host = apiBaseUrl.replace(/\/api\/?$/, '')
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  return `${host}${path}`
}

export const cleanAiText = (text: string): string =>
  text
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`{1,3}/g, '')
    .trim()


export const formatInrCost = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '₹0.00'
  const digits = Math.abs(value) < 1 ? 4 : 2
  return `₹${value.toFixed(digits)}`
}
