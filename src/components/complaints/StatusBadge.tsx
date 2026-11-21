import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/types/complaint.types'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'

interface StatusBadgeProps {
  status: ComplaintStatus
  className?: string
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider',
        STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}

export default StatusBadge
