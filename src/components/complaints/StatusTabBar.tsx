import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/types/complaint.types'

interface StatusTabBarProps {
  statuses: ComplaintStatus[]
  value: ComplaintStatus[]
  onChange: (value: ComplaintStatus[]) => void
}

const StatusTabBar = ({ statuses, value, onChange }: StatusTabBarProps) => {
  const { t } = useTranslation()

  const toggleStatus = (status: ComplaintStatus) => {
    onChange(
      value.includes(status)
        ? value.filter((item) => item !== status)
        : [...value, status],
    )
  }

  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-px">
      <button
        type="button"
        onClick={() => onChange([])}
        className={cn(
          'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          value.length === 0
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        {t('common.all')}
      </button>
      {statuses.map((status) => {
        const selected = value.includes(status)
        return (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              selected
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`status.${status}`)}
          </button>
        )
      })}
    </div>
  )
}

export default StatusTabBar
