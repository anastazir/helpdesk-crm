import type { EngineerZoneAssignment, ZoneRef } from './zone.types'

export type UserRole = 'admin' | 'supervisor' | 'helpdesk' | 'engineer'

export interface User {
  id: number
  full_name: string
  email: string
  phone: string
  role: UserRole
  is_active: boolean
  whatsapp_opt_in?: boolean
  whatsapp_opt_in_at?: string | null
  whatsapp_opt_out_at?: string | null
  whatsapp_opt_in_source?: string
  created_at: string
}

export interface LoginUser {
  id: number
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface UserMini {
  id: number
  full_name: string
  role: UserRole
}

export interface EngineerUser {
  id: number
  full_name: string
  email: string
  current_zones: ZoneRef[]
  active_complaint_count: number
}

export interface UserListItem extends User {
  current_zones: ZoneRef[]
  active_complaint_count: number | null
}

export interface UserDetail extends UserListItem {
  zone_history: EngineerZoneAssignment[]
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface LoginResponseData {
  access: string
  refresh: string
  user: LoginUser
}

export interface RefreshResponseData {
  access: string
  refresh?: string
}

export interface CreateUserPayload {
  full_name: string
  email: string
  phone: string
  password: string
  role: UserRole
  zone_ids?: number[]
  whatsapp_opt_in?: boolean
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  phone?: string
  whatsapp_opt_in?: boolean
}

export interface ResetPasswordPayload {
  new_password: string
}

export interface AddZonePayload {
  zone_id: number
}

export interface UserListParams {
  role?: UserRole | UserRole[]
  is_active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface EngineerListParams {
  zone_id?: number
}


export interface UserAuditLog {
  id: number
  action: string
  actor_id: number | null
  actor_name: string
  actor_email: string
  actor_role: string
  target_id: number | null
  target_name: string
  target_email: string
  target_phone: string
  target_role: string
  changes: Record<string, { old?: unknown; new?: unknown } | unknown>
  note: string
  source: string
  created_at: string
}

