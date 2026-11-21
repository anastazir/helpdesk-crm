import { useTranslation } from 'react-i18next'

import RoleBadge from '@/components/common/RoleBadge'
import type { StatusHistory as StatusHistoryRecord } from '@/types/complaint.types'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface StatusHistoryProps {
  history: StatusHistoryRecord[]
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
      {ordered.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              'absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900',
              STATUS_BADGE_CLASSES[entry.new_status],
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t(`status.${entry.new_status}`)}
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
          {entry.remark && (
            <p className="mt-2 rounded bg-muted px-3 py-2 text-sm italic text-muted-foreground">
              {entry.remark}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}

export default StatusHistory
