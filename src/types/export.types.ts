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
  zone_ids: number[]
  statuses: ComplaintStatus[]
  date_from: string | null
  date_to: string | null
  assigned_engineer_ids: number[]
  cpu_serial_contains: string | null
}

export interface ExportConfig {
  columns: ExportColumnKey[]
  column_order: ExportColumnKey[]
  filters: ExportFilters
  deduplicate: boolean
}

export interface ExportPreviewRequest {
  columns?: ExportColumnKey[]
  filters: ExportFilters
  deduplicate: boolean
}

export type ExportPreviewRow = Partial<
  Record<ExportColumnKey, string | number>
>

export interface ExportPreview {
  total_matching: number
  after_deduplication: number
  deduplicated_count: number
  columns: ExportColumnKey[]
  rows: ExportPreviewRow[]
}
