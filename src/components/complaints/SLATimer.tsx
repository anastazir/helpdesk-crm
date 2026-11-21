import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/formatters'
import { SLA_OVERDUE_SECONDS } from '@/utils/constants'

interface SLATimerProps {
  seconds: number
  showRedThreshold?: number
  className?: string
}

const SLATimer = ({
  seconds,
  showRedThreshold = SLA_OVERDUE_SECONDS,
  className,
}: SLATimerProps) => {
  const { t } = useTranslation()
  const isOverdue = seconds > showRedThreshold

  return (
    <span
      className={cn(
        'text-sm',
        isOverdue ? 'font-semibold text-red-600' : 'text-muted-foreground',
        className,
      )}
      title={isOverdue ? t('time.overdue') : undefined}
    >
      {formatDuration(seconds)}
    </span>
  )
}

export default SLATimer
