export interface ZoneRef {
  id: number
  name: string
}

export interface Zone {
  id: number
  name: string
  is_active: boolean
  engineer_count?: number
  complaint_count?: number
}

export interface EngineerZoneAssignment {
  id: number
  zone: ZoneRef
  action: 'added' | 'removed'
  changed_at: string
  changed_by: { id: number; full_name: string } | null
}

export interface ZoneCreatePayload {
  name: string
}

export interface ZoneUpdatePayload {
  name?: string
  is_active?: boolean
}
