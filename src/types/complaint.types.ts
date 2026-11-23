import type { UserMini } from './auth.types'
import type { Zone } from './zone.types'

export type ComplaintStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'parts_requested'
  | 'parts_provided'
  | 'resolved'
  | 'closed'

export interface IssueType {
  id: number
  name: string
  order: number
  is_active?: boolean
}

export interface JobNote {
  id: number
  text: string
  created_at: string
  created_by: UserMini | null
}

export interface Complaint {
  id: number
  reference: string
  caller_phone: string
  caller_name: string | null
  bmid: string | null
  aadhaar: string | null
  zone: Zone | null
  department: string | null
  designation: string | null
  address: string | null
  address_remark: string | null
  pincode: string | null
  latitude: number | string | null
  longitude: number | string | null
  geocode_status: 'not_geocoded' | 'address' | 'landmark' | 'pincode' | 'manual' | 'not_found' | 'failed'
  geocode_label: string
  geocode_provider: string
  geocode_updated_at: string | null
  map_radius_m: number | null
  cpu_serial: string | null
  monitor_serial: string | null
  issues: IssueType[]
  others_description: string | null
  status: ComplaintStatus
  created_at: string
  created_by: UserMini | null
  assigned_engineer: UserMini | null
  job_note: JobNote | null
  time_open_seconds: number
  time_in_status_seconds: number
}

export interface ComplaintListItem {
  id: number
  reference: string
  caller_name: string | null
  caller_phone: string
  zone: Zone | null
  issues: IssueType[]
  status: ComplaintStatus
  assigned_engineer: string | null
  created_by: UserMini | null
  created_at: string
  time_open_seconds: number
  time_in_status_seconds: number
}

export interface ComplaintLimited {
  id: number
  reference: string
  zone: string | null
  address: string | null
  status: ComplaintStatus
  created_at: string
}

export interface StatusHistory {
  id: number
  previous_status: ComplaintStatus | null
  new_status: ComplaintStatus
  changed_at: string
  changed_by: UserMini | null
  remark: string | null
}

export interface ComplaintAssignmentRecord {
  id: number
  engineer: { id: number; full_name: string }
  assigned_at: string
  assigned_by: { id: number; full_name: string } | null
  unassigned_at: string | null
  unassigned_by: { id: number; full_name: string } | null
}

export interface Comment {
  id: number
  author: UserMini
  body: string
  created_at: string
  edited_at: string | null
  is_edited: boolean
}

export interface FileUploadItem {
  id: number
  file_url: string
  file_type: 'image' | 'pdf'
  original_name: string
}

export interface FileUploadBatch {
  batch_number: number
  uploaded_at: string
  uploaded_by: UserMini | null
  files: FileUploadItem[]
}

export interface UploadBatchResult {
  batch_number: number
  files: FileUploadItem[]
}

export type ComplaintOrdering = 'created_at' | 'updated_at'

export type ComplaintPeriod = 'total' | 'today' | 'week' | 'month' | 'last_month'

export interface ComplaintKpis {
  total: number
  today: number
  week: number
  month: number
  last_month: number
  by_status: Record<ComplaintStatus, number>
  generated_at: string
}

export interface ZonePerformanceRow {
  zone_id: number
  zone_name: string
  total: number
  active: number
  closed: number
  engineers: number
}

export interface ZonePerformanceResponse {
  zones: ZonePerformanceRow[]
}

export interface ComplaintListParams {
  period?: ComplaintPeriod
  status?: ComplaintStatus | ComplaintStatus[]
  zone?: number | number[]
  assigned_engineer?: number | number[]
  date_from?: string
  date_to?: string
  search?: string
  ordering?: ComplaintOrdering
  page?: number
  page_size?: number
}

export interface CreateComplaintPayload {
  caller_phone: string
  caller_name?: string | null
  bmid?: string | null
  aadhaar?: string | null
  zone_id?: number | null
  department?: string | null
  designation?: string | null
  address?: string | null
  address_remark?: string | null
  pincode?: string | null
  latitude?: number | null
  longitude?: number | null
  geocode_status?: 'not_geocoded' | 'address' | 'landmark' | 'pincode' | 'manual' | 'not_found' | 'failed'
  geocode_label?: string | null
  geocode_provider?: string | null
  map_radius_m?: number | null
  cpu_serial?: string | null
  monitor_serial?: string | null
  issue_ids: number[]
  others_description?: string | null
}

export interface UpdateComplaintPayload {
  caller_name?: string | null
  caller_phone?: string
  department?: string | null
  designation?: string | null
  address?: string | null
  address_remark?: string | null
  pincode?: string | null
  latitude?: number | null
  longitude?: number | null
  geocode_status?: 'not_geocoded' | 'address' | 'landmark' | 'pincode' | 'manual' | 'not_found' | 'failed'
  geocode_label?: string | null
  geocode_provider?: string | null
  map_radius_m?: number | null
  cpu_serial?: string | null
  monitor_serial?: string | null
}

export interface AssignPayload {
  engineer_id: number
  remark?: string
}

export interface StatusUpdatePayload {
  status: ComplaintStatus
  remark?: string
}

export interface JobNotePayload {
  text: string
}

export interface ReopenPayload {
  remark: string
}
