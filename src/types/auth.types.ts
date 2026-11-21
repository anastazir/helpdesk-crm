import type { EngineerZoneAssignment, ZoneRef } from './zone.types'

export type UserRole = 'admin' | 'helpdesk' | 'engineer'

export interface User {
  id: number
  full_name: string
  email: string
  phone: string
  role: UserRole
  is_active: boolean
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
}

export interface UpdateUserPayload {
  full_name?: string
  phone?: string
}

export interface ResetPasswordPayload {
  new_password: string
}

export interface AddZonePayload {
  zone_id: number
}

export interface UserListParams {
  role?: UserRole
  is_active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface EngineerListParams {
  zone_id?: number
}
