import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/types/complaint.types'

interface StatusTabBarProps {
  statuses: ComplaintStatus[]
  value: ComplaintStatus | 'all'
  onChange: (value: ComplaintStatus | 'all') => void
}

const StatusTabBar = ({ statuses, value, onChange }: StatusTabBarProps) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-px">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          value === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        {t('common.all')}
      </button>
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={cn(
            'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            value === status
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`status.${status}`)}
        </button>
      ))}
    </div>
  )
}

export default StatusTabBar
