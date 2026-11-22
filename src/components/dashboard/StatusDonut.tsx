import { useTranslation } from 'react-i18next'

import type { ComplaintStatus } from '@/types/complaint.types'
import { STATUS_CHART_COLORS, STATUS_ORDER } from '@/utils/constants'

interface StatusDonutProps {
  counts: Record<ComplaintStatus, number>
}

const StatusDonut = ({ counts }: StatusDonutProps) => {
  const { t } = useTranslation()
  const total = STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0)

  const segments = STATUS_ORDER.filter((status) => counts[status] > 0).map(
    (status) => ({
      status,
      count: counts[status],
      percentage: total > 0 ? (counts[status] / total) * 100 : 0,
    }),
  )

  let cursor = 0
  const gradientParts = segments.map((segment) => {
    const start = cursor
    cursor += segment.percentage
    return `${STATUS_CHART_COLORS[segment.status]} ${start}% ${cursor}%`
  })
  const background =
    gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(', ')})`
      : 'hsl(var(--muted))'

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-5 overflow-hidden">
      <div
        className="relative h-44 w-44 shrink-0 rounded-full"
        style={{ background }}
        role="img"
        aria-label={t('dashboard.statusDistribution')}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
          <span className="text-3xl font-semibold text-foreground">{total}</span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('dashboard.totalLabel')}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2">
        {segments.map((segment) => (
          <li
            key={segment.status}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: STATUS_CHART_COLORS[segment.status] }}
              />
              <span className="truncate text-muted-foreground">
                {t(`status.${segment.status}`)}
              </span>
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {segment.count}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {Math.round(segment.percentage)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StatusDonut
