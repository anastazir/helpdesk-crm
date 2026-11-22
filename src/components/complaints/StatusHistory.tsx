import { useTranslation } from 'react-i18next'

import RoleBadge from '@/components/common/RoleBadge'
import type { StatusHistory as StatusHistoryRecord } from '@/types/complaint.types'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface StatusHistoryProps {
  history: StatusHistoryRecord[]
}

interface ReassignmentDetails {
  previousEngineer: string
  currentEngineer: string
  extraRemark: string
}

interface AssignmentDetails {
  engineer: string
  extraRemark: string
}

const parseReassignment = (
  entry: StatusHistoryRecord,
): ReassignmentDetails | null => {
  if (!entry.remark || entry.previous_status !== entry.new_status) return null

  const match = entry.remark.match(
    /^Reassigned from (.+?) to (.+?)\.(?:\s+([\s\S]*))?$/,
  )
  if (!match) return null

  return {
    previousEngineer: match[1],
    currentEngineer: match[2],
    extraRemark: (match[3] ?? '').trim(),
  }
}

const parseAssignment = (
  entry: StatusHistoryRecord,
): AssignmentDetails | null => {
  if (!entry.remark || entry.new_status !== 'assigned') return null

  const match = entry.remark.match(/^Assigned to (.+?)\.(?:\s+([\s\S]*))?$/)
  if (!match) return null

  return {
    engineer: match[1],
    extraRemark: (match[2] ?? '').trim(),
  }
}

const StatusHistory = ({ history }: StatusHistoryProps) => {
  const { t } = useTranslation()

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('complaint.noHistory')}</p>
  }

  const ordered = [...history].sort((a, b) => {
    const timeDifference =
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    return timeDifference !== 0 ? timeDifference : b.id - a.id
  })

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {ordered.map((entry) => {
        const reassignment = parseReassignment(entry)
        const assignment = parseAssignment(entry)
        const extraRemark =
          reassignment || assignment
            ? reassignment?.extraRemark || assignment?.extraRemark || ''
            : entry.remark

        return (
          <li key={entry.id} className="relative">
            <span
              className={cn(
                'absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900',
                STATUS_BADGE_CLASSES[entry.new_status],
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {reassignment
                  ? t('complaint.reassigned')
                  : t(`status.${entry.new_status}`)}
              </span>
              {entry.changed_by && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.changed_by.full_name}
                  </span>
                  <RoleBadge role={entry.changed_by.role} className="text-[10px]" />
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(entry.changed_at)}
            </p>

            {reassignment && (
              <div className="mt-2 space-y-1 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {t('complaint.previousAssignee')}:
                  </span>{' '}
                  <span className="font-medium text-foreground">
                    {reassignment.previousEngineer}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {t('complaint.currentAssignee')}:
                  </span>{' '}
                  <span className="font-medium text-foreground">
                    {reassignment.currentEngineer}
                  </span>
                </p>
              </div>
            )}

            {assignment && (
              <p className="mt-1 text-sm">
                <span className="text-muted-foreground">
                  {t('complaint.assignedTo')}:
                </span>{' '}
                <span className="font-medium text-foreground">
                  {assignment.engineer}
                </span>
              </p>
            )}

            {extraRemark && (
              <p className="mt-2 rounded bg-muted px-3 py-2 text-sm italic text-muted-foreground">
                {extraRemark}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default StatusHistory
