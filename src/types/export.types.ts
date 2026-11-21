import type { ComplaintStatus } from './complaint.types'

export type ExportColumnKey =
  | 'id'
  | 'caller_name'
  | 'caller_phone'
  | 'zone'
  | 'issues'
  | 'status'
  | 'assigned_engineer'
  | 'cpu_serial'
  | 'monitor_serial'
  | 'created_at'
  | 'time_open'
  | 'department'
  | 'designation'
  | 'bmid'
  | 'address'
  | 'pincode'

export interface ExportFilters {
  zone_id: number | null
  status: ComplaintStatus | null
  date_from: string | null
  date_to: string | null
  assigned_engineer_id: number | null
  cpu_serial_contains: string | null
}

export interface ExportConfig {
  columns: ExportColumnKey[]
  column_order: ExportColumnKey[]
  filters: ExportFilters
  deduplicate: boolean
}

export interface ExportPreviewRequest {
  filters: ExportFilters
  deduplicate: boolean
}

export interface ExportPreview {
  total_matching: number
  after_deduplication: number
  deduplicated_count: number
}
