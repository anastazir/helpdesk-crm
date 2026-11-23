import type { UserRole } from '@/types/auth.types'
import type { ComplaintStatus } from '@/types/complaint.types'
import type { ExportColumnKey } from '@/types/export.types'

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  parts_requested: 'Parts Requested',
  parts_provided: 'Parts Provided',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_BADGE_CLASSES: Record<ComplaintStatus, string> = {
  open: 'bg-slate-100 text-slate-600',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  parts_requested: 'bg-violet-100 text-violet-700',
  parts_provided: 'bg-cyan-100 text-cyan-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-green-700 text-white',
}

export const STATUS_CHART_COLORS: Record<ComplaintStatus, string> = {
  open: '#94A3B8',
  assigned: '#3B82F6',
  in_progress: '#F59E0B',
  parts_requested: '#8B5CF6',
  parts_provided: '#06B6D4',
  resolved: '#22C55E',
  closed: '#15803D',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  helpdesk: 'Help Desk',
  engineer: 'Engineer',
}

export const SLA_OVERDUE_SECONDS = 7 * 24 * 60 * 60

export const EXPORT_COLUMN_LABELS: Record<ExportColumnKey, string> = {
  id: 'Complaint ID',
  caller_name: 'Caller Name',
  caller_phone: 'Phone',
  zone: 'Zone',
  issues: 'Issue(s)',
  status: 'Status',
  assigned_engineer: 'Assigned Engineer',
  cpu_serial: 'CPU Serial No',
  monitor_serial: 'Monitor Serial No',
  created_at: 'Created At',
  time_open: 'Time Open',
  department: 'Department',
  designation: 'Designation',
  bmid: 'BMID',
  address: 'Address',
  pincode: 'Pincode',
}

export const STATUS_ORDER: ComplaintStatus[] = [
  'open',
  'assigned',
  'in_progress',
  'parts_requested',
  'parts_provided',
  'resolved',
  'closed',
]

export const ENGINEER_STATUSES: ComplaintStatus[] = [
  'assigned',
  'in_progress',
  'parts_requested',
  'parts_provided',
  'resolved',
]

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/dashboard',
  supervisor: '/complaints',
  helpdesk: '/dashboard',
  engineer: '/engineer/complaints',
}

export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
]
